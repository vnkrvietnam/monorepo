// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/mintr-module.v1.sol";
import "../tokens/svnkr-token.sol";
import "../tokens/gvnkr-token.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── staking-policy.sol — StakingPolicy ──────────────────────────────────────
// Xử lý khóa VNKR → nhận sVNKR/gVNKR và phân phối thưởng Rebase mỗi Epoch.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error Staking_InvalidAmount();
error Staking_NotEnoughStaked(address user, uint256 staked, uint256 requested);
error Staking_EpochNotReady(uint256 nextEpochTime);

contract StakingPolicy is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    MINTRv1    public MINTR;
    SVNKRToken public sVNKR;
    GVNKRToken public gVNKR;
    IERC20     public VNKR;

    // ─── Rebase params ────────────────────────────────────────────────────

    uint256 public rebaseBps    = 100;  // 1% per epoch default
    uint256 public nextEpochTime;

    // ─── User positions ───────────────────────────────────────────────────

    mapping(address => uint256) public stakedVnkr;

    // ─── Events ───────────────────────────────────────────────────────────

    event Staked(address indexed user, uint256 vnkrIn, uint256 svnkrOut);
    event Unstaked(address indexed user, uint256 svnkrIn, uint256 vnkrOut);
    event Rebased(uint256 epoch, uint256 rebaseBps, uint256 newSupply);
    event RebaseBpsUpdated(uint256 prev, uint256 next);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(
        Kernel kernel_,
        address vnkr_,
        address svnkr_,
        address gvnkr_
    ) Policy(kernel_) {
        VNKR  = IERC20(vnkr_);
        sVNKR = SVNKRToken(svnkr_);
        gVNKR = GVNKRToken(gvnkr_);
        nextEpochTime = block.timestamp + 8 hours;
    }

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies()
        external
        override
        returns (bytes5[] memory deps)
    {
        deps    = new bytes5[](1);
        deps[0] = "MINTR";
        MINTR   = MINTRv1(getModuleAddress("MINTR"));
    }

    function requestPermissions()
        external
        view
        override
        returns (Permissions[] memory reqs)
    {
        reqs    = new Permissions[](2);
        reqs[0] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.mintVnkr.selector });
        reqs[1] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.burnVnkr.selector });
    }

    // ─── Core logic ───────────────────────────────────────────────────────

    /// @notice Stake VNKR → receive sVNKR 1:1
    function stake(uint256 amount_) external {
        if (amount_ == 0) revert Staking_InvalidAmount();
        VNKR.safeTransferFrom(msg.sender, address(this), amount_);
        stakedVnkr[msg.sender] += amount_;
        sVNKR.mint(msg.sender, amount_);
        emit Staked(msg.sender, amount_, amount_);
    }

    /// @notice Unstake sVNKR → receive VNKR
    function unstake(uint256 svnkrAmount_) external {
        if (svnkrAmount_ == 0) revert Staking_InvalidAmount();
        uint256 vnkrOut = svnkrAmount_; // 1:1 pre-rebase (post-rebase gains embedded in sVNKR balance)
        if (stakedVnkr[msg.sender] < vnkrOut)
            revert Staking_NotEnoughStaked(msg.sender, stakedVnkr[msg.sender], vnkrOut);
        sVNKR.burn(msg.sender, svnkrAmount_);
        stakedVnkr[msg.sender] -= vnkrOut;
        VNKR.safeTransfer(msg.sender, vnkrOut);
        emit Unstaked(msg.sender, svnkrAmount_, vnkrOut);
    }

    /// @notice Wrap sVNKR → gVNKR (1:1 by index value)
    function wrap(uint256 amount_) external {
        if (amount_ == 0) revert Staking_InvalidAmount();
        sVNKR.burn(msg.sender, amount_);
        gVNKR.mint(msg.sender, amount_);
    }

    /// @notice Unwrap gVNKR → sVNKR (1:1)
    function unwrap(uint256 amount_) external {
        if (amount_ == 0) revert Staking_InvalidAmount();
        gVNKR.burn(msg.sender, amount_);
        sVNKR.mint(msg.sender, amount_);
    }

    /// @notice Trigger epoch rebase — distributes yield to all sVNKR holders
    function triggerRebase() external {
        if (block.timestamp < nextEpochTime)
            revert Staking_EpochNotReady(nextEpochTime);
        uint256 newSupply = sVNKR.rebase(rebaseBps);
        nextEpochTime = block.timestamp + 8 hours;
        emit Rebased(sVNKR.epoch(), rebaseBps, newSupply);
    }

    /// @notice Update rebase rate (guarded — only Kernel executor via role)
    function setRebaseBps(uint256 bps_) external {
        require(
            kernel.isPolicyActive(address(this)),
            "Staking: not active"
        );
        emit RebaseBpsUpdated(rebaseBps, bps_);
        rebaseBps = bps_;
    }
}
