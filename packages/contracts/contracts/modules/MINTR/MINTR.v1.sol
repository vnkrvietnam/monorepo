// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../kernel/Module.sol";
import "./interfaces/IMINTR.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ─── MINTR.v1.sol — Protected Mint/Burn Controller ───────────────────────────
// Kiểm soát đúc/đốt VNKR dựa trên Tỷ lệ Bảo chứng (Backing Ratio).
// Circuit Breaker tự động ngắt nếu phát hiện hành vi đúc token trái phép.
// ─────────────────────────────────────────────────────────────────────────────

error MINTR_CircuitBreakerActive();
error MINTR_ZeroAmount();
error MINTR_CapExceeded(uint256 cap, uint256 attempted);
error MINTR_BackingRatioViolation(uint256 required, uint256 current);
error MINTR_NotAuthorized();

interface IMintable is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

interface ITRSRYForMINTR {
    function totalReservesVnd() external view returns (uint256);
}

contract MINTRv1 is Module, IMINTR {
    // ─── State ────────────────────────────────────────────────────────────

    IMintable public vnkr;
    address   public trsryModule;

    /// @notice Cung tối đa: 10.000.000.000.000 VNKR (18 decimals)
    uint256 public constant RESERVE_CAP = 10_000_000_000_000 * 1e18;

    /// @notice Tỷ lệ bảo chứng tối thiểu (basis points) — 10000 = 100%
    uint256 public minBackingBps = 10_000;

    bool    public circuitBreakerActive;
    uint256 public totalMinted;
    uint256 public totalBurned;

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address vnkr_, address trsryModule_) Module(kernel_) {
        vnkr        = IMintable(vnkr_);
        trsryModule = trsryModule_;
    }

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "MINTR"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    function mintVnkr(address to_, uint256 amount_) external override permissioned {
        if (circuitBreakerActive) revert MINTR_CircuitBreakerActive();
        if (amount_ == 0) revert MINTR_ZeroAmount();
        uint256 newSupply = vnkr.totalSupply() + amount_;
        if (newSupply > RESERVE_CAP) revert MINTR_CapExceeded(RESERVE_CAP, newSupply);

        // Kiểm tra Backing Ratio: reserveVnd / newSupply >= minBackingBps / 10000
        uint256 reserveVnd = ITRSRYForMINTR(trsryModule).totalReservesVnd();
        // reserveVnd (1e18 per VND unit), newSupply (1e18 per token)
        // ratio = reserveVnd * 10000 / newSupply >= minBackingBps
        if (reserveVnd * 10_000 < newSupply * minBackingBps)
            revert MINTR_BackingRatioViolation(minBackingBps, (reserveVnd * 10_000) / newSupply);

        totalMinted += amount_;
        vnkr.mint(to_, amount_);
        emit Minted(to_, amount_);
    }

    function burnVnkr(address from_, uint256 amount_) external override permissioned {
        if (amount_ == 0) revert MINTR_ZeroAmount();
        totalBurned += amount_;
        vnkr.burn(from_, amount_);
        emit Burned(from_, amount_);
    }

    /// @notice Kích hoạt Circuit Breaker — ngắt toàn bộ đúc token
    function triggerCircuitBreaker(string calldata reason_) external override permissioned {
        circuitBreakerActive = true;
        emit CircuitBreakerTriggered(msg.sender, reason_);
    }

    function resetCircuitBreaker() external override permissioned {
        circuitBreakerActive = false;
        emit CircuitBreakerReset();
    }

    function updateBackingRatio(uint256 minBackingBps_) external permissioned {
        minBackingBps = minBackingBps_;
        emit BackingRatioUpdated(minBackingBps_);
    }

    // ─── Views ────────────────────────────────────────────────────────────

    function circulatingSupply() external view override returns (uint256) { return vnkr.totalSupply(); }
    function remainingCap() external view override returns (uint256) {
        uint256 s = vnkr.totalSupply();
        return s < RESERVE_CAP ? RESERVE_CAP - s : 0;
    }
    function backingRatioBps() external view override returns (uint256) { return minBackingBps; }
}
