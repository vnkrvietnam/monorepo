// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─── Interface ────────────────────────────────────────────────────────────────

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

// ─── VNKRSwiftBridgeV2 ────────────────────────────────────────────────────────
//
// Smart Contract nâng cấp từ VNKRSwiftBridge.sol với:
//   • FX Rate Oracle: quy đổi ngoại tệ (USD/EUR/JPY/SGD/GBP) → VNKR (1 VNKR = 1 VND)
//   • Gas Fee Controller: Base Gas Fee cố định + Bridge Fee % (bps)
//   • Treasury Vault: phí gas/bridge chuyển về VNKR Treasury thay vì fee recipient
//   • Multi-currency OUTBOUND: user burn VNKR → request amount theo ngoại tệ
//
// Công thức quy đổi:
//   grossVnkr    = originalAmount × fxRate
//   gasFee       = baseGasFeeVnkr + (grossVnkr × bridgeFeeBps / 10000)
//   netVnkrMint  = grossVnkr − gasFee
//
// Deployed on: VNKR Enterprise App-Chain EVM (Hyperledger Besu)

contract VNKRSwiftBridgeV2 {

    // ─── Storage ──────────────────────────────────────────────────────────────

    address public oracleRelayer;
    address public pendingRelayer;
    address public owner;
    address public treasuryVault;

    /// VNKR Token — 1 VNKR = 1 VND (18 decimals)
    IERC20Mintable public vnkrToken;

    /// Phí bridge mặc định: 10 bps = 0.1%
    uint256 public bridgeFeeBps = 10;

    /// Phí gas cơ bản mặc định: 10,000 VNKR (10,000 VND)
    /// Có thể ghi đè bởi Relayer khi gọi settleInboundSwiftWithFX
    uint256 public defaultBaseGasFeeVnkr = 10_000 * 1e18;

    // ─── Structs ──────────────────────────────────────────────────────────────

    enum TxStatus { NONE, PENDING, SETTLED, FAILED, REFUNDED }

    struct SwiftRecord {
        bytes32 uetrHash;
        /// Ký hiệu ngoại tệ gốc: "USD", "EUR", "JPY", "SGD", "VND", ...
        string  originalCurrency;
        /// Số tiền ngoại tệ gốc (đơn vị nguyên, e.g. USD cents hoặc full unit)
        uint256 originalAmount;
        /// Tỷ giá quy đổi sang VND, ví dụ: 25450 (1 USD = 25,450 VND)
        uint256 fxRate;
        /// Tổng VNKR trước khi trừ phí: originalAmount × fxRate
        uint256 grossVnkrAmount;
        /// Phí gas + bridge (VNKR) chuyển về Treasury
        uint256 gasFeeVnkr;
        /// VNKR thực nhận sau trừ phí
        uint256 netVnkrAmount;
        address beneficiary;
        TxStatus status;
        uint256  settledAt;
    }

    mapping(bytes32 => SwiftRecord) public swiftRecords;

    /// Tổng VNKR đã mint inbound (theo lịch sử)
    uint256 public totalVnkrMinted;
    /// Tổng phí VNKR đã thu về Treasury
    uint256 public totalFeeCollected;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// Phát ra khi inbound SWIFT được settle và VNKR được mint với FX conversion
    event SwiftInboundConverted(
        bytes32 indexed uetrHash,
        address indexed beneficiary,
        string  originalCurrency,
        uint256 originalAmount,
        uint256 fxRate,
        uint256 grossVnkrAmount,
        uint256 netVnkrAmount,
        uint256 gasFeeVnkr
    );

    /// Phát ra khi người dùng burn VNKR để yêu cầu outbound SWIFT (multi-currency)
    event SwiftOutboundRequestedV2(
        bytes32 indexed uetrHash,
        address indexed sender,
        string  receiverBic,
        string  targetCurrency,   // Tiền nhận: "USD", "EUR", ...
        uint256 vnkrAmountBurned, // VNKR đã burn
        uint256 estimatedFiatAmount // Ước tính fiat nhận
    );

    event BridgeFeeUpdated(uint256 oldBps, uint256 newBps);
    event DefaultGasFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryVaultUpdated(address oldVault, address newVault);
    event RelayerChanged(address indexed oldRelayer, address indexed newRelayer);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyRelayer() {
        require(msg.sender == oracleRelayer, "VNKR: Unauthorized Relayer");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "VNKR: Only Owner");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _vnkrToken,
        address _oracleRelayer,
        address _treasuryVault
    ) {
        require(_vnkrToken     != address(0), "VNKR: zero token");
        require(_oracleRelayer != address(0), "VNKR: zero relayer");
        require(_treasuryVault != address(0), "VNKR: zero treasury");

        vnkrToken      = IERC20Mintable(_vnkrToken);
        oracleRelayer  = _oracleRelayer;
        treasuryVault  = _treasuryVault;
        owner          = msg.sender;
    }

    // ─── INBOUND: SWIFT Fiat Ngoại Tệ → Mint VNKR (1 VNKR = 1 VND) ─────────

    /**
     * @notice Xử lý SWIFT Inbound ngoại tệ → Quy đổi FX → Trừ Gas Fee → Mint VNKR.
     *
     * Được gọi bởi Oracle Relayer (swift-chain-bridge) sau khi:
     *   1. swift-gateway xác nhận nhận điện MT103/pacs.008 inbound.
     *   2. FX Oracle lấy tỷ giá thực từ SBV / Vietcombank / Chainlink Feed.
     *
     * @param uetr              UUID v4 UETR của điện SWIFT
     * @param originalCurrency  Ký hiệu ngoại tệ gốc ("USD", "EUR", "JPY", ...)
     * @param originalAmount    Số tiền ngoại tệ (đơn vị: full unit, không chia decimals)
     * @param fxRate            Tỷ giá quy đổi sang VND (ví dụ: 25450 cho USD/VND)
     * @param beneficiary       Địa chỉ EVM ví nhận VNKR token
     * @param baseGasFeeVnkr    Phí gas cơ bản mạng lưới (đơn vị: VNKR wei = 1e18)
     *                          Nếu = 0 → dùng defaultBaseGasFeeVnkr
     */
    function settleInboundSwiftWithFX(
        string  calldata uetr,
        string  calldata originalCurrency,
        uint256          originalAmount,
        uint256          fxRate,
        address          beneficiary,
        uint256          baseGasFeeVnkr
    ) external onlyRelayer {
        require(beneficiary   != address(0), "VNKR: zero beneficiary");
        require(originalAmount > 0,          "VNKR: zero amount");
        require(fxRate         > 0,          "VNKR: zero fx rate");

        bytes32 uetrHash = keccak256(abi.encodePacked(uetr));
        require(swiftRecords[uetrHash].status == TxStatus.NONE, "VNKR: UETR already processed");

        // 1. Tính Gross VNKR = originalAmount × fxRate × 1e18
        //    (VNKR có 18 decimals, fxRate là integer, originalAmount là full unit ngoại tệ)
        uint256 grossVnkr = originalAmount * fxRate * 1e18;

        // 2. Tính phí Bridge (basis points) + Gas cơ bản
        uint256 effectiveGasBase = baseGasFeeVnkr == 0 ? defaultBaseGasFeeVnkr : baseGasFeeVnkr;
        uint256 percentFee       = (grossVnkr * bridgeFeeBps) / 10_000;
        uint256 totalFee         = effectiveGasBase + percentFee;

        require(grossVnkr > totalFee, "VNKR: Amount too small to cover gas fee");

        uint256 netVnkr = grossVnkr - totalFee;

        // 3. Ghi record
        swiftRecords[uetrHash] = SwiftRecord({
            uetrHash:         uetrHash,
            originalCurrency: originalCurrency,
            originalAmount:   originalAmount,
            fxRate:           fxRate,
            grossVnkrAmount:  grossVnkr,
            gasFeeVnkr:       totalFee,
            netVnkrAmount:    netVnkr,
            beneficiary:      beneficiary,
            status:           TxStatus.SETTLED,
            settledAt:        block.timestamp
        });

        totalVnkrMinted  += netVnkr;
        totalFeeCollected += totalFee;

        // 4. Mint VNKR: Net amount cho beneficiary, fee về Treasury Vault
        vnkrToken.mint(beneficiary, netVnkr);
        vnkrToken.mint(treasuryVault, totalFee);

        emit SwiftInboundConverted(
            uetrHash,
            beneficiary,
            originalCurrency,
            originalAmount,
            fxRate,
            grossVnkr,
            netVnkr,
            totalFee
        );
    }

    // ─── OUTBOUND V2: Burn VNKR → SWIFT Fiat Ngoại Tệ ───────────────────────

    /**
     * @notice Người dùng burn VNKR để yêu cầu chuyển tiền SWIFT bằng ngoại tệ.
     *         Relayer sẽ tính toán lại fxRate và bắn điện MT103.
     *
     * @param uetr              UETR do client tạo (UUID v4)
     * @param receiverBic       BIC ngân hàng nhận tiền
     * @param targetCurrency    Tiền tệ nhận: "USD", "EUR", "JPY", ...
     * @param vnkrAmountToBurn  Số VNKR muốn burn (đơn vị: wei = 1e18)
     * @param estimatedFiatAmt  Ước tính fiat nhận (Relayer sẽ confirm lại)
     */
    function requestOutboundSwiftV2(
        string  calldata uetr,
        string  calldata receiverBic,
        string  calldata targetCurrency,
        uint256          vnkrAmountToBurn,
        uint256          estimatedFiatAmt
    ) external {
        require(vnkrAmountToBurn > 0,         "VNKR: zero burn amount");
        require(bytes(receiverBic).length >= 8, "VNKR: invalid BIC");

        bytes32 uetrHash = keccak256(abi.encodePacked(uetr));
        require(swiftRecords[uetrHash].status == TxStatus.NONE, "VNKR: duplicate UETR");

        // Burn VNKR từ msg.sender (yêu cầu approve trước)
        vnkrToken.burnFrom(msg.sender, vnkrAmountToBurn);

        swiftRecords[uetrHash] = SwiftRecord({
            uetrHash:         uetrHash,
            originalCurrency: targetCurrency,
            originalAmount:   estimatedFiatAmt,
            fxRate:           0,        // Relayer sẽ fill sau khi confirm FX
            grossVnkrAmount:  vnkrAmountToBurn,
            gasFeeVnkr:       0,
            netVnkrAmount:    vnkrAmountToBurn,
            beneficiary:      msg.sender,
            status:           TxStatus.PENDING,
            settledAt:        0
        });

        emit SwiftOutboundRequestedV2(
            uetrHash,
            msg.sender,
            receiverBic,
            targetCurrency,
            vnkrAmountToBurn,
            estimatedFiatAmt
        );
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /// Tính toán VNKR net trước khi settle (preview)
    function previewInboundConversion(
        uint256 originalAmount,
        uint256 fxRate,
        uint256 baseGasFeeVnkr
    ) external view returns (
        uint256 grossVnkr,
        uint256 gasFee,
        uint256 netVnkr
    ) {
        uint256 effectiveBase = baseGasFeeVnkr == 0 ? defaultBaseGasFeeVnkr : baseGasFeeVnkr;
        grossVnkr = originalAmount * fxRate * 1e18;
        gasFee    = effectiveBase + (grossVnkr * bridgeFeeBps) / 10_000;
        netVnkr   = grossVnkr > gasFee ? grossVnkr - gasFee : 0;
    }

    function getRecord(string calldata uetr) external view returns (SwiftRecord memory) {
        return swiftRecords[keccak256(abi.encodePacked(uetr))];
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setBridgeFee(uint256 newBps) external onlyOwner {
        require(newBps <= 500, "VNKR: max 5%");
        emit BridgeFeeUpdated(bridgeFeeBps, newBps);
        bridgeFeeBps = newBps;
    }

    function setDefaultGasFee(uint256 newFee) external onlyOwner {
        emit DefaultGasFeeUpdated(defaultBaseGasFeeVnkr, newFee);
        defaultBaseGasFeeVnkr = newFee;
    }

    function setTreasuryVault(address newVault) external onlyOwner {
        require(newVault != address(0), "VNKR: zero address");
        emit TreasuryVaultUpdated(treasuryVault, newVault);
        treasuryVault = newVault;
    }

    function proposeRelayer(address newRelayer) external onlyOwner {
        require(newRelayer != address(0), "VNKR: zero address");
        pendingRelayer = newRelayer;
    }

    function acceptRelayer() external {
        require(msg.sender == pendingRelayer, "VNKR: not pending relayer");
        emit RelayerChanged(oracleRelayer, pendingRelayer);
        oracleRelayer  = pendingRelayer;
        pendingRelayer = address(0);
    }
}
