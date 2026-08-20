// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../kernel/Module.sol";
import "./interfaces/ITRSRY.v2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── TRSRY.v2.sol — Kho bạc Quốc gia V2 ─────────────────────────────────────
// Lưu giữ tài sản dự trữ: Vàng, VNĐ, FX và Crypto (10.000.000.000.000 VNKR).
// Mọi token VNKR đúc ra đều phải có tài sản bảo chứng tương đương (≥ 1 VND / 1 token).
// Khóa thanh khoản không cho rút tài sản bảo chứng bất hợp pháp.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error TRSRY_TokenNotApproved(address token);
error TRSRY_ZeroAmount();
error TRSRY_InsufficientFree(address token, uint256 free, uint256 requested);
error TRSRY_LiquidityLocked(address token, uint256 locked);

contract TRSRYv2 is Module, ITRSRY {
    // ─── State ────────────────────────────────────────────────────────────

    struct ReserveAsset {
        string   assetClass;   // "GOLD" | "VND" | "FX" | "CRYPTO" | "RWA"
        uint256  priceVnd;     // 1e18 = 1 VND
        bool     approved;
    }

    mapping(address => ReserveAsset) public reserveAssets;
    address[] public reserveTokens;

    /// @notice Số lượng bị khóa (không thể rút) cho mỗi token
    mapping(address => uint256) public lockedBalances;

    /// @notice Địa chỉ VNKR token (để tính Floor Price)
    address public vnkrToken;

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address vnkrToken_) Module(kernel_) {
        vnkrToken = vnkrToken_;
    }

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "TRSRY"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (2, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    function approveReserveToken(
        address token_,
        string calldata assetClass_,
        uint256 initialPriceVnd_
    ) external override permissioned {
        if (!reserveAssets[token_].approved) {
            reserveTokens.push(token_);
        }
        reserveAssets[token_] = ReserveAsset({
            assetClass: assetClass_,
            priceVnd:   initialPriceVnd_,
            approved:   true
        });
        emit ReserveApproved(token_, assetClass_);
        emit PriceUpdated(token_, initialPriceVnd_);
    }

    function deposit(address token_, address from_, uint256 amount_) external override permissioned {
        if (amount_ == 0) revert TRSRY_ZeroAmount();
        if (!reserveAssets[token_].approved) revert TRSRY_TokenNotApproved(token_);
        IERC20(token_).safeTransferFrom(from_, address(this), amount_);
        emit ReserveDeposited(token_, from_, amount_);
    }

    function withdraw(address token_, address to_, uint256 amount_) external override permissioned {
        if (amount_ == 0) revert TRSRY_ZeroAmount();
        if (!reserveAssets[token_].approved) revert TRSRY_TokenNotApproved(token_);
        uint256 free = IERC20(token_).balanceOf(address(this)) - lockedBalances[token_];
        if (free < amount_) revert TRSRY_InsufficientFree(token_, free, amount_);
        IERC20(token_).safeTransfer(to_, amount_);
        emit ReserveWithdrawn(token_, to_, amount_);
    }

    function updatePrice(address token_, uint256 priceVnd_) external override permissioned {
        reserveAssets[token_].priceVnd = priceVnd_;
        emit PriceUpdated(token_, priceVnd_);
    }

    /// @notice Khóa thanh khoản — ngăn rút tài sản bảo chứng bất hợp pháp
    function lockLiquidity(address token_, uint256 amount_, string calldata reason_) external override permissioned {
        lockedBalances[token_] += amount_;
        emit LiquidityLocked(token_, amount_, reason_);
    }

    function unlockLiquidity(address token_, uint256 amount_) external override permissioned {
        if (lockedBalances[token_] < amount_) amount_ = lockedBalances[token_];
        lockedBalances[token_] -= amount_;
        emit LiquidityUnlocked(token_, amount_);
    }

    // ─── Views ────────────────────────────────────────────────────────────

    /// @notice Tổng giá trị dự trữ quy đổi VND
    function totalReservesVnd() external view override returns (uint256 total) {
        uint256 len = reserveTokens.length;
        for (uint256 i; i < len; ++i) {
            address tok = reserveTokens[i];
            uint256 bal = IERC20(tok).balanceOf(address(this));
            total += (bal * reserveAssets[tok].priceVnd) / 1e18;
        }
    }

    /// @notice Giá sàn nội tại: Tổng dự trữ VND / Tổng cung VNKR lưu hành
    function floorPriceVnd() external view override returns (uint256) {
        uint256 supply = circulatingVnkr();
        if (supply == 0) return 0;
        uint256 len = reserveTokens.length;
        uint256 total;
        for (uint256 i; i < len; ++i) {
            address tok = reserveTokens[i];
            uint256 bal = IERC20(tok).balanceOf(address(this));
            total += (bal * reserveAssets[tok].priceVnd) / 1e18;
        }
        return total / supply;
    }

    function reserveBalance(address token_) external view override returns (uint256) {
        return IERC20(token_).balanceOf(address(this));
    }

    function lockedBalance(address token_) external view override returns (uint256) {
        return lockedBalances[token_];
    }

    function tokenPriceVnd(address token_) external view override returns (uint256) {
        return reserveAssets[token_].priceVnd;
    }

    function circulatingVnkr() public view override returns (uint256) {
        return IERC20(vnkrToken).totalSupply();
    }

    function reserveTokensLength() external view returns (uint256) {
        return reserveTokens.length;
    }
}
