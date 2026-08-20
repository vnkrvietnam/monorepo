// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── IMINTR.v1.sol ────────────────────────────────────────────────────────────
// Interface cho module Mint/Burn Controller V1.
// ─────────────────────────────────────────────────────────────────────────────

interface IMINTR {
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event CircuitBreakerTriggered(address indexed caller, string reason);
    event CircuitBreakerReset();
    event BackingRatioUpdated(uint256 minBackingBps);

    function mintVnkr(address to, uint256 amount) external;
    function burnVnkr(address from, uint256 amount) external;
    function triggerCircuitBreaker(string calldata reason) external;
    function resetCircuitBreaker() external;

    function circulatingSupply() external view returns (uint256);
    function remainingCap() external view returns (uint256);
    function circuitBreakerActive() external view returns (bool);
    function backingRatioBps() external view returns (uint256);
}
