import { OnChainListener, type OutboundEventData } from "./listeners/onchain.js";
import { ChainExecutor } from "./executors/chain-executor.js";
import { SwiftExecutor } from "./executors/swift-executor.js";
import { VNKRBrokerFXOracle } from "./fx-oracle.js";
import type { SwiftInboundCreditPayload } from "./listeners/swift-webhook.js";


/**
 * SwiftChainBridgeRelayer — Core Oracle & Event Relayer Engine
 *
 * Kiến trúc Bi-Directional Bridge:
 *
 *  INBOUND  (Fiat SWIFT → On-Chain):
 *    swift-gateway xác nhận điện MT103/pacs.008
 *    → POST /internal/swift/inbound-credit
 *    → handleSwiftInbound() → ChainExecutor.settleInbound()
 *    → VNKRSwiftBridge.settleInboundSwift() → Mint AXVN
 *
 *  OUTBOUND (On-Chain → Fiat SWIFT):
 *    User calls VNKRSwiftBridge.requestOutboundSwift() → burn AXVN
 *    → SwiftOutboundRequested event
 *    → OnChainListener.startListening()
 *    → handleChainOutbound() → SwiftExecutor.sendMT103()
 *    → swift-gateway → MGW → SWIFT Net
 *    → ChainExecutor.confirmOutbound() on-chain
 *
 * Vendor reference: TODO/6-V2.md — Section 4 "Bi-Directional Relayer Engine"
 */
export class SwiftChainBridgeRelayer {
  private readonly onChain:   OnChainListener;
  private readonly chainExec: ChainExecutor;
  private readonly swiftExec: SwiftExecutor;
  private readonly fxOracle:  VNKRBrokerFXOracle;
  private stopListening?: () => void;

  constructor(
    onChainListener?: OnChainListener,
    chainExecutor?:   ChainExecutor,
    swiftExecutor?:   SwiftExecutor,
    fxOracle?:        VNKRBrokerFXOracle
  ) {
    this.onChain   = onChainListener  ?? new OnChainListener();
    this.chainExec = chainExecutor    ?? new ChainExecutor();
    this.swiftExec = swiftExecutor    ?? new SwiftExecutor();
    this.fxOracle  = fxOracle         ?? new VNKRBrokerFXOracle();
  }

  // ─── INBOUND: SWIFT Fiat → Mint Token On-Chain ───────────────────────────

  /**
   * Được gọi bởi /internal/swift/inbound-credit webhook.
   *
   * Luồng V2 (FX Oracle):
   *   1. Lấy tỷ giá thực từ SBV / Vietcombank
   *   2. Tính Gross VNKR, Gas Fee, Net VNKR (preview on-chain)
   *   3. Gọi VNKRSwiftBridgeV2.settleInboundSwiftWithFX() → Mint VNKR (1 VNKR = 1 VND)
   */
  async handleSwiftInbound(
    payload: SwiftInboundCreditPayload,
    logger: { info: (msg: string) => void; error: (msg: string, ...a: unknown[]) => void }
  ): Promise<{ txHash: string; blockNumber: number }> {
    const currency = payload.messageType === "pacs.008"
      ? (payload as any).currency ?? "USD"
      : "USD"; // MT103 default USD; có thể extend thêm field currency

    logger.info(
      `[relayer] INBOUND  uetr=${payload.uetr}  amount=${payload.amount} ${currency}  beneficiary=${payload.beneficiaryAddress}`
    );

    // 1. Lấy tỷ giá FX thực
    const fxResult = await this.fxOracle.getFullFXRate(currency);
    logger.info(
      `[relayer] FX Rate  ${currency}/VND = ${fxResult.rateToVnd}  source=${fxResult.source}`
    );

    // 2. Tính breakdown để log audit
    const breakdown = await this.fxOracle.computeConversion({
      originalAmount: payload.amount,
      currency,
    });
    logger.info(
      `[relayer] FX Breakdown  gross=${breakdown.grossVnkr.toLocaleString()} VNKR  fee=${breakdown.totalFeeVnkr.toLocaleString()} VNKR  net=${breakdown.netVnkr.toLocaleString()} VNKR`
    );

    try {
      // 3. Settle on-chain với FX Rate (V2 contract)
      const result = await this.chainExec.settleInboundWithFX(
        payload.uetr,
        currency,
        BigInt(Math.round(payload.amount)),        // originalAmount (full unit)
        BigInt(fxResult.rateToVnd),                 // fxRate integer
        payload.beneficiaryAddress,
        0n                                          // 0 → dùng defaultBaseGasFeeVnkr từ contract
      );

      logger.info(
        `[relayer] ✅ INBOUND settled (V2/FX)  txHash=${result.txHash}  block=${result.blockNumber}  netVNKR=${breakdown.netVnkr.toLocaleString()}`
      );
      return result;
    } catch (err) {
      logger.error("[relayer] ❌ INBOUND settle failed", err);
      throw err;
    }
  }

