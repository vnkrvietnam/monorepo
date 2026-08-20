// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── vasp-escrow.policy.sol — VaspEscrowPolicy ───────────────────────────────
// Quản lý ký quỹ P2P, đối soát giao dịch VASP và chứng khoán số.
// Người bán lock token vào escrow; người mua xác nhận fiat đã chuyển;
// operator (VASP relayer) giải phóng token cho người mua.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error Escrow_OrderNotFound(bytes32 orderId);
error Escrow_InvalidStatus(bytes32 orderId);
error Escrow_Unauthorized(address caller);
error Escrow_ZeroAmount();
error Escrow_AlreadyDisputed(bytes32 orderId);

enum EscrowStatus { OPEN, LOCKED, FIAT_CONFIRMED, RELEASED, CANCELLED, DISPUTED }

struct EscrowOrder {
    bytes32        orderId;
    address        seller;
    address        buyer;
    address        token;
    uint256        amount;
    uint256        fiatAmount;    // off-chain fiat amount (informational)
    string         fiatCurrency;
    EscrowStatus   status;
    uint256        createdAt;
    uint256        expiresAt;
}

contract VaspEscrowPolicy is Policy {
    // ─── State ────────────────────────────────────────────────────────────

    mapping(bytes32 => EscrowOrder) public orders;

    /// @notice Authorised VASP relayer operators
    mapping(address => bool) public operators;

    uint256 public escrowDuration = 30 minutes;

    // ─── Events ───────────────────────────────────────────────────────────

    event OrderCreated(bytes32 indexed orderId, address indexed seller, address indexed buyer, uint256 amount);
    event OrderLocked(bytes32 indexed orderId);
    event FiatConfirmed(bytes32 indexed orderId, address indexed confirmedBy);
    event TokenReleased(bytes32 indexed orderId, address indexed buyer, uint256 amount);
    event OrderCancelled(bytes32 indexed orderId);
    event OrderDisputed(bytes32 indexed orderId, address indexed disputedBy);
    event DisputeResolved(bytes32 indexed orderId, address indexed winner);
    event OperatorSet(address indexed op, bool enabled);

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

    // ─── Operator management ──────────────────────────────────────────────

    function setOperator(address op_, bool enabled_) external {
        require(kernel.isPolicyActive(address(this)), "Escrow: not active");
        operators[op_] = enabled_;
        emit OperatorSet(op_, enabled_);
    }

    modifier onlyOperator() {
        if (!operators[msg.sender]) revert Escrow_Unauthorized(msg.sender);
        _;
    }

    // ─── Escrow lifecycle ─────────────────────────────────────────────────

    /// @notice Seller creates an order and locks tokens into escrow
    function createOrder(
        bytes32 orderId_,
        address buyer_,
        address token_,
        uint256 amount_,
        uint256 fiatAmount_,
        string calldata fiatCurrency_
    ) external {
        if (amount_ == 0) revert Escrow_ZeroAmount();
        require(orders[orderId_].orderId == bytes32(0), "Escrow: duplicate orderId");

        IERC20(token_).safeTransferFrom(msg.sender, address(this), amount_);

        orders[orderId_] = EscrowOrder({
            orderId:      orderId_,
            seller:       msg.sender,
            buyer:        buyer_,
            token:        token_,
            amount:       amount_,
            fiatAmount:   fiatAmount_,
            fiatCurrency: fiatCurrency_,
            status:       EscrowStatus.LOCKED,
            createdAt:    block.timestamp,
            expiresAt:    block.timestamp + escrowDuration
        });

        emit OrderCreated(orderId_, msg.sender, buyer_, amount_);
        emit OrderLocked(orderId_);
    }

    /// @notice Buyer (or operator) confirms fiat payment sent
    function confirmFiat(bytes32 orderId_) external {
        EscrowOrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0)) revert Escrow_OrderNotFound(orderId_);
        if (o.status != EscrowStatus.LOCKED) revert Escrow_InvalidStatus(orderId_);
        if (msg.sender != o.buyer && !operators[msg.sender])
            revert Escrow_Unauthorized(msg.sender);
        o.status = EscrowStatus.FIAT_CONFIRMED;
        emit FiatConfirmed(orderId_, msg.sender);
    }

    /// @notice Operator releases token to buyer after fiat confirmed
    function releaseToken(bytes32 orderId_) external onlyOperator {
        EscrowOrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0)) revert Escrow_OrderNotFound(orderId_);
        if (o.status != EscrowStatus.FIAT_CONFIRMED) revert Escrow_InvalidStatus(orderId_);
        o.status = EscrowStatus.RELEASED;
        IERC20(o.token).safeTransfer(o.buyer, o.amount);
        emit TokenReleased(orderId_, o.buyer, o.amount);
    }

    /// @notice Seller cancels an open order (before fiat confirmation)
    function cancelOrder(bytes32 orderId_) external {
        EscrowOrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0)) revert Escrow_OrderNotFound(orderId_);
        if (o.status != EscrowStatus.LOCKED) revert Escrow_InvalidStatus(orderId_);
        if (msg.sender != o.seller) revert Escrow_Unauthorized(msg.sender);
        o.status = EscrowStatus.CANCELLED;
        IERC20(o.token).safeTransfer(o.seller, o.amount);
        emit OrderCancelled(orderId_);
    }

    /// @notice Either party raises a dispute
    function raiseDispute(bytes32 orderId_) external {
        EscrowOrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0)) revert Escrow_OrderNotFound(orderId_);
        if (o.status == EscrowStatus.DISPUTED) revert Escrow_AlreadyDisputed(orderId_);
        require(msg.sender == o.seller || msg.sender == o.buyer, "Escrow: not party");
        o.status = EscrowStatus.DISPUTED;
        emit OrderDisputed(orderId_, msg.sender);
    }

    /// @notice Operator resolves dispute — token goes to winner
    function resolveDispute(bytes32 orderId_, address winner_) external onlyOperator {
        EscrowOrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0)) revert Escrow_OrderNotFound(orderId_);
        if (o.status != EscrowStatus.DISPUTED) revert Escrow_InvalidStatus(orderId_);
        require(winner_ == o.seller || winner_ == o.buyer, "Escrow: invalid winner");
        o.status = EscrowStatus.RELEASED;
        IERC20(o.token).safeTransfer(winner_, o.amount);
        emit DisputeResolved(orderId_, winner_);
    }
}
