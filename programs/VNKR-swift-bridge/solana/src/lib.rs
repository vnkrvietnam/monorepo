use anchor_lang::prelude::*;

declare_id!("SWFTb1111111111111111111111111111111111111111");

// ─── VNKR Swift Bridge — Solana Anchor Program ────────────────────────────────
//
// Phiên bản Solana của VNKRSwiftBridge (tương đương VNKRSwiftBridge.sol trên EVM).
//
// Luồng INBOUND  (SWIFT Fiat → Mint SPL Token AXVN):
//   Relayer (swift-chain-bridge) gọi settle_inbound_swift() sau khi nhận
//   xác nhận điện MT103/pacs.008 từ swift-gateway.
//
// Luồng OUTBOUND (Burn SPL Token → SWIFT Fiat):
//   Người dùng gọi request_outbound_swift() → Burn AXVN từ ATA
//   → Emit event → Relayer bắt log → gọi swift-gateway /send-mt103.

#[program]
pub mod vnkr_swift_bridge {
    use super::*;

    // ─── Khởi tạo Bridge State ────────────────────────────────────────────────

    pub fn initialize(
        ctx: Context<Initialize>,
        conversion_rate: u64,   // Tỷ lệ AXVN/USD, default 1_000_000 (1:1 với 6 decimals)
        bridge_fee_bps: u16,    // Phí basis points (100 = 1%), max 1000
    ) -> Result<()> {
        require!(conversion_rate > 0, BridgeError::ZeroConversionRate);
        require!(bridge_fee_bps <= 1000, BridgeError::FeeTooHigh);

        let state = &mut ctx.accounts.bridge_state;
        state.oracle_relayer   = ctx.accounts.relayer.key();
        state.owner            = ctx.accounts.owner.key();
        state.axvn_mint        = ctx.accounts.axvn_mint.key();
        state.fee_recipient    = ctx.accounts.fee_recipient.key();
        state.conversion_rate  = conversion_rate;
        state.bridge_fee_bps   = bridge_fee_bps;
        state.total_inbound    = 0;
        state.total_outbound   = 0;
        state.bump             = ctx.bumps.bridge_state;

        emit!(BridgeInitialized {
            oracle_relayer: state.oracle_relayer,
            axvn_mint:      state.axvn_mint,
        });
        Ok(())
    }

    // ─── INBOUND: Relayer settle sau khi SWIFT ACK ────────────────────────────

