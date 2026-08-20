use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};

declare_id!("MINTg1111111111111111111111111111111111111111");

/// ─── Program ────────────────────────────────────────────────────────────────
/// Manages AXVN Mint/Burn lifecycle tied to IP Escrow Deeds and Whitelist.
#[program]
pub mod vnkr_mint_governance {
    use super::*;

    /// Initialize the Governance config (called once by the Holding admin).
    pub fn initialize(ctx: Context<Initialize>, params: GovernanceParams) -> Result<()> {
        let cfg = &mut ctx.accounts.governance_config;
        cfg.authority   = ctx.accounts.authority.key();
        cfg.axvn_mint   = ctx.accounts.axvn_mint.key();
        cfg.max_supply  = params.max_supply;
        cfg.current_supply = 0;
        cfg.bump        = ctx.bumps.governance_config;
        Ok(())
    }

    /// Whitelist a wallet to be eligible for receiving minted AXVN.
    pub fn add_to_whitelist(ctx: Context<ManageWhitelist>, wallet: Pubkey) -> Result<()> {
        let entry = &mut ctx.accounts.whitelist_entry;
        entry.wallet  = wallet;
        entry.active  = true;
        entry.bump    = ctx.bumps.whitelist_entry;
        emit!(WhitelistUpdated { wallet, active: true });
        Ok(())
    }

    /// Remove a wallet from the whitelist.
    pub fn remove_from_whitelist(ctx: Context<ManageWhitelist>, _wallet: Pubkey) -> Result<()> {
        ctx.accounts.whitelist_entry.active = false;
        emit!(WhitelistUpdated { wallet: ctx.accounts.whitelist_entry.wallet, active: false });
        Ok(())
    }

    /// Mint AXVN to a whitelisted recipient (backed by IP Escrow Deed proof).
    pub fn mint_axvn(ctx: Context<MintAXVN>, amount: u64, deed_ref: [u8; 32]) -> Result<()> {
        let cfg = &mut ctx.accounts.governance_config;
        require!(
            cfg.current_supply.checked_add(amount).unwrap() <= cfg.max_supply,
            MintError::SupplyCapExceeded
        );
        require!(ctx.accounts.whitelist_entry.active, MintError::NotWhitelisted);

        cfg.current_supply += amount;

        let seeds: &[&[u8]] = &[b"governance_config", &[cfg.bump]];
        let signer = &[seeds];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint:      ctx.accounts.axvn_mint.to_account_info(),
                to:        ctx.accounts.recipient_ata.to_account_info(),
                authority: ctx.accounts.governance_config.to_account_info(),
            },
            signer,
        );
        token::mint_to(cpi_ctx, amount)?;

        emit!(MintEvent { recipient: ctx.accounts.recipient_ata.owner, amount, deed_ref });
        Ok(())
    }

    /// Burn AXVN from a holder (governance-approved redemption).
    pub fn burn_axvn(ctx: Context<BurnAXVN>, amount: u64) -> Result<()> {
        let cfg = &mut ctx.accounts.governance_config;
        cfg.current_supply = cfg.current_supply.saturating_sub(amount);

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint:      ctx.accounts.axvn_mint.to_account_info(),
                from:      ctx.accounts.holder_ata.to_account_info(),
                authority: ctx.accounts.holder.to_account_info(),
            },
        );
        token::burn(cpi_ctx, amount)?;

        emit!(BurnEvent { holder: ctx.accounts.holder.key(), amount });
        Ok(())
    }
}

// ─── Params ───────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GovernanceParams {
    pub max_supply: u64,
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = GovernanceConfig::LEN,
        seeds = [b"governance_config"],
        bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    pub axvn_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct ManageWhitelist<'info> {
    #[account(mut, constraint = governance_config.authority == authority.key())]
    pub authority: Signer<'info>,

    #[account(seeds = [b"governance_config"], bump = governance_config.bump)]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(
        init_if_needed,
        payer = authority,
        space = WhitelistEntry::LEN,
        seeds = [b"whitelist", wallet.as_ref()],
        bump
    )]
    pub whitelist_entry: Account<'info, WhitelistEntry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintAXVN<'info> {
    #[account(mut, constraint = governance_config.authority == authority.key())]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [b"governance_config"], bump = governance_config.bump)]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(seeds = [b"whitelist", recipient_ata.owner.as_ref()], bump = whitelist_entry.bump)]
    pub whitelist_entry: Account<'info, WhitelistEntry>,

    #[account(mut, constraint = axvn_mint.key() == governance_config.axvn_mint)]
    pub axvn_mint: Account<'info, Mint>,

    #[account(mut)]
    pub recipient_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnAXVN<'info> {
    #[account(mut)]
    pub holder: Signer<'info>,

    #[account(mut, seeds = [b"governance_config"], bump = governance_config.bump)]
    pub governance_config: Account<'info, GovernanceConfig>,

    #[account(mut, constraint = axvn_mint.key() == governance_config.axvn_mint)]
    pub axvn_mint: Account<'info, Mint>,

    #[account(mut, constraint = holder_ata.owner == holder.key())]
    pub holder_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct GovernanceConfig {
    pub authority:      Pubkey,
    pub axvn_mint:      Pubkey,
    pub max_supply:     u64,
    pub current_supply: u64,
    pub bump:           u8,
}

impl GovernanceConfig {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

#[account]
pub struct WhitelistEntry {
    pub wallet: Pubkey,
    pub active: bool,
    pub bump:   u8,
}

impl WhitelistEntry {
    pub const LEN: usize = 8 + 32 + 1 + 1;
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct WhitelistUpdated { pub wallet: Pubkey, pub active: bool }

#[event]
pub struct MintEvent { pub recipient: Pubkey, pub amount: u64, pub deed_ref: [u8; 32] }

#[event]
pub struct BurnEvent { pub holder: Pubkey, pub amount: u64 }

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum MintError {
    #[msg("Max supply cap exceeded")]
    SupplyCapExceeded,
    #[msg("Recipient wallet is not whitelisted")]
    NotWhitelisted,
}
