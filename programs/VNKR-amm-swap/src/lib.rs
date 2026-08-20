use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AMMSw1111111111111111111111111111111111111111");

/// Constant-product AMM (x * y = k) with configurable fee tier.
#[program]
pub mod vnkr_amm_swap {
    use super::*;

    /// Initialize a new liquidity pool.
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        fee_bps: u16, // e.g. 30 = 0.30%
    ) -> Result<()> {
        require!(fee_bps <= 1000, AmmError::FeeTooHigh);
        let pool = &mut ctx.accounts.pool_state;
        pool.token_a_mint    = ctx.accounts.token_a_vault.mint;
        pool.token_b_mint    = ctx.accounts.token_b_vault.mint;
        pool.token_a_vault   = ctx.accounts.token_a_vault.key();
        pool.token_b_vault   = ctx.accounts.token_b_vault.key();
        pool.fee_bps         = fee_bps;
        pool.lp_supply       = 0;
        pool.bump            = ctx.bumps.pool_state;
        Ok(())
    }

    /// Swap token A → token B using constant-product formula.
    pub fn swap(
        ctx: Context<Swap>,
        amount_in: u64,
        min_amount_out: u64,
    ) -> Result<()> {
        let pool = &ctx.accounts.pool_state;
        let reserve_a = ctx.accounts.token_a_vault.amount;
        let reserve_b = ctx.accounts.token_b_vault.amount;

        // amount_out = reserve_b * amount_in_after_fee / (reserve_a + amount_in_after_fee)
        let fee_numerator   = 10_000u128 - pool.fee_bps as u128;
        let amount_in_after = (amount_in as u128) * fee_numerator / 10_000u128;
        let amount_out = (reserve_b as u128 * amount_in_after)
            / (reserve_a as u128 + amount_in_after);
        let amount_out = amount_out as u64;

        require!(amount_out >= min_amount_out, AmmError::SlippageExceeded);

        // Transfer A from user → pool vault A
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.user_token_a.to_account_info(),
                    to:        ctx.accounts.token_a_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount_in,
        )?;

        // Transfer B from pool vault B → user
        let seeds: &[&[u8]] = &[b"pool_state", pool.token_a_mint.as_ref(), pool.token_b_mint.as_ref(), &[pool.bump]];
        let signer = &[seeds];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.token_b_vault.to_account_info(),
                    to:        ctx.accounts.user_token_b.to_account_info(),
                    authority: ctx.accounts.pool_state.to_account_info(),
                },
                signer,
            ),
            amount_out,
        )?;

        emit!(SwapEvent { trader: ctx.accounts.user.key(), amount_in, amount_out });
        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = PoolState::LEN,
        seeds = [b"pool_state", token_a_vault.mint.as_ref(), token_b_vault.mint.as_ref()],
        bump
    )]
    pub pool_state: Account<'info, PoolState>,

    pub token_a_vault: Account<'info, TokenAccount>,
    pub token_b_vault: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    pub user: Signer<'info>,

    #[account(seeds = [b"pool_state", pool_state.token_a_mint.as_ref(), pool_state.token_b_mint.as_ref()], bump = pool_state.bump)]
    pub pool_state: Account<'info, PoolState>,

    #[account(mut, constraint = token_a_vault.key() == pool_state.token_a_vault)]
    pub token_a_vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = token_b_vault.key() == pool_state.token_b_vault)]
    pub token_b_vault: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_token_a.owner == user.key())]
    pub user_token_a: Account<'info, TokenAccount>,

    #[account(mut, constraint = user_token_b.owner == user.key())]
    pub user_token_b: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct PoolState {
    pub token_a_mint:  Pubkey,
    pub token_b_mint:  Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    pub fee_bps:       u16,
    pub lp_supply:     u64,
    pub bump:          u8,
}

impl PoolState {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 2 + 8 + 1;
}

// ─── Events & Errors ──────────────────────────────────────────────────────────

#[event]
pub struct SwapEvent { pub trader: Pubkey, pub amount_in: u64, pub amount_out: u64 }

#[error_code]
pub enum AmmError {
    #[msg("Output below minimum (slippage exceeded)")]
    SlippageExceeded,
    #[msg("Fee cannot exceed 10%")]
    FeeTooHigh,
}
