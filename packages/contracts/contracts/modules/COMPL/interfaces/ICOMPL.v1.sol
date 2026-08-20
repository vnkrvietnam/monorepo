// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── ICOMPL.v1.sol ───────────────────────────────────────────────────────────
// Interface cho module Compliance, Blacklist & Capital Flight Storage V1.
// ─────────────────────────────────────────────────────────────────────────────

interface ICOMPL {
    enum RiskLevel { LOW, MEDIUM, HIGH, CRITICAL }
    enum SanctionType { NONE, AML, SANCTIONS, CAPITAL_FLIGHT, FRAUD }

    struct ComplianceEntry {
        address user;
        SanctionType sanctionType;
        bytes32 referenceHash;  // AML/NQ-05 tham chiếu
        uint256 timestamp;
        bool    frozen;         // Tài sản bị đóng băng
    }

    event UserBlacklisted(address indexed user, SanctionType sanctionType, bytes32 ref);
    event UserWhitelisted(address indexed user);
    event AssetFrozen(address indexed user, address indexed token, uint256 amount);
    event AssetUnfrozen(address indexed user, address indexed token);
    event OutflowAlertRaised(address indexed user, uint256 amountVnd);
    event TransactionLogged(bytes32 indexed txId, address indexed user, uint256 amountVnd, RiskLevel risk);

    function blacklist(address user, SanctionType sanctionType, bytes32 referenceHash) external;
    function whitelist(address user) external;
    function freezeAsset(address user, address token, uint256 amount) external;
    function unfreezeAsset(address user, address token) external;
    function logTransaction(bytes32 txId, address user, uint256 amountVnd, uint8 direction, RiskLevel risk, bytes32 amlRef, string calldata nq05Ref) external;
    function raiseOutflowAlert(address user, uint256 amountVnd) external;

    function isBlacklisted(address user) external view returns (bool);
    function isFrozen(address user) external view returns (bool);
    function getEntry(address user) external view returns (ComplianceEntry memory);
    function dailyOutflowVnd(address user) external view returns (uint256);
}