    /// Relayer gọi hàm này sau khi swift-gateway xác nhận nhận điện inbound.
    /// Mint AXVN SPL Token tương ứng cho ví beneficiary.
    pub fn settle_inbound_swift(
        ctx: Context<SettleInbound>,
        uetr: [u8; 36],            // UUID v4 dạng bytes (36 chars)
        sender_bic: [u8; 11],      // BIC11 của ngân hàng gửi
        amount_usd_micro: u64,     // Số tiền USD * 1e6 (micro-dollar)
    ) -> Result<()> {
        require!(amount_usd_micro > 0, BridgeError::ZeroAmount);

        let state = &mut ctx.accounts.bridge_state;
        require!(
            ctx.accounts.relayer.key() == state.oracle_relayer,
            BridgeError::UnauthorizedRelayer
        );

        // Kiểm tra record chưa tồn tại (idempotency)
        let record = &mut ctx.accounts.swift_record;
        require!(
            record.status == TransactionStatus::None,
            BridgeError::UetrAlreadyProcessed
        );

        // Tính token amount sau phí
        let fee_micro       = (amount_usd_micro as u128 * state.bridge_fee_bps as u128) / 10_000;
        let net_micro       = amount_usd_micro as u128 - fee_micro;
        let token_amount    = ((net_micro * state.conversion_rate as u128) / 1_000_000) as u64;
        let fee_token_amount= ((fee_micro * state.conversion_rate as u128) / 1_000_000) as u64;

        // Ghi record
        record.uetr              = uetr;
        record.sender_bic        = sender_bic;
        record.receiver_bic      = *b"VNKRVNVNXXX";
        record.amount_usd_micro  = amount_usd_micro;
        record.token_amount      = token_amount;
        record.beneficiary       = ctx.accounts.beneficiary.key();
        record.status            = TransactionStatus::Settled;
        record.settled_at        = Clock::get()?.unix_timestamp;
        record.bump              = ctx.bumps.swift_record;

        state.total_inbound = state.total_inbound.checked_add(token_amount)
            .ok_or(BridgeError::Overflow)?;

        // Mint AXVN cho beneficiary (CPI vào Token Program)
        let seeds: &[&[u8]] = &[b"bridge_state", &[state.bump]];
        let signer = &[seeds];

        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint:      ctx.accounts.axvn_mint.to_account_info(),
                    to:        ctx.accounts.beneficiary_ata.to_account_info(),
                    authority: ctx.accounts.bridge_state.to_account_info(),
                },
                signer,
            ),
            token_amount,
        )?;

        // Mint phí cho fee_recipient
        if fee_token_amount > 0 {
            anchor_spl::token::mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    anchor_spl::token::MintTo {
                        mint:      ctx.accounts.axvn_mint.to_account_info(),
                        to:        ctx.accounts.fee_recipient_ata.to_account_info(),
                        authority: ctx.accounts.bridge_state.to_account_info(),
                    },
                    signer,
                ),
                fee_token_amount,
            )?;
        }

        emit!(SwiftInboundSettled {
            uetr,
            beneficiary:      ctx.accounts.beneficiary.key(),
            amount_usd_micro,
            token_amount,
            sender_bic,
        });
        Ok(())
    }

    // ─── OUTBOUND: User burn token → kích hoạt SWIFT transfer ────────────────

    /// Người dùng/Định chế burn AXVN Token để yêu cầu chuyển tiền SWIFT.
    /// Relayer sẽ bắt event SwiftOutboundRequested → gọi swift-gateway.
    pub fn request_outbound_swift(
        ctx: Context<RequestOutbound>,
        uetr: [u8; 36],
        receiver_bic: [u8; 11],
        amount_usd_micro: u64,
    ) -> Result<()> {
        require!(amount_usd_micro > 0, BridgeError::ZeroAmount);

        let state = &mut ctx.accounts.bridge_state;
        let record = &mut ctx.accounts.swift_record;

        require!(
            record.status == TransactionStatus::None,
            BridgeError::DuplicateUetr
        );

        let token_amount_to_burn = ((amount_usd_micro as u128 * state.conversion_rate as u128)
            / 1_000_000) as u64;

        // Burn AXVN từ ATA của người dùng
        anchor_spl::token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Burn {
                    mint:      ctx.accounts.axvn_mint.to_account_info(),
                    from:      ctx.accounts.sender_ata.to_account_info(),
                    authority: ctx.accounts.sender.to_account_info(),
                },
            ),
            token_amount_to_burn,
        )?;

        record.uetr             = uetr;
        record.sender_bic       = *b"VNKRVNVNXXX";
        record.receiver_bic     = receiver_bic;
        record.amount_usd_micro = amount_usd_micro;
        record.token_amount     = token_amount_to_burn;
        record.beneficiary      = ctx.accounts.sender.key();
        record.status           = TransactionStatus::Pending;
        record.settled_at       = 0;
        record.bump             = ctx.bumps.swift_record;

        state.total_outbound = state.total_outbound.checked_add(token_amount_to_burn)
            .ok_or(BridgeError::Overflow)?;

        emit!(SwiftOutboundRequested {
            uetr,
            sender:              ctx.accounts.sender.key(),
            receiver_bic,
            amount_usd_micro,
            token_amount_burned: token_amount_to_burn,
        });
        Ok(())
    }

    /// Relayer xác nhận outbound đã gửi thành công (MGW ACK).
    pub fn confirm_outbound_swift(
        ctx: Context<ConfirmOutbound>,
        _uetr: [u8; 36],
        transmission_id: [u8; 32],
    ) -> Result<()> {
        let state = &ctx.accounts.bridge_state;
        require!(
            ctx.accounts.relayer.key() == state.oracle_relayer,
            BridgeError::UnauthorizedRelayer
        );

        let record = &mut ctx.accounts.swift_record;
        require!(record.status == TransactionStatus::Pending, BridgeError::RecordNotPending);

        record.status    = TransactionStatus::Settled;
        record.settled_at = Clock::get()?.unix_timestamp;

        emit!(SwiftOutboundSettled {
            uetr:            record.uetr,
            transmission_id,
        });
        Ok(())
    }

    /// Relayer hoàn token khi SWIFT thất bại.
    pub fn refund_outbound_swift(ctx: Context<RefundOutbound>, _uetr: [u8; 36]) -> Result<()> {
        let state = &ctx.accounts.bridge_state;
        require!(
            ctx.accounts.relayer.key() == state.oracle_relayer,
            BridgeError::UnauthorizedRelayer
        );

        let record = &mut ctx.accounts.swift_record;
        require!(record.status == TransactionStatus::Pending, BridgeError::RecordNotPending);

        let token_amount = record.token_amount;
        record.status    = TransactionStatus::Refunded;
        record.settled_at = Clock::get()?.unix_timestamp;

        // Mint lại token cho người đã burn
        let seeds: &[&[u8]] = &[b"bridge_state", &[state.bump]];
        let signer = &[seeds];

        anchor_spl::token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    mint:      ctx.accounts.axvn_mint.to_account_info(),
                    to:        ctx.accounts.beneficiary_ata.to_account_info(),
                    authority: ctx.accounts.bridge_state.to_account_info(),
                },
                signer,
            ),
            token_amount,
        )?;

        emit!(SwiftOutboundRefunded {
            uetr:         record.uetr,
            to:           record.beneficiary,
            token_amount,
        });
        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub relayer: SystemAccount<'info>,

    #[account(
        init,
        payer = owner,
        space = BridgeState::LEN,
        seeds = [b"bridge_state"],
        bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    pub axvn_mint:      anchor_spl::token::Mint,
    pub fee_recipient:  SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(uetr: [u8; 36])]
