// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/TRSRY/TRSRY.v2.sol";
import "../modules/COMPL/COMPL.v1.sol";
import "../modules/RANGE/RANGE.v1.sol";
import "../modules/MINTR/MINTR.v1.sol";

// ─── RangeBound.sol — Open Market Stability Operations ───────────────────────
// Thực thi can thiệp thị trường theo dải giá từ RANGEv1.
// Bảo vệ tỷ giá sàn nội tại VNKR/VND — mua vào khi giá xuống, bán ra khi giá lên.
// ─────────────────────────────────────────────────────────────────────────────

error RangeBound_Cooldown(uint256 nextAllowed);
error RangeBound_PriceInRange(uint256 price);
error RangeBound_ZeroAmount();
error RangeBound_BudgetExceeded(uint256 budget, uint256 requested);

contract RangeBound is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TRSRYv2 public TRSRY;
    MINTRv1 public MINTR;
    RANGEv1 public RANGE;

    // ─── State ────────────────────────────────────────────────────────────

    address public reserveToken;   // Token thanh toán (stablecoin VND-pegged)
    uint256 public cushionBudget;  // VND tối đa mỗi chu kỳ can thiệp
    uint256 public cooldown  = 8 hours;
    uint256 public lastIntervention;

    // ─── Events ───────────────────────────────────────────────────────────

    event CushionBuy(uint256 price, uint256 reserveSpent, uint256 vnkrMinted);
    event CushionSell(uint256 price, uint256 vnkrBurned, uint256 reserveReceived);
    event WallBuy(uint256 price, uint256 reserveSpent);
    event WallSell(uint256 price, uint256 vnkrBurned);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address reserveToken_, uint256 cushionBudget_) Policy(kernel_) {
        reserveToken  = reserveToken_;
        cushionBudget = cushionBudget_;
    }

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies() external override returns (bytes5[] memory deps) {
        deps    = new bytes5[](3);
        deps[0] = "TRSRY";
        deps[1] = "MINTR";
        deps[2] = "RANGE";
        TRSRY   = TRSRYv2(getModuleAddress("TRSRY"));
        MINTR   = MINTRv1(getModuleAddress("MINTR"));
        RANGE   = RANGEv1(getModuleAddress("RANGE"));
    }

    function requestPermissions() external view override returns (Permissions[] memory reqs) {
        reqs    = new Permissions[](4);
        reqs[0] = Permissions({ keycode: "TRSRY", funcSelector: TRSRYv2.withdraw.selector });
        reqs[1] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.mintVnkr.selector });
        reqs[2] = Permissions({ keycode: "MINTR", funcSelector: MINTRv1.burnVnkr.selector });
        reqs[3] = Permissions({ keycode: "RANGE", funcSelector: RANGEv1.recordIntervention.selector });
    }

    // ─── Interventions ────────────────────────────────────────────────────

    /// @notice Mua VNKR bằng dự trữ khi giá trong Cushion Low
    function cushionBuy(uint256 currentPriceVnd_, uint256 reserveAmount_) external {
        _requireCooldown();
        (bool inLow,) = RANGE.isInCushion(currentPriceVnd_);
        if (!inLow) revert RangeBound_PriceInRange(currentPriceVnd_);
        if (reserveAmount_ == 0) revert RangeBound_ZeroAmount();
        if (reserveAmount_ > cushionBudget) revert RangeBound_BudgetExceeded(cushionBudget, reserveAmount_);

        TRSRY.withdraw(reserveToken, address(this), reserveAmount_);
        uint256 vnkrAmount = (reserveAmount_ * 1e18) / currentPriceVnd_;
        MINTR.mintVnkr(address(TRSRY), vnkrAmount);
        RANGE.recordIntervention(0, currentPriceVnd_, reserveAmount_);
        lastIntervention = block.timestamp;
        emit CushionBuy(currentPriceVnd_, reserveAmount_, vnkrAmount);
    }

    /// @notice Bán VNKR lấy dự trữ khi giá trong Cushion High
    function cushionSell(uint256 currentPriceVnd_, uint256 vnkrAmount_) external {
        _requireCooldown();
        (, bool inHigh) = RANGE.isInCushion(currentPriceVnd_);
        if (!inHigh) revert RangeBound_PriceInRange(currentPriceVnd_);
        if (vnkrAmount_ == 0) revert RangeBound_ZeroAmount();

        MINTR.burnVnkr(address(TRSRY), vnkrAmount_);
        RANGE.recordIntervention(1, currentPriceVnd_, vnkrAmount_);
        lastIntervention = block.timestamp;
        emit CushionSell(currentPriceVnd_, vnkrAmount_, (vnkrAmount_ * currentPriceVnd_) / 1e18);
    }

    function updateCushionBudget(uint256 budget_) external {
        require(kernel.isPolicyActive(address(this)), "RangeBound: not active");
        cushionBudget = budget_;
    }

    function _requireCooldown() internal view {
        if (block.timestamp < lastIntervention + cooldown)
            revert RangeBound_Cooldown(lastIntervention + cooldown);
    }
}
