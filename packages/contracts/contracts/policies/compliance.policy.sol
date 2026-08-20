// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// ─── compliance.policy.sol — CompliancePolicy ─────────────────────────────────
// Kiểm tra hạn mức giao dịch, AML Check và ghi log tuân thủ NQ-05 / NĐ-284.
// Mọi giao dịch vượt ngưỡng báo cáo phải được gắn complianceRef trước khi thực thi.
// ─────────────────────────────────────────────────────────────────────────────

error Compliance_LimitExceeded(address user, uint256 limit, uint256 amount);
error Compliance_AMLBlocked(address user, bytes32 reason);
error Compliance_RefRequired(bytes32 txId);
error Compliance_AlreadyReported(bytes32 txId);

struct ComplianceRecord {
    bytes32  txId;
    address  user;
    uint256  amount;       // in VND (1e18 = 1 VND)
    uint8    direction;    // 0 = IN, 1 = OUT
    uint8    riskLevel;    // 0=LOW 1=MEDIUM 2=HIGH 3=CRITICAL
    bytes32  amlRef;       // AML provider reference hash
    string   nq05Ref;      // NQ-05 / NĐ-284 compliance reference
    uint256  timestamp;
    bool     flagged;
}

contract CompliancePolicy is Policy {
    // ─── Limits (NQ-05 / NĐ-284) ─────────────────────────────────────────

    /// @notice Ngưỡng báo cáo giao dịch theo NQ-05 / NĐ-284 (VND, 18 dec) = 300.000.000 VND
    uint256 public reportingThreshold = 300_000_000 * 1e18;

    /// @notice Hạn mức khối lượng ngày của mỗi người dùng (VND, 18 dec) = 500.000.000 VND
    uint256 public dailyLimit = 500_000_000 * 1e18;

    // ─── State ────────────────────────────────────────────────────────────

    mapping(bytes32 => ComplianceRecord) public records;
    mapping(address => bool) public amlBlacklist;

    /// @notice Authorised AML oracle addresses
    mapping(address => bool) public amlOracles;

    /// @notice Theo dõi khối lượng ngày: user → day-bucket → VND tích lũy
    mapping(address => mapping(uint256 => uint256)) public dailyVolume;

    // ─── Events ───────────────────────────────────────────────────────────

    event TransactionLogged(bytes32 indexed txId, address indexed user, uint256 amount, uint8 riskLevel);
    event AMLFlagged(bytes32 indexed txId, address indexed user, bytes32 amlRef);
    event UserBlacklisted(address indexed user, bytes32 reason);
    event UserWhitelisted(address indexed user);
    event ThresholdUpdated(uint256 reportingThreshold, uint256 dailyLimit);
    event OracleSet(address indexed oracle, bool enabled);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Policy(kernel_) {}

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies()
        external
        override
        returns (bytes5[] memory deps)
    {
        deps = new bytes5[](0);
    }

    function requestPermissions()
        external
        view
        override
        returns (Permissions[] memory reqs)
    {
        reqs = new Permissions[](0);
    }

    // ─── AML Oracle management ────────────────────────────────────────────

    function setAmlOracle(address oracle_, bool enabled_) external {
        require(kernel.isPolicyActive(address(this)), "Compliance: not active");
        amlOracles[oracle_] = enabled_;
        emit OracleSet(oracle_, enabled_);
    }

    modifier onlyAmlOracle() {
        require(amlOracles[msg.sender], "Compliance: not oracle");
        _;
    }

    // ─── Compliance checks ────────────────────────────────────────────────

    /// @notice Pre-transaction check — revert if user is blocked or over daily limit
    function checkTransaction(
        address user_,
        uint256 amountUsd_,
        uint8   direction_,
        bytes32 complianceRef_
    ) external view {
        if (amlBlacklist[user_]) revert Compliance_AMLBlocked(user_, bytes32("BLACKLISTED"));

        // Reporting threshold: compliance ref required
        if (amountUsd_ >= reportingThreshold && complianceRef_ == bytes32(0))
            revert Compliance_RefRequired(bytes32(0));

        // Daily volume check
        uint256 bucket = block.timestamp / 1 days;
        uint256 used   = dailyVolume[user_][bucket];
        if (used + amountUsd_ > dailyLimit)
            revert Compliance_LimitExceeded(user_, dailyLimit, used + amountUsd_);
    }

    /// @notice Log a transaction — called by VASP relayer after execution
    function logTransaction(
        bytes32 txId_,
        address user_,
        uint256 amountUsd_,
        uint8   direction_,
        uint8   riskLevel_,
        bytes32 amlRef_,
        string calldata nq05Ref_
    ) external {
        require(amlOracles[msg.sender] || kernel.isPolicyActive(address(this)), "Compliance: unauthorized");
        if (records[txId_].txId != bytes32(0)) revert Compliance_AlreadyReported(txId_);

        records[txId_] = ComplianceRecord({
            txId:      txId_,
            user:      user_,
            amount:    amountUsd_,
            direction: direction_,
            riskLevel: riskLevel_,
            amlRef:    amlRef_,
            nq05Ref:   nq05Ref_,
            timestamp: block.timestamp,
            flagged:   riskLevel_ >= 2
        });

        // Update daily volume
        uint256 bucket = block.timestamp / 1 days;
        dailyVolume[user_][bucket] += amountUsd_;

        emit TransactionLogged(txId_, user_, amountUsd_, riskLevel_);
        if (riskLevel_ >= 2) emit AMLFlagged(txId_, user_, amlRef_);
    }

    /// @notice AML oracle blacklists a user
    function blacklistUser(address user_, bytes32 reason_) external onlyAmlOracle {
        amlBlacklist[user_] = true;
        emit UserBlacklisted(user_, reason_);
    }

    /// @notice Admin removes user from blacklist
    function whitelistUser(address user_) external {
        require(kernel.isPolicyActive(address(this)), "Compliance: not active");
        amlBlacklist[user_] = false;
        emit UserWhitelisted(user_);
    }

    /// @notice Update regulatory thresholds (NQ-05 / NĐ-284 revisions)
    function updateThresholds(uint256 reporting_, uint256 daily_) external {
        require(kernel.isPolicyActive(address(this)), "Compliance: not active");
        reportingThreshold = reporting_;
        dailyLimit         = daily_;
        emit ThresholdUpdated(reporting_, daily_);
    }
}
