// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── IRANGE.v1.sol ────────────────────────────────────────────────────────────
// Interface cho module Range Bound Stability Storage V1.
// ─────────────────────────────────────────────────────────────────────────────

interface IRANGE {
    struct PriceRange {
        uint256 wallLow;
        uint256 cushionLow;
        uint256 cushionHigh;
        uint256 wallHigh;
        uint256 lastUpdated;
    }

    event PriceRangeUpdated(uint256 wallLow, uint256 cushionLow, uint256 cushionHigh, uint256 wallHigh);
    event InterventionRecorded(uint8 side, uint256 price, uint256 amount);

    function updatePriceRange(uint256 wallLow, uint256 cushionLow, uint256 cushionHigh, uint256 wallHigh) external;
    function recordIntervention(uint8 side, uint256 price, uint256 amount) external;

    function getPriceRange() external view returns (PriceRange memory);
    function isInCushion(uint256 price) external view returns (bool low, bool high);
    function isAboveWall(uint256 price) external view returns (bool);
    function isBelowWall(uint256 price) external view returns (bool);
}
