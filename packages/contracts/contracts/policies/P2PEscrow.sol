// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../kernel/Module.sol";
import "../modules/COMPL/COMPL.v1.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// ─── P2PEscrow.sol — Web3 P2P Anti-Fraud Escrow Policy ───────────────────────
// Khóa tài sản P2P tự động.
// Chống gian lận, lừa đảo tài chính qua mạng.
// Bảo vệ người dùng trong nước khi giao dịch tài sản số.
// ─────────────────────────────────────────────────────────────────────────────

using SafeERC20 for IERC20;

error P2PEscrow_NotFound(bytes32 orderId);
error P2PEscrow_InvalidStatus(bytes32 orderId);
error P2PEscrow_Unauthorized(address caller);
error P2PEscrow_ZeroAmount();
error P2PEscrow_Blacklisted(address user);
error P2PEscrow_Duplicate(bytes32 orderId);

enum P2PStatus { LOCKED, FIAT_CONFIRMED, RELEASED, CANCELLED, DISPUTED, FROZEN }

struct P2POrder {
    bytes32   orderId;
    address   seller;
    address   buyer;
    address   token;
    uint256   amount;
    uint256   vndAmount;
    P2PStatus status;
    uint256   expiresAt;
}

contract P2PEscrow is Policy {
    // ─── Modules ──────────────────────────────────────────────────────────

    COMPLv1 public COMPL;

    // ─── State ────────────────────────────────────────────────────────────

    mapping(bytes32 => P2POrder) public orders;
    mapping(address => bool) public operators;
    uint256 public escrowDuration = 30 minutes;

    // ─── Events ───────────────────────────────────────────────────────────

    event OrderCreated(bytes32 indexed orderId, address indexed seller, address indexed buyer, uint256 amount);
    event FiatConfirmed(bytes32 indexed orderId, address confirmedBy);
    event TokenReleased(bytes32 indexed orderId, address indexed buyer, uint256 amount);
    event OrderCancelled(bytes32 indexed orderId);
    event DisputeRaised(bytes32 indexed orderId, address by);
    event DisputeResolved(bytes32 indexed orderId, address indexed winner);
    event OrderFrozen(bytes32 indexed orderId, string reason);

    // ─── Constructor ──────────────────────────────────────────────────────

    constructor(Kernel kernel_) Policy(kernel_) {}

    // ─── Policy interface ─────────────────────────────────────────────────

    function configureDependencies() external override returns (bytes5[] memory deps) {
        deps    = new bytes5[](1);
        deps[0] = "COMPL";
        COMPL   = COMPLv1(getModuleAddress("COMPL"));
    }

    function requestPermissions() external view override returns (Permissions[] memory reqs) {
        reqs    = new Permissions[](1);
        reqs[0] = Permissions({ keycode: "COMPL", funcSelector: COMPLv1.freezeAsset.selector });
    }

    // ─── Operator management ──────────────────────────────────────────────

    function setOperator(address op_, bool enabled_) external {
        require(kernel.isPolicyActive(address(this)), "P2PEscrow: not active");
        operators[op_] = enabled_;
    }

    modifier onlyOperator() {
        require(operators[msg.sender], "P2PEscrow: not operator");
        _;
    }

    // ─── Order lifecycle ──────────────────────────────────────────────────

    function createOrder(
        bytes32 orderId_,
        address buyer_,
        address token_,
        uint256 amount_,
        uint256 vndAmount_
    ) external {
        if (amount_ == 0) revert P2PEscrow_ZeroAmount();
        if (orders[orderId_].orderId != bytes32(0)) revert P2PEscrow_Duplicate(orderId_);
        if (COMPL.isBlacklisted(msg.sender)) revert P2PEscrow_Blacklisted(msg.sender);
        if (COMPL.isBlacklisted(buyer_))     revert P2PEscrow_Blacklisted(buyer_);

        IERC20(token_).safeTransferFrom(msg.sender, address(this), amount_);

        orders[orderId_] = P2POrder({
            orderId:   orderId_,
            seller:    msg.sender,
            buyer:     buyer_,
            token:     token_,
            amount:    amount_,
            vndAmount: vndAmount_,
            status:    P2PStatus.LOCKED,
            expiresAt: block.timestamp + escrowDuration
        });

        emit OrderCreated(orderId_, msg.sender, buyer_, amount_);
    }

    function confirmFiat(bytes32 orderId_) external {
        P2POrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0))       revert P2PEscrow_NotFound(orderId_);
        if (o.status != P2PStatus.LOCKED)  revert P2PEscrow_InvalidStatus(orderId_);
        if (msg.sender != o.buyer && !operators[msg.sender]) revert P2PEscrow_Unauthorized(msg.sender);
        o.status = P2PStatus.FIAT_CONFIRMED;
        emit FiatConfirmed(orderId_, msg.sender);
    }

    function releaseToken(bytes32 orderId_) external onlyOperator {
        P2POrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0))                  revert P2PEscrow_NotFound(orderId_);
        if (o.status != P2PStatus.FIAT_CONFIRMED)     revert P2PEscrow_InvalidStatus(orderId_);
        o.status = P2PStatus.RELEASED;
        IERC20(o.token).safeTransfer(o.buyer, o.amount);
        emit TokenReleased(orderId_, o.buyer, o.amount);
    }

    function cancelOrder(bytes32 orderId_) external {
        P2POrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0))      revert P2PEscrow_NotFound(orderId_);
        if (o.status != P2PStatus.LOCKED) revert P2PEscrow_InvalidStatus(orderId_);
        if (msg.sender != o.seller)       revert P2PEscrow_Unauthorized(msg.sender);
        o.status = P2PStatus.CANCELLED;
        IERC20(o.token).safeTransfer(o.seller, o.amount);
        emit OrderCancelled(orderId_);
    }

    function raiseDispute(bytes32 orderId_) external {
        P2POrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0)) revert P2PEscrow_NotFound(orderId_);
        require(msg.sender == o.seller || msg.sender == o.buyer, "P2PEscrow: not party");
        require(o.status == P2PStatus.LOCKED || o.status == P2PStatus.FIAT_CONFIRMED, "P2PEscrow: cannot dispute");
        o.status = P2PStatus.DISPUTED;
        emit DisputeRaised(orderId_, msg.sender);
    }

    function resolveDispute(bytes32 orderId_, address winner_) external onlyOperator {
        P2POrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0))           revert P2PEscrow_NotFound(orderId_);
        if (o.status != P2PStatus.DISPUTED)    revert P2PEscrow_InvalidStatus(orderId_);
        require(winner_ == o.seller || winner_ == o.buyer, "P2PEscrow: invalid winner");
        o.status = P2PStatus.RELEASED;
        IERC20(o.token).safeTransfer(winner_, o.amount);
        emit DisputeResolved(orderId_, winner_);
    }

    /// @notice Đóng băng lệnh khi phát hiện gian lận
    function freezeOrder(bytes32 orderId_, string calldata reason_) external onlyOperator {
        P2POrder storage o = orders[orderId_];
        if (o.orderId == bytes32(0)) revert P2PEscrow_NotFound(orderId_);
        o.status = P2PStatus.FROZEN;
        COMPL.freezeAsset(o.seller, o.token, o.amount);
        emit OrderFrozen(orderId_, reason_);
    }
}
