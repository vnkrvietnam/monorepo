// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ─── gvnkr-token.sol — gVNKR ─────────────────────────────────────────────────
// Governance VNKR (ERC-20 Non-rebase).
// Cổ phần biểu quyết on-chain — tích hợp ERC20Votes (OZ) để snapshot voting power.
// Dùng cho giao dịch Cross-Chain (LayerZero / CCIP) và ký quỹ CoolerLoans.
// ─────────────────────────────────────────────────────────────────────────────

error GVNKR_NotAuthorized(address caller);

contract GVNKRToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    // ─── State ────────────────────────────────────────────────────────────

    address public stakingPolicy;

    // ─── Events ───────────────────────────────────────────────────────────

    event StakingPolicyUpdated(address indexed prev, address indexed next);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(address admin_)
        ERC20("Governance VNKR", "gVNKR")
        ERC20Permit("gVNKR")
        Ownable(admin_)
    {}

    // ─── Authority ────────────────────────────────────────────────────────

    function setStakingPolicy(address policy_) external onlyOwner {
        emit StakingPolicyUpdated(stakingPolicy, policy_);
        stakingPolicy = policy_;
    }

    modifier onlyStaking() {
        if (msg.sender != stakingPolicy) revert GVNKR_NotAuthorized(msg.sender);
        _;
    }

    // ─── Mint / Burn ──────────────────────────────────────────────────────

    /// @notice Mint gVNKR when user wraps sVNKR → gVNKR
    function mint(address to_, uint256 amount_) external onlyStaking {
        _mint(to_, amount_);
    }

    /// @notice Burn gVNKR when user unwraps gVNKR → sVNKR
    function burn(address from_, uint256 amount_) external onlyStaking {
        _burn(from_, amount_);
    }

    // ─── OZ required overrides ────────────────────────────────────────────

    function _update(address from_, address to_, uint256 value_)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from_, to_, value_);
    }

    function nonces(address owner_)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner_);
    }

    function decimals() public pure override returns (uint8) { return 18; }
}
