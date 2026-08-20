// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── ITRSRY.v2.sol ────────────────────────────────────────────────────────────
// Interface cho module Kho bạc Quốc gia V2.
// ─────────────────────────────────────────────────────────────────────────────

interface ITRSRY {
    // ─── Events ───────────────────────────────────────────────────────────
    event ReserveDeposited(address indexed token, address indexed from, uint256 amount);
    event ReserveWithdrawn(address indexed token, address indexed to, uint256 amount);
    event ReserveApproved(address indexed token, string assetClass);
    event PriceUpdated(address indexed token, uint256 priceVnd);
    event LiquidityLocked(address indexed token, uint256 amount, string reason);
    event LiquidityUnlocked(address indexed token, uint256 amount);

    // ─── Core ─────────────────────────────────────────────────────────────
    function deposit(address token, address from, uint256 amount) external;
    function withdraw(address token, address to, uint256 amount) external;
    function approveReserveToken(address token, string calldata assetClass, uint256 initialPriceVnd) external;
    function updatePrice(address token, uint256 priceVnd) external;
    function lockLiquidity(address token, uint256 amount, string calldata reason) external;
    function unlockLiquidity(address token, uint256 amount) external;

    // ─── Views ────────────────────────────────────────────────────────────
    function totalReservesVnd() external view returns (uint256);
    function floorPriceVnd() external view returns (uint256);
    function reserveBalance(address token) external view returns (uint256);
    function lockedBalance(address token) external view returns (uint256);
    function tokenPriceVnd(address token) external view returns (uint256);
    function circulatingVnkr() external view returns (uint256);
}
