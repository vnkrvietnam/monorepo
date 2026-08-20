import type { Redis as RedisType } from "ioredis";

/**
 * VNKRSwiftClient — Producer SDK cho VNKR Event Bus
 *
 * Các service như `otc-liquidity-engine` và `fiat-connector-api` import
 * class này từ `@vnkrvietnam/swift-adapter` để đẩy yêu cầu chuyển tiền SWIFT
 * vào Redis Stream `vnkr:swift:outbound` mà không cần gọi HTTP trực tiếp
 * vào swift-gateway.
 *
 * Pattern: Event-Driven / Fire-and-Forget có ACK qua inbound stream.
 *
 * Vendor reference: TODO/6.md — Section 3 "Client Module"
 */
export class VNKRSwiftClient {
  private readonly redis: RedisType;
  private readonly outboundStream: string;

  constructor(
    redis: RedisType,
    options?: { outboundStream?: string }
  ) {
    this.redis = redis;
    this.outboundStream = options?.outboundStream ?? "vnkr:swift:outbound";
  }

  // ─── MT103 ─────────────────────────────────────────────────────────────────

  /**
   * Đẩy yêu cầu gửi MT103 (Chuyển tiền khách hàng) vào Event Bus.
   *
   * @returns streamId — Redis stream entry ID để tracking
   */
  async requestMT103(payload: {
    senderBIC: string;
    receiverBIC: string;
    reference: string;
    amount: number;
    currency: string;
    orderingAccount: string;
    orderingName: string;
    beneficiaryAccount: string;
    beneficiaryName: string;
    chargesCode?: "SHA" | "OUR" | "BEN";
    valueDate?: string;
  }, traceId?: string): Promise<{ success: true; streamId: string; reference: string }> {
    const streamId = await (this.redis as any).xadd(
      this.outboundStream,
      "*",
      "event",   "SWIFT_MT103_REQUESTED",
      "data",    JSON.stringify(payload),
      "traceId", traceId ?? `trace-${Date.now()}`
    ) as string;

    return { success: true, streamId, reference: payload.reference };
  }

  // ─── MT202 ─────────────────────────────────────────────────────────────────

  /**
   * Đẩy yêu cầu gửi MT202 (Cover Interbank Payment) vào Event Bus.
   */
  async requestMT202(payload: {
    senderBIC: string;
    receiverBIC: string;
    reference: string;
    relatedReference: string;
    amount: number;
    currency: string;
    valueDate?: string;
    accountWithInstitutionBIC: string;
    beneficiaryInstitutionBIC: string;
  }, traceId?: string): Promise<{ success: true; streamId: string; reference: string }> {
    const streamId = await (this.redis as any).xadd(
      this.outboundStream,
      "*",
      "event",   "SWIFT_MT202_REQUESTED",
      "data",    JSON.stringify(payload),
      "traceId", traceId ?? `trace-${Date.now()}`
    ) as string;

    return { success: true, streamId, reference: payload.reference };
  }

  // ─── pacs.008 ──────────────────────────────────────────────────────────────

  /**
   * Đẩy yêu cầu gửi pacs.008 (ISO 20022 FI Credit Transfer) vào Event Bus.
   */
  async requestPacs008(payload: {
    msgId: string;
    instrId: string;
    endToEndId: string;
    txId: string;
    intrBkSttlmAmt: number;
    currency: string;
    dbtrName: string;
    dbtrAcctIBAN: string;
    dbtrAgtBIC: string;
    cdtrAgtBIC: string;
    cdtrName: string;
    cdtrAcctIBAN: string;
    creDtTm?: string;
    intrBkSttlmDt?: string;
  }, traceId?: string): Promise<{ success: true; streamId: string; msgId: string }> {
    const streamId = await (this.redis as any).xadd(
      this.outboundStream,
      "*",
      "event",   "SWIFT_PACS008_REQUESTED",
      "data",    JSON.stringify(payload),
      "traceId", traceId ?? `trace-${Date.now()}`
    ) as string;

    return { success: true, streamId, msgId: payload.msgId };
  }

  // ─── Inbound subscription helper ────────────────────────────────────────────

  /**
   * Đăng ký nhận ACK/notification từ inbound stream.
   * Dùng trong integration tests hoặc service muốn track trạng thái.
   *
   * @param onEvent - callback nhận mỗi event
   * @param options.group - tên consumer group
   * @param options.consumer - tên consumer
   * @param options.stream - inbound stream name (default: vnkr:swift:inbound)
   */
  async subscribeInbound(
    onEvent: (type: string, payload: Record<string, unknown>) => Promise<void>,
    options?: { group?: string; consumer?: string; stream?: string }
  ): Promise<() => void> {
    const stream = options?.stream ?? "vnkr:swift:inbound";
    const group = options?.group ?? "swift-client-sub";
    const consumer = options?.consumer ?? `sub-${Date.now()}`;

    try {
      await (this.redis as any).xgroup("CREATE", stream, group, "0", "MKSTREAM");
    } catch { /* BUSYGROUP — OK */ }

    let active = true;

    const loop = async () => {
      while (active) {
        const res = await (this.redis as any).xreadgroup(
          "GROUP", group, consumer,
          "BLOCK", 2000, "COUNT", 5,
          "STREAMS", stream, ">"
        ) as Array<[string, Array<[string, string[]]>]> | null;

        if (!res) continue;

        for (const [, msgs] of res) {
          for (const [id, raw] of msgs) {
            const f: Record<string, string> = {};
            for (let i = 0; i < raw.length - 1; i += 2) {
              f[raw[i]!] = raw[i + 1]!;
            }
            try {
              await onEvent(f["type"] ?? "", JSON.parse(f["payload"] ?? "{}"));
            } finally {
              await (this.redis as any).xack(stream, group, id);
            }
          }
        }
      }
    };

    loop().catch(console.error);
    return () => { active = false; };
  }
}
