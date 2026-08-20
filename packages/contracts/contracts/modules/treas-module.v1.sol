// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── treas-module.v1.sol — TREAS ─────────────────────────────────────────────
// Lưu trữ tài sản dự trữ (VUSD, USDT, ETH, WBTC, RWA) và cấp phát vốn
// cho các Allocators.  Mọi token VNKR đúc ra đều phải có tài sản bảo chứng
// tương đương (≥ 1 VND / 1 token) trong kho bạc này.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error TREAS_InsufficientReserves(address token, uint256 requested, uint256 available);
error TREAS_TokenNotApproved(address token);
error TREAS_ZeroAmount();

contract TREASv1 is Module {
    // ─── State ────────────────────────────────────────────────────────────

    /// @notice Reserve assets approved for treasury storage
    mapping(address => bool) public approvedReserves;
    address[] public reserveTokens;

    /// @notice VND value Oracle per token (simplified: set by Admin in tests; production uses Chainlink)
    mapping(address => uint256) public tokenPriceVnd; // 1e18 = 1 VND (1 VNKR ≥ 1 VND bảo chứng tối thiểu)

    // ─── Events ───────────────────────────────────────────────────────────

    event ReserveDeposited(address indexed token, address indexed from, uint256 amount);
    event ReserveWithdrawn(address indexed token, address indexed to, uint256 amount);
    event ReserveApproved(address indexed token);
    event ReserveRemoved(address indexed token);
    event PriceUpdated(address indexed token, uint256 priceUsd);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Module(kernel_) {}

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "TREAS"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    /// @notice Approve a new reserve token
    function approveReserveToken(address token_, uint256 initialPriceUsd_) external permissioned {
        if (!approvedReserves[token_]) {
            approvedReserves[token_] = true;
            reserveTokens.push(token_);
            emit ReserveApproved(token_);
        }
        tokenPriceUsd[token_] = initialPriceUsd_;
        emit PriceUpdated(token_, initialPriceUsd_);
    }

    /// @notice Deposit reserve asset into treasury
    function deposit(address token_, address from_, uint256 amount_) external permissioned {
        if (amount_ == 0) revert TREAS_ZeroAmount();
        if (!approvedReserves[token_]) revert TREAS_TokenNotApproved(token_);
        IERC20(token_).safeTransferFrom(from_, address(this), amount_);
        emit ReserveDeposited(token_, from_, amount_);
    }

    /// @notice Withdraw reserve asset — only permitted Allocator Policies
    function withdraw(address token_, address to_, uint256 amount_) external permissioned {
        if (amount_ == 0) revert TREAS_ZeroAmount();
        uint256 bal = IERC20(token_).balanceOf(address(this));
        if (bal < amount_) revert TREAS_InsufficientReserves(token_, amount_, bal);
        IERC20(token_).safeTransfer(to_, amount_);
        emit ReserveWithdrawn(token_, to_, amount_);
    }

    /// @notice Update price oracle (in prod: replace with Chainlink call)
    function updatePrice(address token_, uint256 priceVnd_) external permissioned {
        tokenPriceVnd[token_] = priceVnd_;
        emit PriceUpdated(token_, priceVnd_);
    }

    // ─── View helpers ─────────────────────────────────────────────────────

    /// @notice Tổng giá trị dự trữ quy đổi VND (tổng hợp tất cả tài sản)
    function totalReservesVnd() external view returns (uint256 total) {
        uint256 len = reserveTokens.length;
        for (uint256 i; i < len; ++i) {
            address tok = reserveTokens[i];
            uint256 bal = IERC20(tok).balanceOf(address(this));
            // bal in 18 decimals — result in VND (18 dec scale)
            total += (bal * tokenPriceVnd[tok]) / 1e18;
        }
    }

    function reserveBalance(address token_) external view returns (uint256) {
        return IERC20(token_).balanceOf(address(this));
    }

    function reserveTokensLength() external view returns (uint256) {
        return reserveTokens.length;
    }
}
