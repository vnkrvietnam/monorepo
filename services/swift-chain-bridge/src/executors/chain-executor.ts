import { ethers, type Wallet } from "ethers";
import { BRIDGE_ABI } from "../listeners/onchain.js";

// ABI bổ sung cho VNKRSwiftBridgeV2 (FX + Gas Fee)
export const BRIDGE_V2_ABI = [
  ...BRIDGE_ABI,
  "function settleInboundSwiftWithFX(string uetr, string originalCurrency, uint256 originalAmount, uint256 fxRate, address beneficiary, uint256 baseGasFeeVnkr) external",
  "function previewInboundConversion(uint256 originalAmount, uint256 fxRate, uint256 baseGasFeeVnkr) external view returns (uint256 grossVnkr, uint256 gasFee, uint256 netVnkr)",
  "function requestOutboundSwiftV2(string uetr, string receiverBic, string targetCurrency, uint256 vnkrAmountToBurn, uint256 estimatedFiatAmt) external",
  "event SwiftInboundConverted(bytes32 indexed uetrHash, address indexed beneficiary, string originalCurrency, uint256 originalAmount, uint256 fxRate, uint256 grossVnkrAmount, uint256 netVnkrAmount, uint256 gasFeeVnkr)",
];

/**
 * ChainExecutor — thực thi giao dịch on-chain trên VNKRSwiftBridge.sol / V2.
 *
 * Dùng trong luồng INBOUND:
 *   settleInbound()       → VNKRSwiftBridge.settleInboundSwift()     (V1, AXVN 1:1 USD)
 *   settleInboundWithFX() → VNKRSwiftBridgeV2.settleInboundSwiftWithFX() (V2, FX Rate)
 */
export class ChainExecutor {
  private readonly wallet: Wallet;
  private readonly contract: ethers.Contract;

  constructor(
    rpcUrl: string          = process.env["VNKR_EVM_RPC"]              ?? "http://localhost:8545",
    privateKey: string      = process.env["RELAYER_PRIVATE_KEY"]        ?? "",
    contractAddress: string = process.env["BRIDGE_CONTRACT_ADDRESS"]   ?? ethers.ZeroAddress,
    useV2Abi = true
  ) {
    if (!privateKey) throw new Error("RELAYER_PRIVATE_KEY is required");

    const provider    = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet       = new ethers.Wallet(privateKey, provider);
    this.contract     = new ethers.Contract(contractAddress, useV2Abi ? BRIDGE_V2_ABI : BRIDGE_ABI, this.wallet);
  }

  /**
   * Gọi settleInboundSwift() trên VNKRSwiftBridge.sol.
   * Dùng sau khi swift-gateway xác nhận nhận điện SWIFT inbound thành công.
   *
   * @param uetr              UUID v4 của điện SWIFT
   * @param senderBic         BIC ngân hàng gửi
   * @param beneficiary       Địa chỉ EVM ví nhận AXVN
   * @param amountUsdMicro    Số tiền USD * 1e6 (micro-dollar)
   * @returns tx hash
   */
  async settleInbound(
    uetr: string,
    senderBic: string,
    beneficiary: string,
    amountUsdMicro: bigint
  ): Promise<{ txHash: string; blockNumber: number }> {
    const tx = await this.contract["settleInboundSwift"](
      uetr,
      senderBic,
      beneficiary,
      amountUsdMicro
    );
    const receipt = await tx.wait(1); // chờ 1 confirmation
    return {
      txHash:      receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  }

  /**
   * Gọi confirmOutboundSwift() sau khi swift-gateway gửi điện thành công.
   */
  async confirmOutbound(
    uetr: string,
    transmissionId: string
  ): Promise<{ txHash: string }> {
    // transmissionId → bytes32 (padding phải)
    const txIdBytes = ethers.encodeBytes32String(transmissionId.slice(0, 31));
    const tx = await this.contract["confirmOutboundSwift"](uetr, txIdBytes);
    const receipt = await tx.wait(1);
    return { txHash: receipt.hash };
  }

  /**
   * Gọi refundOutboundSwift() khi điện SWIFT thất bại (timeout/reject).
   */
  async refundOutbound(uetr: string): Promise<{ txHash: string }> {
    const tx = await this.contract["refundOutboundSwift"](uetr);
    const receipt = await tx.wait(1);
    return { txHash: receipt.hash };
  }

  /** Kiểm tra trạng thái record on-chain (để idempotency check) */
  async getRecord(uetr: string): Promise<{ status: number; amount: bigint }> {
    const record = await this.contract["getRecord"](uetr);
    return { status: Number(record.status), amount: BigInt(record.amount) };
  }

  // ─── V2: FX Rate + Gas Fee ───────────────────────────────────────────────

  /**
   * Gọi settleInboundSwiftWithFX() trên VNKRSwiftBridgeV2.sol.
   * Mint VNKR (1 VNKR = 1 VND) sau khi quy đổi FX và trừ gas fee.
   *
   * @param uetr               UUID v4
   * @param originalCurrency   "USD", "EUR", "JPY", ...
   * @param originalAmount     Số tiền nguyên (full unit, không wei)
   * @param fxRate             Tỷ giá VND/foreign (ví dụ: 25450 cho USD)
   * @param beneficiary        EVM address nhận VNKR
   * @param baseGasFeeVnkr     Phí gas cơ bản (wei, 18 decimals). 0 → dùng default contract
   */
  async settleInboundWithFX(
    uetr: string,
    originalCurrency: string,
    originalAmount: bigint,
    fxRate: bigint,
    beneficiary: string,
    baseGasFeeVnkr: bigint = 0n
  ): Promise<{ txHash: string; blockNumber: number }> {
    const tx = await this.contract["settleInboundSwiftWithFX"](
      uetr,
      originalCurrency,
      originalAmount,
      fxRate,
      beneficiary,
      baseGasFeeVnkr
    );
    const receipt = await tx.wait(1);
    return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
  }

  /**
   * Preview: tính toán VNKR nhận được trước khi settle (view call — không tốn gas).
   */
  async previewConversion(
    originalAmount: bigint,
    fxRate: bigint,
    baseGasFeeVnkr: bigint = 0n
  ): Promise<{ grossVnkr: bigint; gasFee: bigint; netVnkr: bigint }> {
    const [grossVnkr, gasFee, netVnkr] = await this.contract["previewInboundConversion"](
      originalAmount,
      fxRate,
      baseGasFeeVnkr
    );
    return { grossVnkr: BigInt(grossVnkr), gasFee: BigInt(gasFee), netVnkr: BigInt(netVnkr) };
  }
}