pub struct SettleInbound<'info> {
    pub relayer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bridge_state"],
        bump  = bridge_state.bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        init,
        payer  = relayer,
        space  = SwiftRecord::LEN,
        seeds  = [b"swift_record", uetr.as_ref()],
        bump
    )]
    pub swift_record: Account<'info, SwiftRecord>,

    /// CHECK: verified in instruction
    pub beneficiary:      AccountInfo<'info>,
    #[account(mut)]
    pub beneficiary_ata:  Account<'info, anchor_spl::token::TokenAccount>,
    #[account(mut)]
    pub fee_recipient_ata: Account<'info, anchor_spl::token::TokenAccount>,
    #[account(mut)]
    pub axvn_mint:        Account<'info, anchor_spl::token::Mint>,
    pub token_program:    Program<'info, anchor_spl::token::Token>,
    pub system_program:   Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(uetr: [u8; 36])]
pub struct RequestOutbound<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bridge_state"],
        bump  = bridge_state.bump
    )]
    pub bridge_state: Account<'info, BridgeState>,

    #[account(
        init,
        payer  = sender,
        space  = SwiftRecord::LEN,
        seeds  = [b"swift_record", uetr.as_ref()],
        bump
    )]
    pub swift_record: Account<'info, SwiftRecord>,

    #[account(mut)]
    pub sender_ata:    Account<'info, anchor_spl::token::TokenAccount>,
    #[account(mut)]
    pub axvn_mint:     Account<'info, anchor_spl::token::Mint>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(uetr: [u8; 36])]
