// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── chrg-module.v1.sol — CHRG ───────────────────────────────────────────────
// Thu gom và phân phối phí giao dịch từ VASP, P2P, SWIFT Bridge và Commerce.
// Phân chia: POL buy-back + Kho bạc cổ tức sVNKR/gVNKR.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error CHRG_ZeroFee();
error CHRG_InvalidSplit();
error CHRG_TokenNotRegistered(address token);

contract CHRGv1 is Module {
    // ─── State ────────────────────────────────────────────────────────────

    struct FeeRecord {
        uint256 total;
        uint256 distributed;
    }

    /// @notice Accumulated fees per token
    mapping(address => FeeRecord) public feeAccumulator;

    /// @notice Registered fee tokens
    address[] public feeTokens;
    mapping(address => bool) public isFeeToken;

    /// @notice Distribution split: polBps + treasuryBps must equal 10_000
    uint16 public polBps      = 3_000;  // 30% → Protocol-Owned Liquidity buy-back
    uint16 public treasuryBps = 7_000;  // 70% → Treasury yield for sVNKR/gVNKR holders

    address public polReceiver;
    address public treasuryReceiver;

    // ─── Events ───────────────────────────────────────────────────────────

    event FeeCollected(address indexed token, address indexed source, uint256 amount);
    event FeeDistributed(address indexed token, uint256 polAmount, uint256 treasuryAmount);
    event SplitUpdated(uint16 polBps, uint16 treasuryBps);
    event FeeTokenRegistered(address indexed token);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address polReceiver_, address treasuryReceiver_)
        Module(kernel_)
    {
        polReceiver      = polReceiver_;
        treasuryReceiver = treasuryReceiver_;
    }

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "CHRGS"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    /// @notice Register a fee token
    function registerFeeToken(address token_) external permissioned {
        if (!isFeeToken[token_]) {
            isFeeToken[token_] = true;
            feeTokens.push(token_);
            emit FeeTokenRegistered(token_);
        }
    }

    /// @notice Collect fees from VASP / P2P / SWIFT / Commerce sources
    function collectFee(address token_, address source_, uint256 amount_) external permissioned {
        if (amount_ == 0) revert CHRG_ZeroFee();
        if (!isFeeToken[token_]) revert CHRG_TokenNotRegistered(token_);
        IERC20(token_).safeTransferFrom(source_, address(this), amount_);
        feeAccumulator[token_].total += amount_;
        emit FeeCollected(token_, source_, amount_);
    }

    /// @notice Distribute accumulated fees according to split
    function distributeFees(address token_) external permissioned {
        if (!isFeeToken[token_]) revert CHRG_TokenNotRegistered(token_);
        FeeRecord storage rec = feeAccumulator[token_];
        uint256 pending = rec.total - rec.distributed;
        if (pending == 0) revert CHRG_ZeroFee();

        uint256 polAmt      = (pending * polBps)      / 10_000;
        uint256 treasuryAmt = pending - polAmt;

        rec.distributed += pending;

        if (polAmt > 0)      IERC20(token_).safeTransfer(polReceiver, polAmt);
        if (treasuryAmt > 0) IERC20(token_).safeTransfer(treasuryReceiver, treasuryAmt);

        emit FeeDistributed(token_, polAmt, treasuryAmt);
    }

    /// @notice Update split basis points
    function updateSplit(uint16 polBps_, uint16 treasuryBps_) external permissioned {
        if (polBps_ + treasuryBps_ != 10_000) revert CHRG_InvalidSplit();
        polBps      = polBps_;
        treasuryBps = treasuryBps_;
        emit SplitUpdated(polBps_, treasuryBps_);
    }

    /// @notice Update receiver addresses
    function updateReceivers(address pol_, address treasury_) external permissioned {
        polReceiver      = pol_;
        treasuryReceiver = treasury_;
    }

    // ─── View ─────────────────────────────────────────────────────────────

    function pendingFees(address token_) external view returns (uint256) {
        FeeRecord storage rec = feeAccumulator[token_];
        return rec.total - rec.distributed;
    }

    function feeTokensLength() external view returns (uint256) {
        return feeTokens.length;
    }
}
