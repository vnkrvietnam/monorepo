// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/treas-module.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── treasury-allocator.sol — TreasuryAllocator ───────────────────────────────
// Mang tài sản nhàn rỗi trong Kho bạc đi tối ưu lợi suất:
// Aave, MakerDAO DSR, Staking RWA — trả lãi về TREAS.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error Allocator_StrategyNotRegistered(address strategy);
error Allocator_ExceedsAllocation(uint256 max, uint256 requested);
error Allocator_ZeroAmount();

/// @notice Minimal interface for yield strategy adapters (Aave/Maker/RWA)
interface IYieldStrategy {
    function deposit(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount) external returns (uint256 received);
    function balanceOf(address token) external view returns (uint256);
}

struct AllocationConfig {
    address strategy;
    uint256 maxAllocationBps; // max % of reserve to deploy (basis points)
    bool    active;
}

contract TreasuryAllocator is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TREASv1 public TREAS;

    // ─── State ────────────────────────────────────────────────────────────

    mapping(address => AllocationConfig) public strategies;  // token → config
    address[] public registeredStrategies;

    // ─── Events ───────────────────────────────────────────────────────────

    event StrategyRegistered(address indexed strategy, uint256 maxBps);
    event Allocated(address indexed strategy, address indexed token, uint256 amount);
    event Deallocated(address indexed strategy, address indexed token, uint256 received);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Policy(kernel_) {}

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies()
        external
        override
        returns (bytes5[] memory deps)
    {
        deps    = new bytes5[](1);
        deps[0] = "TREAS";
        TREAS   = TREASv1(getModuleAddress("TREAS"));
    }

    function requestPermissions()
        external
        view
        override
        returns (Permissions[] memory reqs)
    {
        reqs    = new Permissions[](1);
        reqs[0] = Permissions({ keycode: "TREAS", funcSelector: TREASv1.withdraw.selector });
    }

    // ─── Strategy management ──────────────────────────────────────────────

    function registerStrategy(address strategy_, uint256 maxBps_) external {
        require(kernel.isPolicyActive(address(this)), "Allocator: not active");
        if (!strategies[strategy_].active) {
            registeredStrategies.push(strategy_);
        }
        strategies[strategy_] = AllocationConfig({
            strategy:          strategy_,
            maxAllocationBps:  maxBps_,
            active:            true
        });
        emit StrategyRegistered(strategy_, maxBps_);
    }

    // ─── Allocation ───────────────────────────────────────────────────────

    /// @notice Deploy idle treasury funds into a yield strategy
    function allocate(address strategy_, address token_, uint256 amount_) external {
        AllocationConfig storage cfg = strategies[strategy_];
        if (!cfg.active) revert Allocator_StrategyNotRegistered(strategy_);
        if (amount_ == 0) revert Allocator_ZeroAmount();

        // Enforce max allocation limit
        uint256 totalReserve = TREAS.reserveBalance(token_);
        uint256 maxAmount    = (totalReserve * cfg.maxAllocationBps) / 10_000;
        if (amount_ > maxAmount) revert Allocator_ExceedsAllocation(maxAmount, amount_);

        TREAS.withdraw(token_, address(this), amount_);
        IERC20(token_).approve(strategy_, amount_);
        IYieldStrategy(strategy_).deposit(token_, amount_);
        emit Allocated(strategy_, token_, amount_);
    }

    /// @notice Recall funds from a yield strategy back to treasury
    function deallocate(address strategy_, address token_, uint256 amount_) external {
        AllocationConfig storage cfg = strategies[strategy_];
        if (!cfg.active) revert Allocator_StrategyNotRegistered(strategy_);
        if (amount_ == 0) revert Allocator_ZeroAmount();

        uint256 received = IYieldStrategy(strategy_).withdraw(token_, amount_);
        IERC20(token_).safeTransfer(address(TREAS), received);
        emit Deallocated(strategy_, token_, received);
    }

    function strategyBalanceOf(address strategy_, address token_) external view returns (uint256) {
        return IYieldStrategy(strategy_).balanceOf(token_);
    }
}
