// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../kernel/Module.sol";
import "./interfaces/IRANGE.v1.sol";

// ─── RANGE.v1.sol — Range Bound Stability Reserve Storage ────────────────────
// Lưu trữ dải biên độ giá VNKR/VND (Wall & Cushion).
// Tách biệt lưu trữ trạng thái ra khỏi logic can thiệp (RangeBound Policy).
// ─────────────────────────────────────────────────────────────────────────────

error RANGE_InvalidRange();
error RANGE_ZeroPrice();

contract RANGEv1 is Module, IRANGE {
    // ─── State ────────────────────────────────────────────────────────────

    PriceRange private _range;

    struct InterventionRecord {
        uint8   side;       // 0 = BUY (cushion low), 1 = SELL (cushion high)
        uint256 price;      // VND
        uint256 amount;
        uint256 timestamp;
    }

    InterventionRecord[] public interventionHistory;

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(
        Kernel kernel_,
        uint256 wallLow_,
        uint256 cushionLow_,
        uint256 cushionHigh_,
        uint256 wallHigh_
    ) Module(kernel_) {
        _validateRange(wallLow_, cushionLow_, cushionHigh_, wallHigh_);
        _range = PriceRange({
            wallLow:     wallLow_,
            cushionLow:  cushionLow_,
            cushionHigh: cushionHigh_,
            wallHigh:    wallHigh_,
            lastUpdated: block.timestamp
        });
    }

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "RANGE"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    function updatePriceRange(
        uint256 wallLow_,
        uint256 cushionLow_,
        uint256 cushionHigh_,
        uint256 wallHigh_
    ) external override permissioned {
        _validateRange(wallLow_, cushionLow_, cushionHigh_, wallHigh_);
        _range = PriceRange({
            wallLow:     wallLow_,
            cushionLow:  cushionLow_,
            cushionHigh: cushionHigh_,
            wallHigh:    wallHigh_,
            lastUpdated: block.timestamp
        });
        emit PriceRangeUpdated(wallLow_, cushionLow_, cushionHigh_, wallHigh_);
    }

    function recordIntervention(uint8 side_, uint256 price_, uint256 amount_) external override permissioned {
        interventionHistory.push(InterventionRecord({
            side:      side_,
            price:     price_,
            amount:    amount_,
            timestamp: block.timestamp
        }));
        emit InterventionRecorded(side_, price_, amount_);
    }

    // ─── Views ────────────────────────────────────────────────────────────

    function getPriceRange() external view override returns (PriceRange memory) {
        return _range;
    }

    function isInCushion(uint256 price_) external view override returns (bool low, bool high) {
        low  = price_ > _range.wallLow    && price_ < _range.cushionLow;
        high = price_ > _range.cushionHigh && price_ < _range.wallHigh;
    }

    function isAboveWall(uint256 price_) external view override returns (bool) {
        return price_ >= _range.wallHigh;
    }

    function isBelowWall(uint256 price_) external view override returns (bool) {
        return price_ <= _range.wallLow;
    }

    function interventionCount() external view returns (uint256) {
        return interventionHistory.length;
    }

    // ─── Internal ─────────────────────────────────────────────────────────

    function _validateRange(
        uint256 wL, uint256 cL, uint256 cH, uint256 wH
    ) internal pure {
        if (wL == 0 || cL == 0 || cH == 0 || wH == 0) revert RANGE_ZeroPrice();
        if (!(wL < cL && cL < cH && cH < wH)) revert RANGE_InvalidRange();
    }
}
