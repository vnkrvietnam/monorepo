// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─── ISO20022Bridge.sol ───────────────────────────────────────────────────────
// Gateway interface kết nối bản tin SWIFT ISO 20022 với Blockchain.
// Được triển khai bởi swift-chain-bridge service để relay pacs.008 / pacs.009
// thành on-chain settlement events cho các VASP hợp lệ.
// ─────────────────────────────────────────────────────────────────────────────

error ISO20022_InvalidMessage(bytes32 msgId);
error ISO20022_AlreadySettled(bytes32 msgId);
error ISO20022_UnauthorizedSender(address sender);
error ISO20022_AmountMismatch(bytes32 msgId, uint256 expected, uint256 provided);

// ─── Structs ──────────────────────────────────────────────────────────────────

/// @notice Minimal on-chain representation of a pacs.008 / MT103 instruction
struct ISO20022Message {
    bytes32 msgId;           // Unique message ID (e2eId from ISO payload)
    address debtorAgent;     // Sending VASP wallet
    address creditorAgent;   // Receiving VASP wallet
    address currency;        // Stablecoin token address (DAI / USDT)
    uint256 amount;          // Transfer amount (18 decimals)
    uint256 valueDate;       // Unix timestamp for settlement
    string  purpose;         // Remittance purpose (ISO 20022 Purp code)
    bytes32 complianceRef;   // AML/NQ-05 reference hash
    bool    settled;
}

// ─── Interface ────────────────────────────────────────────────────────────────

interface IISO20022Bridge {
    // ─── Events ───────────────────────────────────────────────────────────

    event MessageReceived(
        bytes32 indexed msgId,
        address indexed debtorAgent,
        address indexed creditorAgent,
        uint256 amount,
        address currency
    );

    event MessageSettled(
        bytes32 indexed msgId,
        address indexed settledBy,
        uint256 timestamp
    );

    event MessageRejected(
        bytes32 indexed msgId,
        string  reason
    );

    // ─── Core functions ───────────────────────────────────────────────────

    /// @notice Submit a validated ISO 20022 message for on-chain settlement
    /// @param msg_ The decoded ISO 20022 message struct
    /// @param signature_ Oracle signature from the SWIFT Chain Bridge relayer
    function submitMessage(
        ISO20022Message calldata msg_,
        bytes calldata signature_
    ) external;

    /// @notice Confirm settlement of a previously submitted message
    function settleMessage(bytes32 msgId_) external;

    /// @notice Reject a message (compliance failure / AML block)
    function rejectMessage(bytes32 msgId_, string calldata reason_) external;

    // ─── Queries ──────────────────────────────────────────────────────────

    function getMessage(bytes32 msgId_) external view returns (ISO20022Message memory);
    function isSettled(bytes32 msgId_) external view returns (bool);
}

// ─── Minimal concrete implementation ─────────────────────────────────────────

abstract contract ISO20022BridgeBase is IISO20022Bridge {
    mapping(bytes32 => ISO20022Message) internal _messages;
    address public relayerOracle;

    constructor(address relayerOracle_) {
        relayerOracle = relayerOracle_;
    }

    function getMessage(bytes32 msgId_) external view override returns (ISO20022Message memory) {
        return _messages[msgId_];
    }

    function isSettled(bytes32 msgId_) external view override returns (bool) {
        return _messages[msgId_].settled;
    }
}
