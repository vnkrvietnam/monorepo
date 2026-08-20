use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("ESCRw1111111111111111111111111111111111111111");

/// ─── Program ────────────────────────────────────────────────────────────────
#[program]
pub mod vnkr_p2p_escrow {
    use super::*;

    /// Seller locks tokens into the Vault PDA and creates an order.
    pub fn make_offer(
        ctx: Context<MakeOffer>,
        order_id: [u8; 32],
        token_amount: u64,
        fiat_amount: u64,
        fiat_currency: [u8; 4],
    ) -> Result<()> {
        let order = &mut ctx.accounts.order_state;
        order.seller         = ctx.accounts.seller.key();
        order.order_id       = order_id;
        order.token_amount   = token_amount;
        order.fiat_amount    = fiat_amount;
        order.fiat_currency  = fiat_currency;
        order.status         = OrderStatus::Open;
        order.bump           = ctx.bumps.order_state;

        // Transfer tokens from seller ATA → Vault PDA
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.seller_ata.to_account_info(),
                to:        ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, token_amount)?;

        emit!(OfferCreated {
            order_id,
            seller: order.seller,
            token_amount,
            fiat_amount,
        });
        Ok(())
    }

    /// Fiat oracle (or buyer) confirms payment; releases tokens to buyer.
    pub fn take_offer(ctx: Context<TakeOffer>) -> Result<()> {
        require!(
            ctx.accounts.order_state.status == OrderStatus::Open,
            EscrowError::OrderNotOpen
        );
        ctx.accounts.order_state.buyer  = Some(ctx.accounts.buyer.key());
        ctx.accounts.order_state.status = OrderStatus::FiatConfirmed;

        let seeds: &[&[u8]] = &[
            b"order_state",
            ctx.accounts.order_state.order_id.as_ref(),
            &[ctx.accounts.order_state.bump],
        ];
        let signer = &[seeds];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.vault.to_account_info(),
                to:        ctx.accounts.buyer_ata.to_account_info(),
                authority: ctx.accounts.order_state.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx, ctx.accounts.order_state.token_amount)?;

        ctx.accounts.order_state.status = OrderStatus::TokenReleased;
        emit!(OfferTaken {
            order_id: ctx.accounts.order_state.order_id,
            buyer: ctx.accounts.buyer.key(),
        });
        Ok(())
    }

    /// Seller cancels an open offer and recovers tokens.
    pub fn cancel_offer(ctx: Context<CancelOffer>) -> Result<()> {
        require!(
            ctx.accounts.order_state.status == OrderStatus::Open,
            EscrowError::OrderNotOpen
        );
        ctx.accounts.order_state.status = OrderStatus::Cancelled;

        let seeds: &[&[u8]] = &[
            b"order_state",
            ctx.accounts.order_state.order_id.as_ref(),
            &[ctx.accounts.order_state.bump],
        ];
        let signer = &[seeds];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from:      ctx.accounts.vault.to_account_info(),
                to:        ctx.accounts.seller_ata.to_account_info(),
                authority: ctx.accounts.order_state.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx, ctx.accounts.order_state.token_amount)?;

        emit!(OfferCancelled { order_id: ctx.accounts.order_state.order_id });
        Ok(())
    }
}

// ─── Accounts ────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(order_id: [u8; 32])]
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        init,
        payer  = seller,
        space  = OrderState::LEN,
        seeds  = [b"order_state", order_id.as_ref()],
        bump
    )]
    pub order_state: Account<'info, OrderState>,

    #[account(
        init,
        payer        = seller,
        token::mint      = token_mint,
        token::authority = order_state,
        seeds        = [b"escrow_vault", order_id.as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = seller_ata.owner == seller.key())]
    pub seller_ata: Account<'info, TokenAccount>,

    pub token_mint:    anchor_spl::token::Mint,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent:          Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TakeOffer<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut, seeds = [b"order_state", order_state.order_id.as_ref()], bump = order_state.bump)]
    pub order_state: Account<'info, OrderState>,

    #[account(mut, seeds = [b"escrow_vault", order_state.order_id.as_ref()], bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub buyer_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelOffer<'info> {
    #[account(mut, constraint = order_state.seller == seller.key())]
    pub seller: Signer<'info>,

    #[account(mut, seeds = [b"order_state", order_state.order_id.as_ref()], bump = order_state.bump)]
    pub order_state: Account<'info, OrderState>,

    #[account(mut, seeds = [b"escrow_vault", order_state.order_id.as_ref()], bump)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct OrderState {
    pub seller:        Pubkey,
    pub buyer:         Option<Pubkey>,
    pub order_id:      [u8; 32],
    pub token_amount:  u64,
    pub fiat_amount:   u64,
    pub fiat_currency: [u8; 4],
    pub status:        OrderStatus,
    pub bump:          u8,
}

impl OrderState {
    pub const LEN: usize = 8 + 32 + (1 + 32) + 32 + 8 + 8 + 4 + 1 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OrderStatus {
    Open,
    Matched,
    FiatConfirmed,
    TokenReleased,
    Cancelled,
    Disputed,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct OfferCreated {
    pub order_id:     [u8; 32],
    pub seller:       Pubkey,
    pub token_amount: u64,
    pub fiat_amount:  u64,
}

#[event]
pub struct OfferTaken {
    pub order_id: [u8; 32],
    pub buyer:    Pubkey,
}

#[event]
pub struct OfferCancelled {
    pub order_id: [u8; 32],
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum EscrowError {
    #[msg("Order is not in OPEN status")]
    OrderNotOpen,
}
