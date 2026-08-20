// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

// ─── VNKRSwiftBridge ──────────────────────────────────────────────────────────
//
// Smart Contract quản lý trạng thái kết nối SWIFT <-> VNKR App-Chain EVM.
//
// Luồng INBOUND  (Fiat → On-Chain):
//   Ngân hàng gửi SWIFT MT103/pacs.008
//   → swift-gateway (Port 4004) nhận & xác thực LAU
//   → swift-chain-bridge (Relayer) gọi settleInboundSwift()
//   → Contract Mint AXVN Token cho ví beneficiary
//
// Luồng OUTBOUND (On-Chain → Fiat SWIFT):
//   Người dùng gọi requestOutboundSwift() kèm UETR
//   → Contract Burn AXVN Token từ ví người gửi
//   → Emit SwiftOutboundRequested event
//   → swift-chain-bridge (Relayer) bắt event → gọi swift-gateway /send-mt103
//
// Deployed on: VNKR Enterprise App-Chain EVM (Hyperledger Besu)
// Program ID: EVM_CONTRACTS.VNKR_SWIFT_BRIDGE (packages/config/src/index.ts)

contract VNKRSwiftBridge {

    // ─── State Variables ─────────────────────────────────────────────────────

    /// Địa chỉ Oracle Relayer duy nhất được phép gọi settleInboundSwift()
    address public oracleRelayer;

    /// Pending relayer — dùng cho 2-step ownership transfer
    address public pendingRelayer;

    /// Owner contract (quản trị: set relayer, upgrade)
    address public owner;

    /// Token AXVN (hoặc RWA Stablecoin) được mint/burn bởi bridge
    IERC20Mintable public axvnToken;

    /// Tỷ lệ quy đổi: 1 USD fiat = bao nhiêu AXVN token (18 decimals)
    /// Default: 1:1 (1 USD = 1e18 AXVN)
    uint256 public conversionRate;

    /// Phí bridge tính theo basis points (100 = 1%)
    uint256 public bridgeFeeBps;

    /// Địa chỉ nhận phí
    address public feeRecipient;

    // ─── Enums & Structs ─────────────────────────────────────────────────────

    enum TransactionStatus { NONE, PENDING, SETTLED, FAILED, REFUNDED }

    struct SwiftRecord {
        bytes32 uetrHash;
        string  senderBic;
        string  receiverBic;
        uint256 amount;         // Số tiền fiat (đơn vị: USD cents hoặc wei tương đương)
        uint256 tokenAmount;    // Số AXVN token mint/burn tương ứng
        address beneficiary;    // Ví nhận token (inbound) hoặc người gửi (outbound)
        TransactionStatus status;
        uint256 settledAt;      // Unix timestamp khi settled
    }

    // ─── Mappings ─────────────────────────────────────────────────────────────

    /// UETR hash → SwiftRecord
    mapping(bytes32 => SwiftRecord) public swiftRecords;

    /// Tổng giá trị đã bridge inbound (tính bằng token amount)
    uint256 public totalInboundBridged;

    /// Tổng giá trị đã bridge outbound (tính bằng token amount)
    uint256 public totalOutboundBridged;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// Phát ra khi Relayer settle thành công inbound SWIFT payment → Mint token
    event SwiftInboundSettled(
        bytes32 indexed uetrHash,
        address indexed beneficiary,
        uint256         amount,
        uint256         tokenAmount,
        string          senderBic
    );

    /// Phát ra khi người dùng yêu cầu outbound SWIFT transfer (burn token)
    event SwiftOutboundRequested(
        bytes32 indexed uetrHash,
        address indexed sender,
        string          receiverBic,
        uint256         amount,
        uint256         tokenAmountBurned
    );

    /// Phát ra khi Relayer đánh dấu outbound SETTLED (điện SWIFT đã gửi thành công)
    event SwiftOutboundSettled(bytes32 indexed uetrHash, string transmissionId);

    /// Phát ra khi Relayer đánh dấu outbound FAILED → hoàn token
    event SwiftOutboundRefunded(bytes32 indexed uetrHash, address indexed to, uint256 tokenAmount);

    event OracleRelayerChanged(address indexed oldRelayer, address indexed newRelayer);
    event ConversionRateUpdated(uint256 oldRate, uint256 newRate);
    event BridgeFeeUpdated(uint256 oldBps, uint256 newBps);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyRelayer() {
        require(msg.sender == oracleRelayer, "VNKR: Only Relayer Authorized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "VNKR: Only Owner");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _axvnToken,
        address _oracleRelayer,
        address _feeRecipient,
        uint256 _conversionRate,
        uint256 _bridgeFeeBps
    ) {
        require(_axvnToken != address(0),      "VNKR: Zero token address");
        require(_oracleRelayer != address(0),  "VNKR: Zero relayer address");
        require(_feeRecipient != address(0),   "VNKR: Zero fee recipient");
        require(_conversionRate > 0,           "VNKR: Zero conversion rate");
        require(_bridgeFeeBps <= 1000,         "VNKR: Fee exceeds 10%");

        axvnToken      = IERC20Mintable(_axvnToken);
        oracleRelayer  = _oracleRelayer;
        feeRecipient   = _feeRecipient;
        conversionRate = _conversionRate;
        bridgeFeeBps   = _bridgeFeeBps;
        owner          = msg.sender;
    }

    // ─── Inbound: SWIFT → On-Chain ────────────────────────────────────────────

    /**
     * @notice Được gọi bởi Oracle Relayer sau khi swift-gateway xác nhận nhận điện
     *         MT103/pacs.008 inbound từ ngân hàng nước ngoài.
     *
     * @param uetr          Unique End-to-End Transaction Reference (UUID v4)
     * @param senderBic     BIC của ngân hàng gửi điện
     * @param beneficiary   Địa chỉ EVM ví nhận token AXVN
     * @param amount        Số tiền fiat (đơn vị: USD * 1e6, tức là micro-dollar)
     */
    function settleInboundSwift(
        string  calldata uetr,
        string  calldata senderBic,
        address          beneficiary,
        uint256          amount
    ) external onlyRelayer {
        require(beneficiary != address(0), "VNKR: Zero beneficiary");
        require(amount > 0, "VNKR: Zero amount");

        bytes32 uetrHash = keccak256(abi.encodePacked(uetr));
        require(
            swiftRecords[uetrHash].status == TransactionStatus.NONE,
            "VNKR: UETR already processed"
        );

        // Tính số token sau khi trừ phí bridge
        uint256 fee         = (amount * bridgeFeeBps) / 10_000;
        uint256 netAmount   = amount - fee;
        uint256 tokenAmount = (netAmount * conversionRate) / 1e6;

        swiftRecords[uetrHash] = SwiftRecord({
            uetrHash:    uetrHash,
            senderBic:   senderBic,
            receiverBic: "VNKRVNVNXXX",
            amount:      amount,
            tokenAmount: tokenAmount,
            beneficiary: beneficiary,
            status:      TransactionStatus.SETTLED,
            settledAt:   block.timestamp
        });

        totalInboundBridged += tokenAmount;

        // Mint AXVN Token cho beneficiary
        axvnToken.mint(beneficiary, tokenAmount);

        // Mint phí cho feeRecipient
        if (fee > 0) {
            uint256 feeTokens = (fee * conversionRate) / 1e6;
            axvnToken.mint(feeRecipient, feeTokens);
        }

        emit SwiftInboundSettled(uetrHash, beneficiary, amount, tokenAmount, senderBic);
    }

    // ─── Outbound: On-Chain → SWIFT ───────────────────────────────────────────

    /**
     * @notice Người dùng / Định chế khóa/burn AXVN Token để kích hoạt chuyển tiền
     *         SWIFT Fiat ra ngân hàng quốc tế. Relayer sẽ bắt event và bắn MT103.
     *
     * @param uetr          UETR do client tạo (UUID v4, phải unique)
     * @param receiverBic   BIC ngân hàng nhận tiền
     * @param amount        Số tiền fiat muốn nhận (USD * 1e6)
     */
    function requestOutboundSwift(
        string calldata uetr,
        string calldata receiverBic,
        uint256         amount
    ) external {
        require(amount > 0, "VNKR: Zero amount");
        require(bytes(receiverBic).length >= 8, "VNKR: Invalid BIC");

        bytes32 uetrHash = keccak256(abi.encodePacked(uetr));
        require(
            swiftRecords[uetrHash].status == TransactionStatus.NONE,
            "VNKR: Duplicate UETR"
        );

        uint256 tokenAmountToBurn = (amount * conversionRate) / 1e6;

        // Burn AXVN Token từ ví người gửi (yêu cầu approve trước)
        axvnToken.burnFrom(msg.sender, tokenAmountToBurn);

        swiftRecords[uetrHash] = SwiftRecord({
            uetrHash:    uetrHash,
            senderBic:   "VNKRVNVNXXX",
            receiverBic: receiverBic,
            amount:      amount,
            tokenAmount: tokenAmountToBurn,
            beneficiary: msg.sender,
            status:      TransactionStatus.PENDING,
            settledAt:   0
        });

        totalOutboundBridged += tokenAmountToBurn;

        emit SwiftOutboundRequested(uetrHash, msg.sender, receiverBic, amount, tokenAmountToBurn);
    }

    /**
     * @notice Relayer gọi sau khi điện SWIFT gửi thành công (MGW ACK).
     */
    function confirmOutboundSwift(
        string calldata uetr,
        string calldata transmissionId
    ) external onlyRelayer {
        bytes32 uetrHash = keccak256(abi.encodePacked(uetr));
        require(
            swiftRecords[uetrHash].status == TransactionStatus.PENDING,
            "VNKR: Record not PENDING"
        );
        swiftRecords[uetrHash].status    = TransactionStatus.SETTLED;
        swiftRecords[uetrHash].settledAt = block.timestamp;

        emit SwiftOutboundSettled(uetrHash, transmissionId);
    }

    /**
     * @notice Relayer hoàn token khi điện SWIFT thất bại (timeout / reject).
     */
    function refundOutboundSwift(string calldata uetr) external onlyRelayer {
        bytes32 uetrHash = keccak256(abi.encodePacked(uetr));
        SwiftRecord storage record = swiftRecords[uetrHash];
        require(record.status == TransactionStatus.PENDING, "VNKR: Record not PENDING");
        require(record.beneficiary != address(0), "VNKR: No beneficiary");

        record.status    = TransactionStatus.REFUNDED;
        record.settledAt = block.timestamp;

        // Mint lại token cho người đã burn
        axvnToken.mint(record.beneficiary, record.tokenAmount);

        emit SwiftOutboundRefunded(uetrHash, record.beneficiary, record.tokenAmount);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getRecord(string calldata uetr) external view returns (SwiftRecord memory) {
        bytes32 uetrHash = keccak256(abi.encodePacked(uetr));
        return swiftRecords[uetrHash];
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function proposeRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "VNKR: Zero address");
        pendingRelayer = newRelayer;
    }

    function acceptRelayer() external {
        require(msg.sender == pendingRelayer, "VNKR: Not pending relayer");
        emit OracleRelayerChanged(oracleRelayer, pendingRelayer);
        oracleRelayer  = pendingRelayer;
        pendingRelayer = address(0);
    }

    function setConversionRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "VNKR: Zero rate");
        emit ConversionRateUpdated(conversionRate, newRate);
        conversionRate = newRate;
    }

    function setBridgeFee(uint256 newBps) external onlyOwner {
        require(newBps <= 1000, "VNKR: Fee exceeds 10%");
        emit BridgeFeeUpdated(bridgeFeeBps, newBps);
        bridgeFeeBps = newBps;
    }
}
