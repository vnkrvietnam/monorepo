use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

declare_id!("TRBSr1111111111111111111111111111111111111111");

/// Range Bound Stability (RBS) Treasury — Cayman Foundation DAO governance.
/// Manages reserve assets and enforces a price stability corridor.
#[program]
pub mod vnkr_treasury_rbs {
    use super::*;

    /// Initialize the treasury with initial price bounds.
    pub fn initialize(
        ctx: Context<InitializeTreasury>,
        lower_bound: u64, // lamports / AXVN (scaled by 1e6)
        upper_bound: u64,
    ) -> Result<()> {
        require!(lower_bound < upper_bound, RbsError::InvalidBounds);
        let treasury = &mut ctx.accounts.treasury_state;
        treasury.authority   = ctx.accounts.authority.key();
        treasury.vault       = ctx.accounts.reserve_vault.key();
        treasury.lower_bound = lower_bound;
        treasury.upper_bound = upper_bound;
        treasury.total_reserves = 0;
        treasury.bump        = ctx.bumps.treasury_state;
        Ok(())
    }

    /// Governance update of RBS corridor.
    pub fn update_bounds(
        ctx: Context<UpdateBounds>,
        new_lower: u64,
        new_upper: u64,
    ) -> Result<()> {
        require!(new_lower < new_upper, RbsError::InvalidBounds);
        let treasury = &mut ctx.accounts.treasury_state;
        treasury.lower_bound = new_lower;
        treasury.upper_bound = new_upper;
        emit!(BoundsUpdated { new_lower, new_upper });
        Ok(())
    }

    /// Deposit reserve assets into the treasury vault.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from:      ctx.accounts.depositor_ata.to_account_info(),
                    to:        ctx.accounts.reserve_vault.to_account_info(),
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            amount,
        )?;
        ctx.accounts.treasury_state.total_reserves += amount;
        emit!(DepositEvent { depositor: ctx.accounts.depositor.key(), amount });
        Ok(())
    }

    /// DAO-authorised withdrawal from treasury vault.
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let treasury = &ctx.accounts.treasury_state;
        require!(amount <= treasury.total_reserves, RbsError::InsufficientReserves);

        let seeds: &[&[u8]] = &[b"treasury_state", &[treasury.bump]];
        let signer = &[seeds];
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from:      ctx.accounts.reserve_vault.to_account_info(),
                    to:        ctx.accounts.recipient_ata.to_account_info(),
                    authority: ctx.accounts.treasury_state.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;
        ctx.accounts.treasury_state.total_reserves -= amount;
        emit!(WithdrawEvent { recipient: ctx.accounts.recipient_ata.owner, amount });
        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = TreasuryState::LEN,
        seeds = [b"treasury_state"],
        bump
    )]
    pub treasury_state: Account<'info, TreasuryState>,

    pub reserve_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBounds<'info> {
    #[account(constraint = treasury_state.authority == authority.key())]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [b"treasury_state"], bump = treasury_state.bump)]
    pub treasury_state: Account<'info, TreasuryState>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    pub depositor: Signer<'info>,

    #[account(mut, seeds = [b"treasury_state"], bump = treasury_state.bump)]
    pub treasury_state: Account<'info, TreasuryState>,

    #[account(mut, constraint = reserve_vault.key() == treasury_state.vault)]
    pub reserve_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(constraint = treasury_state.authority == authority.key())]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [b"treasury_state"], bump = treasury_state.bump)]
    pub treasury_state: Account<'info, TreasuryState>,

    #[account(mut, constraint = reserve_vault.key() == treasury_state.vault)]
    pub reserve_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct TreasuryState {
    pub authority:      Pubkey,
    pub vault:          Pubkey,
    pub lower_bound:    u64,
    pub upper_bound:    u64,
    pub total_reserves: u64,
    pub bump:           u8,
}

impl TreasuryState {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 8 + 1;
}

// ─── Events & Errors ──────────────────────────────────────────────────────────

#[event]
pub struct BoundsUpdated  { pub new_lower: u64, pub new_upper: u64 }

#[event]
pub struct DepositEvent   { pub depositor: Pubkey, pub amount: u64 }

#[event]
pub struct WithdrawEvent  { pub recipient: Pubkey, pub amount: u64 }

#[error_code]
pub enum RbsError {
    #[msg("Lower bound must be less than upper bound")]
    InvalidBounds,
    #[msg("Insufficient reserves in treasury vault")]
    InsufficientReserves,
}