pub struct ConfirmOutbound<'info> {
    pub relayer:      Signer<'info>,
    #[account(seeds = [b"bridge_state"], bump = bridge_state.bump)]
    pub bridge_state: Account<'info, BridgeState>,
    #[account(
        mut,
        seeds = [b"swift_record", uetr.as_ref()],
        bump  = swift_record.bump
    )]
    pub swift_record: Account<'info, SwiftRecord>,
}

#[derive(Accounts)]
#[instruction(uetr: [u8; 36])]
pub struct RefundOutbound<'info> {
    pub relayer:       Signer<'info>,
    #[account(seeds = [b"bridge_state"], bump = bridge_state.bump)]
    pub bridge_state:  Account<'info, BridgeState>,
    #[account(
        mut,
        seeds = [b"swift_record", uetr.as_ref()],
        bump  = swift_record.bump
    )]
    pub swift_record:     Account<'info, SwiftRecord>,
    #[account(mut)]
    pub beneficiary_ata:  Account<'info, anchor_spl::token::TokenAccount>,
    #[account(mut)]
    pub axvn_mint:        Account<'info, anchor_spl::token::Mint>,
    pub token_program:    Program<'info, anchor_spl::token::Token>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct BridgeState {
    pub oracle_relayer:  Pubkey,
    pub owner:           Pubkey,
    pub axvn_mint:       Pubkey,
    pub fee_recipient:   Pubkey,
    pub conversion_rate: u64,
    pub bridge_fee_bps:  u16,
    pub total_inbound:   u64,
    pub total_outbound:  u64,
    pub bump:            u8,
}

impl BridgeState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 2 + 8 + 8 + 1;
}

#[account]
pub struct SwiftRecord {
    pub uetr:             [u8; 36],
    pub sender_bic:       [u8; 11],
    pub receiver_bic:     [u8; 11],
    pub amount_usd_micro: u64,
    pub token_amount:     u64,
    pub beneficiary:      Pubkey,
    pub status:           TransactionStatus,
    pub settled_at:       i64,
    pub bump:             u8,
}

impl SwiftRecord {
    pub const LEN: usize = 8 + 36 + 11 + 11 + 8 + 8 + 32 + 1 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TransactionStatus {
    None,
    Pending,
    Settled,
    Failed,
    Refunded,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct BridgeInitialized {
    pub oracle_relayer: Pubkey,
    pub axvn_mint:      Pubkey,
}

#[event]
pub struct SwiftInboundSettled {
    pub uetr:             [u8; 36],
    pub beneficiary:      Pubkey,
    pub amount_usd_micro: u64,
    pub token_amount:     u64,
    pub sender_bic:       [u8; 11],
}

#[event]
pub struct SwiftOutboundRequested {
    pub uetr:                [u8; 36],
    pub sender:              Pubkey,
    pub receiver_bic:        [u8; 11],
    pub amount_usd_micro:    u64,
    pub token_amount_burned: u64,
}

#[event]
pub struct SwiftOutboundSettled {
    pub uetr:            [u8; 36],
    pub transmission_id: [u8; 32],
}

#[event]
pub struct SwiftOutboundRefunded {
    pub uetr:         [u8; 36],
    pub to:           Pubkey,
    pub token_amount: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum BridgeError {
    #[msg("Unauthorized: caller is not the oracle relayer")]
    UnauthorizedRelayer,
    #[msg("UETR has already been processed")]
    UetrAlreadyProcessed,
    #[msg("Duplicate UETR in outbound request")]
    DuplicateUetr,
    #[msg("Record is not in PENDING status")]
    RecordNotPending,
    #[msg("Amount cannot be zero")]
    ZeroAmount,
    #[msg("Conversion rate cannot be zero")]
    ZeroConversionRate,
    #[msg("Bridge fee cannot exceed 10% (1000 bps)")]
    FeeTooHigh,
    #[msg("Arithmetic overflow")]
    Overflow,
}