  // ─── OUTBOUND: On-Chain Event → SWIFT MT103 ─────────────────────────────

  /**
   * Bắt đầu lắng nghe SwiftOutboundRequested events từ VNKRSwiftBridge.sol.
   */
  startOutboundListener(
    logger: {
      info:  (msg: string) => void;
      error: (msg: string, ...a: unknown[]) => void;
      warn:  (msg: string) => void;
    }
  ): void {
    this.stopListening = this.onChain.startListening(
      async (event: OutboundEventData) => this.handleChainOutbound(event, logger),
      (err) => logger.error("[relayer] On-chain listener error", err),
      logger
    );
    logger.info("[relayer] 🔗 Outbound on-chain listener started");
  }

  /** Dừng listener (graceful shutdown). */
  stopOutboundListener(): void {
    this.stopListening?.();
  }

  /**
   * Xử lý một SwiftOutboundRequested event:
   *   1. Tính amount từ tokenAmountBurned (wei → USD)
   *   2. Gọi SwiftExecutor.sendMT103()
   *   3. Gọi ChainExecutor.confirmOutbound() (on-chain settlement)
   */
  private async handleChainOutbound(
    event: OutboundEventData,
    logger: { info: (msg: string) => void; error: (msg: string, ...a: unknown[]) => void }
  ): Promise<void> {
    logger.info(
      `[relayer] OUTBOUND  uetrHash=${event.uetrHash}  receiver=${event.receiverBic}  amount=${event.amount}`
    );

    // Chuyển đổi amount từ micro-USD (1e6) → USD float
    const amountUsd = Number(event.amount) / 1_000_000;

    // Tạo reference có ý nghĩa từ uetrHash
    const reference = `VNKR-BRIDGE-${event.uetrHash.slice(2, 12).toUpperCase()}`;

    let transmissionId: string | undefined;
    try {
      const swiftResult = await this.swiftExec.sendMT103({
        uetr:               event.uetrHash,
        receiverBic:        event.receiverBic,
        amountUsd,
        currency:           "USD",
        senderAddress:      event.sender,
        beneficiaryName:    "INSTITUTIONAL RECEIVER",
        beneficiaryAccount: "BANK-ACCT-OUT",
        remittanceInfo:     `ON-CHAIN BRIDGE REDEMPTION  REF:${reference}`,
      });

      transmissionId = swiftResult.transmissionId ?? swiftResult.messageId;
      logger.info(`[relayer] SWIFT dispatched  msgId=${swiftResult.messageId}  status=${swiftResult.status}`);
    } catch (err) {
      logger.error("[relayer] ❌ SWIFT send failed — will refund on-chain", err);
      try {
        await this.chainExec.refundOutbound(event.uetrHash);
        logger.info(`[relayer] ↩️  On-chain refund issued  uetrHash=${event.uetrHash}`);
      } catch (refundErr) {
        logger.error("[relayer] ❌ On-chain refund also failed", refundErr);
      }
      return;
    }

    // Confirm on-chain
    try {
      const { txHash } = await this.chainExec.confirmOutbound(event.uetrHash, transmissionId ?? reference);
      logger.info(`[relayer] ✅ OUTBOUND confirmed on-chain  txHash=${txHash}`);
    } catch (err) {
      logger.error("[relayer] ❌ On-chain confirm failed (SWIFT already sent)", err);
    }
  }

  // ─── Backfill helper ─────────────────────────────────────────────────────

  /**
   * Backfill: xử lý lại các events từ block fromBlock bị bỏ lỡ khi restart.
   */
  async backfillOutboundEvents(
    fromBlock: number,
    logger: { info: (msg: string) => void; error: (msg: string, ...a: unknown[]) => void }
  ): Promise<void> {
    const toBlock = await this.onChain.getLatestBlock();
    logger.info(`[relayer] Backfilling SwiftOutboundRequested events  blocks=${fromBlock}–${toBlock}`);

    const events = await this.onChain.fetchPastEvents(fromBlock, toBlock);
    logger.info(`[relayer] Found ${events.length} past events`);

    for (const event of events) {
      try {
        // Kiểm tra record on-chain — nếu PENDING thì xử lý lại
        const record = await this.chainExec.getRecord(event.uetrHash);
        if (record.status === 1 /* PENDING */) {
          await this.handleChainOutbound(event, logger);
        }
      } catch (err) {
        logger.error(`[relayer] Backfill failed for uetrHash=${event.uetrHash}`, err);
      }
    }
  }
}
