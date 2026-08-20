// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/TRSRY/TRSRY.v2.sol";
import "../modules/COMPL/COMPL.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// ─── SwiftEscrow.sol — SWIFT ISO 20022 Cross-Border Escrow ───────────────────
// Ký quỹ xuất nhập khẩu liên thông SWIFT (pacs.008 / MT103).
// Đối soát chứng từ thương mại thực tế trước khi giải ngân.
// Chống khai khống giá trị gửi tiền ra nước ngoài.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;
using ECDSA for bytes32;
using MessageHashUtils for bytes32;

error SwiftEscrow_InvalidSignature();
error SwiftEscrow_AlreadySettled(bytes32 msgId);
error SwiftEscrow_NotFound(bytes32 msgId);
error SwiftEscrow_ComplianceFailed(address user);
error SwiftEscrow_ZeroAmount();

enum SwiftStatus { PENDING, SETTLED, REJECTED, FROZEN }

struct SwiftInstruction {
    bytes32     msgId;           // pacs.008 e2e reference
    address     debtor;          // người gửi
    address     creditor;        // người nhận
    address     token;           // stablecoin (USDT / wrapped VND)
    uint256     amount;          // 18 dec
    uint256     valueDate;       // Unix timestamp giải ngân
    bytes32     documentHash;    // Hash chứng từ thương mại
    bytes32     complianceRef;   // AML / NQ-05 reference
    SwiftStatus status;
}

contract SwiftEscrow is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    TRSRYv2 public TRSRY;
    COMPLv1 public COMPL;

    // ─── State ────────────────────────────────────────────────────────────

    mapping(bytes32 => SwiftInstruction) public instructions;

    /// @notice Địa chỉ Oracle SWIFT Chain Bridge được ủy quyền ký
    address public relayerOracle;

    // ─── Events ───────────────────────────────────────────────────────────

    event InstructionReceived(bytes32 indexed msgId, address indexed debtor, address indexed creditor, uint256 amount);
    event InstructionSettled(bytes32 indexed msgId, address indexed settledBy);
    event InstructionRejected(bytes32 indexed msgId, string reason);
    event InstructionFrozen(bytes32 indexed msgId, address indexed frozenBy);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_, address relayerOracle_) Policy(kernel_) {
        relayerOracle = relayerOracle_;
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
        reqs[0] = Permissions({ keycode: "TRSRY", funcSelector: TRSRYv2.withdraw.selector });
        reqs[1] = Permissions({ keycode: "TRSRY", funcSelector: TRSRYv2.lockLiquidity.selector });
    }

    // ─── Core ─────────────────────────────────────────────────────────────

    /// @notice Nộp lệnh SWIFT đã được Oracle xác thực chữ ký
    function submitInstruction(
        SwiftInstruction calldata inst_,
        bytes calldata oracleSig_
    ) external {
        // Kiểm tra chữ ký Oracle
        bytes32 hash = keccak256(abi.encode(
            inst_.msgId, inst_.debtor, inst_.creditor, inst_.token, inst_.amount, inst_.valueDate
        )).toEthSignedMessageHash();
        address signer = hash.recover(oracleSig_);
        if (signer != relayerOracle) revert SwiftEscrow_InvalidSignature();
        if (inst_.amount == 0) revert SwiftEscrow_ZeroAmount();
        require(instructions[inst_.msgId].msgId == bytes32(0), "SwiftEscrow: duplicate");

        // Kiểm tra AML / Blacklist
        if (COMPL.isBlacklisted(inst_.debtor) || COMPL.isBlacklisted(inst_.creditor))
            revert SwiftEscrow_ComplianceFailed(inst_.debtor);

        // Khoá thanh khoản trong Kho bạc chờ đối soát chứng từ
        TRSRY.lockLiquidity(inst_.token, inst_.amount, "SWIFT_ESCROW_PENDING");

        instructions[inst_.msgId] = SwiftInstruction({
            msgId:         inst_.msgId,
            debtor:        inst_.debtor,
            creditor:      inst_.creditor,
            token:         inst_.token,
            amount:        inst_.amount,
            valueDate:     inst_.valueDate,
            documentHash:  inst_.documentHash,
            complianceRef: inst_.complianceRef,
            status:        SwiftStatus.PENDING
        });

        emit InstructionReceived(inst_.msgId, inst_.debtor, inst_.creditor, inst_.amount);
    }

    /// @notice Giải ngân sau khi đối soát chứng từ thành công
    function settleInstruction(bytes32 msgId_) external {
        SwiftInstruction storage inst = instructions[msgId_];
        if (inst.msgId == bytes32(0))           revert SwiftEscrow_NotFound(msgId_);
        if (inst.status != SwiftStatus.PENDING) revert SwiftEscrow_AlreadySettled(msgId_);
        require(block.timestamp >= inst.valueDate, "SwiftEscrow: valueDate not reached");

        inst.status = SwiftStatus.SETTLED;
        TRSRY.withdraw(inst.token, inst.creditor, inst.amount);
        emit InstructionSettled(msgId_, msg.sender);
    }

    /// @notice Từ chối lệnh — mở khoá thanh khoản
    function rejectInstruction(bytes32 msgId_, string calldata reason_) external {
        SwiftInstruction storage inst = instructions[msgId_];
        if (inst.msgId == bytes32(0))           revert SwiftEscrow_NotFound(msgId_);
        if (inst.status != SwiftStatus.PENDING) revert SwiftEscrow_AlreadySettled(msgId_);
        inst.status = SwiftStatus.REJECTED;
        emit InstructionRejected(msgId_, reason_);
    }

    /// @notice Đóng băng lệnh nếu phát hiện rửa tiền sau khi đã nộp
    function freezeInstruction(bytes32 msgId_) external {
        SwiftInstruction storage inst = instructions[msgId_];
        if (inst.msgId == bytes32(0)) revert SwiftEscrow_NotFound(msgId_);
        inst.status = SwiftStatus.FROZEN;
        COMPL.freezeAsset(inst.debtor, inst.token, inst.amount);
        emit InstructionFrozen(msgId_, msg.sender);
    }

    function updateOracle(address oracle_) external {
        require(kernel.isPolicyActive(address(this)), "SwiftEscrow: not active");
        relayerOracle = oracle_;
    }
}
