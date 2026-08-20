// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/TRSRY/TRSRY.v2.sol";
import "../modules/COMPL/COMPL.v1.sol";

// ─── CapitalControl.sol — Outflow Fee & Circuit Breaker Policy ────────────────
// Giám sát dòng tiền VNĐ ra nước ngoài.
// Áp phí ngắt mạch (Outflow Tax) tăng lũy tiến khi tỷ lệ chảy máu ngoại tệ
// chạm ngưỡng nguy hiểm — bảo vệ nguồn dự trữ quốc gia.
// ─────────────────────────────────────────────────────────────────────────────

error CapControl_Paused();
error CapControl_FeeTooHigh(uint256 maxBps, uint256 current);
error CapControl_DailyLimitExceeded(address user, uint256 limit, uint256 attempted);

contract CapitalControl is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TRSRYv2 public TRSRY;
    COMPLv1 public COMPL;

    // ─── Outflow fee tiers (VND ngưỡng → phí bps) ────────────────────────
    //  < 100M VND/ngày  → 0 bps (miễn phí)
    //  100M–500M        → 50 bps (0,5%)
    //  500M–1B          → 200 bps (2%)
    //  > 1B VND/ngày    → 500 bps (5%) — ngưỡng cảnh báo khẩn
    uint256 public constant TIER1_VND = 100_000_000 * 1e18;
    uint256 public constant TIER2_VND = 500_000_000 * 1e18;
    uint256 public constant TIER3_VND = 1_000_000_000 * 1e18;

    uint16  public constant FEE_TIER1 = 50;
    uint16  public constant FEE_TIER2 = 200;
    uint16  public constant FEE_TIER3 = 500;
    uint16  public constant MAX_FEE   = 2_000; // 20% — giới hạn tuyệt đối

    /// @notice Hạn mức xuất ngoại ngày cho mỗi người dùng (VND)
    uint256 public dailyOutflowLimit = 500_000_000 * 1e18; // 500M VND

    bool    public paused;
    address public feeCollector;

    // ─── Tracking ─────────────────────────────────────────────────────────

    mapping(address => mapping(uint256 => uint256)) private _userDailyOutflow;
    uint256 public totalDailyOutflow;   // toàn hệ thống
    uint256 private _dayBucket;

    // ─── Events ───────────────────────────────────────────────────────────

    event OutflowProcessed(address indexed user, uint256 amountVnd, uint256 feeBps, uint256 feeAmountVnd);
    event EmergencyPause(address indexed trigger, string reason);
    event EmergencyUnpause(address indexed trigger);
    event DailyLimitUpdated(uint256 newLimit);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address feeCollector_) Policy(kernel_) {
        feeCollector = feeCollector_;
        _dayBucket   = block.timestamp / 1 days;
    }

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies() external override returns (bytes5[] memory deps) {
        deps    = new bytes5[](2);
        deps[0] = "TRSRY";
        deps[1] = "COMPL";
        TRSRY   = TRSRYv2(getModuleAddress("TRSRY"));
        COMPL   = COMPLv1(getModuleAddress("COMPL"));
    }

    function requestPermissions() external view override returns (Permissions[] memory reqs) {
        reqs    = new Permissions[](2);
        reqs[0] = Permissions({ keycode: "COMPL", funcSelector: COMPLv1.raiseOutflowAlert.selector });
        reqs[1] = Permissions({ keycode: "COMPL", funcSelector: COMPLv1.logTransaction.selector });
    }

    // ─── Core: processOutflow ─────────────────────────────────────────────

    /// @notice Tính và thu phí ngắt mạch cho giao dịch xuất ngoại
    /// @return feeAmountVnd Phí thực thu (VND, 18 dec)
    function processOutflow(address user_, uint256 amountVnd_) external returns (uint256 feeAmountVnd) {
        if (paused) revert CapControl_Paused();
        if (COMPL.isBlacklisted(user_)) revert CapControl_Paused();

        _resetDayIfNeeded();

        // Kiểm tra hạn mức ngày
        uint256 bucket = block.timestamp / 1 days;
        uint256 used   = _userDailyOutflow[user_][bucket] + amountVnd_;
        if (used > dailyOutflowLimit)
            revert CapControl_DailyLimitExceeded(user_, dailyOutflowLimit, used);

        _userDailyOutflow[user_][bucket] = used;
        totalDailyOutflow               += amountVnd_;

        // Tính phí lũy tiến
        uint16 feeBps = _calcFeeBps(totalDailyOutflow);
        feeAmountVnd  = (amountVnd_ * feeBps) / 10_000;

        // Kích hoạt cảnh báo nếu vượt ngưỡng Tier3
        if (totalDailyOutflow >= TIER3_VND) {
            COMPL.raiseOutflowAlert(user_, amountVnd_);
        }

        emit OutflowProcessed(user_, amountVnd_, feeBps, feeAmountVnd);
    }

    /// @notice Tạm dừng khẩn cấp — chặn toàn bộ giao dịch xuất ngoại
    function emergencyPause(string calldata reason_) external {
        require(kernel.isPolicyActive(address(this)), "CapControl: not active");
        paused = true;
        emit EmergencyPause(msg.sender, reason_);
    }

    function emergencyUnpause() external {
        require(kernel.isPolicyActive(address(this)), "CapControl: not active");
        paused = false;
        emit EmergencyUnpause(msg.sender);
    }

    function setDailyOutflowLimit(uint256 limit_) external {
        require(kernel.isPolicyActive(address(this)), "CapControl: not active");
        dailyOutflowLimit = limit_;
        emit DailyLimitUpdated(limit_);
    }

    // ─── Internal ─────────────────────────────────────────────────────────

    function _calcFeeBps(uint256 totalOutflow_) internal pure returns (uint16) {
        if (totalOutflow_ < TIER1_VND) return 0;
        if (totalOutflow_ < TIER2_VND) return FEE_TIER1;
        if (totalOutflow_ < TIER3_VND) return FEE_TIER2;
        return FEE_TIER3;
    }

    function _resetDayIfNeeded() internal {
        uint256 today = block.timestamp / 1 days;
        if (today != _dayBucket) {
            totalDailyOutflow = 0;
            _dayBucket        = today;
        }
    }

    function userDailyOutflow(address user_) external view returns (uint256) {
        return _userDailyOutflow[user_][block.timestamp / 1 days];
    }
}
