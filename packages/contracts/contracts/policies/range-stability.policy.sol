// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/treas-module.v1.sol";
import "../modules/mintr-module.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── range-stability.policy.sol — RangeBoundStability (RBS Engine) ───────────
// Tự động can thiệp giá (Cushion & Wall) mua/bán VNKR để ổn định thị trường.
// Duy trì dải giá: [wallLow, cushionLow] … [cushionHigh, wallHigh].
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error RBS_PriceOutOfWall(uint256 price);
error RBS_MarketStable(uint256 price);
error RBS_CushionFull();
error RBS_ZeroAmount();

contract RangeBoundStability is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TREASv1 public TREAS;
    MINTRv1 public MINTR;

    // ─── Dải giá (18 decimals = VND, ví dụ: 25_000 * 1e18 = 25.000 VND) ───

    uint256 public wallLow;      // Hard floor — treasury buys here
    uint256 public cushionLow;   // Soft floor — begin buying
    uint256 public cushionHigh;  // Soft ceiling — begin selling
    uint256 public wallHigh;     // Hard ceiling — treasury sells here

    /// @notice Reserve token used for cushion interventions (e.g. DAI)
    address public reserveToken;

    /// @notice VNKR token
    address public vnkrToken;

    /// @notice Max reserve spend per cushion cycle (18 dec)
    uint256 public cushionBudget;

    /// @notice Cooldown between interventions (seconds)
    uint256 public cooldown = 8 hours;
    uint256 public lastIntervention;

    // ─── Events ───────────────────────────────────────────────────────────

    event WallPricesUpdated(uint256 wallLow, uint256 cushionLow, uint256 cushionHigh, uint256 wallHigh);
    event CushionBuyTriggered(uint256 price, uint256 reserveSpent, uint256 vnkrReceived);
    event CushionSellTriggered(uint256 price, uint256 vnkrSpent, uint256 reserveReceived);
    event WallBuyTriggered(uint256 price, uint256 reserveSpent);
    event WallSellTriggered(uint256 price, uint256 vnkrBurned);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(
        Kernel kernel_,
        address reserveToken_,
        address vnkrToken_,
        uint256 wallLow_,
        uint256 cushionLow_,
        uint256 cushionHigh_,
        uint256 wallHigh_,
        uint256 cushionBudget_
    ) Policy(kernel_) {
        reserveToken  = reserveToken_;
        vnkrToken     = vnkrToken_;
        wallLow       = wallLow_;
        cushionLow    = cushionLow_;
        cushionHigh   = cushionHigh_;
        wallHigh      = wallHigh_;
        cushionBudget = cushionBudget_;
    }

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies()
        external
        override
        returns (bytes5[] memory deps)
    {
        deps    = new bytes5[](2);
        deps[0] = "TREAS";
        deps[1] = "MINTR";
        TREAS   = TREASv1(getModuleAddress("TREAS"));
        MINTR   = MINTRv1(getModuleAddress("MINTR"));
    }

    function requestPermissions()
        external
        view
        override
        returns (Permissions[] memory reqs)
    {
        reqs    = new Permissions[](3);
        reqs[0] = Permissions({ keycode: "TREAS", funcSelector: TREASv1.withdraw.selector });
        reqs[1] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.mintVnkr.selector });
        reqs[2] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.burnVnkr.selector });
    }

    // ─── RBS interventions ────────────────────────────────────────────────

    /// @notice Called when oracle detects price in cushion low range — buy VNKR with reserves
    function cushionBuy(uint256 currentPrice_, uint256 reserveAmount_) external {
        _checkCooldown();
        if (currentPrice_ <= wallLow || currentPrice_ >= cushionLow)
            revert RBS_MarketStable(currentPrice_);
        if (reserveAmount_ == 0) revert RBS_ZeroAmount();
        require(reserveAmount_ <= cushionBudget, "RBS: budget exceeded");

        // Withdraw reserve from treasury and conceptually buy VNKR on-market
        TREAS.withdraw(reserveToken, address(this), reserveAmount_);
        // For on-chain accounting, mint equivalent VNKR to treasury
        uint256 vnkrAmount = (reserveAmount_ * 1e18) / currentPrice_;
        MINTR.mintVnkr(address(TREAS), vnkrAmount);

        lastIntervention = block.timestamp;
        emit CushionBuyTriggered(currentPrice_, reserveAmount_, vnkrAmount);
    }

    /// @notice Called when oracle detects price in cushion high range — sell VNKR for reserves
    function cushionSell(uint256 currentPrice_, uint256 vnkrAmount_) external {
        _checkCooldown();
        if (currentPrice_ <= cushionHigh || currentPrice_ >= wallHigh)
            revert RBS_MarketStable(currentPrice_);
        if (vnkrAmount_ == 0) revert RBS_ZeroAmount();

        // Burn VNKR from treasury (reduce supply), receive reserve equivalent
        MINTR.burnVnkr(address(TREAS), vnkrAmount_);
        uint256 reserveOut = (vnkrAmount_ * currentPrice_) / 1e18;
        TREAS.withdraw(reserveToken, address(TREAS), reserveOut);

        lastIntervention = block.timestamp;
        emit CushionSellTriggered(currentPrice_, vnkrAmount_, reserveOut);
    }

    // ─── Parameter management ─────────────────────────────────────────────

    function updatePriceRange(
        uint256 wallLow_,
        uint256 cushionLow_,
        uint256 cushionHigh_,
        uint256 wallHigh_
    ) external {
        require(kernel.isPolicyActive(address(this)), "RBS: not active");
        require(wallLow_ < cushionLow_ && cushionLow_ < cushionHigh_ && cushionHigh_ < wallHigh_,
            "RBS: invalid range");
        wallLow     = wallLow_;
        cushionLow  = cushionLow_;
        cushionHigh = cushionHigh_;
        wallHigh    = wallHigh_;
        emit WallPricesUpdated(wallLow_, cushionLow_, cushionHigh_, wallHigh_);
    }

    function _checkCooldown() internal view {
        require(block.timestamp >= lastIntervention + cooldown, "RBS: cooldown");
    }
}
