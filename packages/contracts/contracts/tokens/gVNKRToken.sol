// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ─── gVNKRToken.sol — Governance Index Wrapped Cross-Chain Token ──────────────
// Governance VNKR (Non-rebase, ERC20Votes).
// Chỉ số nhân (Index) tích lũy theo Epoch — 1 gVNKR = index × sVNKR.
// Dùng để biểu quyết DAO, giao dịch Cross-Chain và thế chấp tín chấp.
// ─────────────────────────────────────────────────────────────────────────────

error GVNKRToken_NotAuthorized(address caller);

contract GVNKRToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    address public stakingPolicy;

    event StakingPolicyUpdated(address indexed prev, address indexed next);

    constructor(address admin_)
        ERC20("Governance VNKR", "gVNKR")
        ERC20Permit("gVNKR")
        Ownable(admin_)
    {}

    function setStakingPolicy(address policy_) external onlyOwner {
        emit StakingPolicyUpdated(stakingPolicy, policy_);
        stakingPolicy = policy_;
    }

    modifier onlyStaking() {
        if (msg.sender != stakingPolicy) revert GVNKRToken_NotAuthorized(msg.sender);
        _;
    }

    function mint(address to_, uint256 amount_) external onlyStaking { _mint(to_, amount_); }
    function burn(address from_, uint256 amount_) external onlyStaking { _burn(from_, amount_); }

    function _update(address from_, address to_, uint256 value_)
        internal override(ERC20, ERC20Votes) { super._update(from_, to_, value_); }

    function nonces(address owner_)
        public view override(ERC20Permit, Nonces) returns (uint256) { return super.nonces(owner_); }

    function decimals() public pure override returns (uint8) { return 18; }
}
