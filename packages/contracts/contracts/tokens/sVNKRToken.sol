// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ─── sVNKRToken.sol — Staked Rebase Token ────────────────────────────────────
// Staked VNKR (ERC-20 Rebase).
// Tự động tích lũy lãi kép từ lợi nhuận Kho bạc sau mỗi Epoch (8 giờ).
// Số dư tăng dần nhờ cơ chế gons — không cần giao dịch.
// ─────────────────────────────────────────────────────────────────────────────

error SVNKRToken_NotAuthorized(address caller);
error SVNKRToken_RebaseTooSoon(uint256 nextEpochTime);
error SVNKRToken_InvalidRate();

contract SVNKRToken is ERC20, Ownable {
    uint256 public constant EPOCH_DURATION = 8 hours;
    uint256 public constant MAX_REBASE_BPS = 500;

    address public stakingPolicy;

    uint256 private constant INITIAL_SUPPLY = 10_000_000_000_000 * 1e18;
    uint256 private constant TOTAL_GONS = type(uint256).max - (type(uint256).max % INITIAL_SUPPLY);

    uint256 private _gonsPerToken;
    mapping(address => uint256) private _gonBalances;
    uint256 private _totalSupplyTokens;

    uint256 public nextEpochTime;
    uint256 public epoch;

    event Rebase(uint256 indexed epoch, uint256 rebaseBps, uint256 newTotalSupply);
    event StakingPolicyUpdated(address indexed prev, address indexed next);

    constructor(address admin_)
        ERC20("Staked VNKR", "sVNKR")
        Ownable(admin_)
    {
        _gonsPerToken      = TOTAL_GONS / INITIAL_SUPPLY;
        _totalSupplyTokens = 0;
        nextEpochTime      = block.timestamp + EPOCH_DURATION;
    }

    function setStakingPolicy(address policy_) external onlyOwner {
        emit StakingPolicyUpdated(stakingPolicy, policy_);
        stakingPolicy = policy_;
    }

    modifier onlyStaking() {
        if (msg.sender != stakingPolicy) revert SVNKRToken_NotAuthorized(msg.sender);
        _;
    }

    function rebase(uint256 rebaseBps_) external onlyStaking returns (uint256 newTotalSupply) {
        if (block.timestamp < nextEpochTime) revert SVNKRToken_RebaseTooSoon(nextEpochTime);
        if (rebaseBps_ == 0 || rebaseBps_ > MAX_REBASE_BPS) revert SVNKRToken_InvalidRate();
        uint256 delta  = (_totalSupplyTokens * rebaseBps_) / 10_000;
        newTotalSupply = _totalSupplyTokens + delta;
        _gonsPerToken  = TOTAL_GONS / newTotalSupply;
        _totalSupplyTokens = newTotalSupply;
        nextEpochTime  = block.timestamp + EPOCH_DURATION;
        emit Rebase(++epoch, rebaseBps_, newTotalSupply);
    }

    function mint(address to_, uint256 amount_) external onlyStaking {
        _gonBalances[to_]  += amount_ * _gonsPerToken;
        _totalSupplyTokens += amount_;
    }

    function burn(address from_, uint256 amount_) external onlyStaking {
        uint256 gons = amount_ * _gonsPerToken;
        require(_gonBalances[from_] >= gons, "sVNKR: insufficient");
        _gonBalances[from_]  -= gons;
        _totalSupplyTokens   -= amount_;
    }

    function totalSupply() public view override returns (uint256) { return _totalSupplyTokens; }
    function balanceOf(address a) public view override returns (uint256) { return _gonBalances[a] / _gonsPerToken; }

    function transfer(address to_, uint256 amount_) public override returns (bool) {
        uint256 gons = amount_ * _gonsPerToken;
        _gonBalances[msg.sender] -= gons;
        _gonBalances[to_]        += gons;
        emit Transfer(msg.sender, to_, amount_);
        return true;
    }

    function transferFrom(address from_, address to_, uint256 amount_) public override returns (bool) {
        uint256 gons = amount_ * _gonsPerToken;
        _spendAllowance(from_, msg.sender, amount_);
        _gonBalances[from_] -= gons;
        _gonBalances[to_]   += gons;
        emit Transfer(from_, to_, amount_);
        return true;
    }

    function decimals() public pure override returns (uint8) { return 18; }
}
