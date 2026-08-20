// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../../kernel/Module.sol";
import "./interfaces/ICOMPL.v1.sol";

// ─── COMPL.v1.sol — Blacklist, AML & Capital Flight Storage ──────────────────
// Bộ lọc an ninh quốc gia: Lưu danh sách đen, danh sách cấm vận (Sanctions),
// kiểm soát hạn mức chuyển tiền VNĐ và tạm dừng giao dịch nghi vấn.
// ─────────────────────────────────────────────────────────────────────────────

error COMPL_AlreadyBlacklisted(address user);
error COMPL_NotBlacklisted(address user);
error COMPL_AlreadyFrozen(address user, address token);
error COMPL_DuplicateTxLog(bytes32 txId);
error COMPL_UserBlacklisted(address user);

contract COMPLv1 is Module, ICOMPL {
    // ─── State ────────────────────────────────────────────────────────────

    mapping(address => ComplianceEntry) private _entries;
    mapping(address => mapping(address => uint256)) public frozenAmounts; // user → token → amount

    /// @notice Khối lượng xuất ngoại theo ngày: user → day-bucket → VND tích lũy
    mapping(address => mapping(uint256 => uint256)) private _dailyOutflow;

    /// @notice Log giao dịch đã kiểm tra
    mapping(bytes32 => bool) public loggedTxIds;

    /// @notice Ngưỡng báo cáo (VND, 18 dec) = 300.000.000 VND (NQ-05)
    uint256 public outflowAlertThreshold = 300_000_000 * 1e18;

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Module(kernel_) {}

    // ─── Module interface ─────────────────────────────────────────────────

    function KEYCODE() external pure override returns (bytes5) { return "COMPL"; }
    function VERSION() external pure override returns (uint8 major, uint8 minor) { return (1, 0); }

    // ─── Permissioned writes ──────────────────────────────────────────────

    function blacklist(address user_, SanctionType type_, bytes32 ref_) external override permissioned {
        if (_entries[user_].frozen && _entries[user_].sanctionType != SanctionType.NONE)
            revert COMPL_AlreadyBlacklisted(user_);
        _entries[user_] = ComplianceEntry({
            user:           user_,
            sanctionType:   type_,
            referenceHash:  ref_,
            timestamp:      block.timestamp,
            frozen:         true
        });
        emit UserBlacklisted(user_, type_, ref_);
    }

    function whitelist(address user_) external override permissioned {
        if (!_entries[user_].frozen) revert COMPL_NotBlacklisted(user_);
        _entries[user_].frozen        = false;
        _entries[user_].sanctionType  = SanctionType.NONE;
        emit UserWhitelisted(user_);
    }

    function freezeAsset(address user_, address token_, uint256 amount_) external override permissioned {
        frozenAmounts[user_][token_] += amount_;
        emit AssetFrozen(user_, token_, amount_);
    }

    function unfreezeAsset(address user_, address token_) external override permissioned {
        frozenAmounts[user_][token_] = 0;
        emit AssetUnfrozen(user_, token_);
    }

    function logTransaction(
        bytes32 txId_,
        address user_,
        uint256 amountVnd_,
        uint8   direction_,
        RiskLevel risk_,
        bytes32 amlRef_,
        string calldata nq05Ref_
    ) external override permissioned {
        if (loggedTxIds[txId_]) revert COMPL_DuplicateTxLog(txId_);
        loggedTxIds[txId_] = true;

        // Cộng vào khối lượng ngày nếu là giao dịch xuất ngoại (direction = 1)
        if (direction_ == 1) {
            uint256 bucket = block.timestamp / 1 days;
            _dailyOutflow[user_][bucket] += amountVnd_;
            if (_dailyOutflow[user_][bucket] >= outflowAlertThreshold) {
                emit OutflowAlertRaised(user_, _dailyOutflow[user_][bucket]);
            }
        }

        emit TransactionLogged(txId_, user_, amountVnd_, risk_);
    }

    function raiseOutflowAlert(address user_, uint256 amountVnd_) external override permissioned {
        emit OutflowAlertRaised(user_, amountVnd_);
    }

    function updateOutflowThreshold(uint256 threshold_) external permissioned {
        outflowAlertThreshold = threshold_;
    }

    // ─── Views ────────────────────────────────────────────────────────────

    function isBlacklisted(address user_) external view override returns (bool) {
        return _entries[user_].frozen;
    }

    function isFrozen(address user_) external view override returns (bool) {
        return _entries[user_].frozen;
    }

    function getEntry(address user_) external view override returns (ComplianceEntry memory) {
        return _entries[user_];
    }

    function dailyOutflowVnd(address user_) external view override returns (uint256) {
        return _dailyOutflow[user_][block.timestamp / 1 days];
    }
}
