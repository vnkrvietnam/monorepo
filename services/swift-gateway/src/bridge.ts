import type { Redis } from "ioredis";
import {
  LAUSigner,
  buildMT103,
  buildMT202,
  buildPacs008,
  type SWIFTMT103Payload,
  type SWIFTMT202Payload,
  type Pacs008Payload,
} from "@vnkrvietnam/swift-adapter";
import { MGWClient } from "./mgw-client.js";

// ─── Stream / Group constants ─────────────────────────────────────────────────

/** Tên stream: VNKR Network → SWIFT (outbound) */
export const OUTBOUND_STREAM = "vnkr:swift:outbound";

/** Tên stream: SWIFT → VNKR Network (inbound ACK / credit notification) */
export const INBOUND_STREAM = "vnkr:swift:inbound";

/** Consumer group cho swift-gateway */
export const CONSUMER_GROUP = "swift-gateway-group";

/** Consumer name (1 instance; scale bằng cách tăng số suffix) */
export const CONSUMER_NAME = `swift-worker-${process.env["HOSTNAME"] ?? "1"}`;

// ─── Event types ──────────────────────────────────────────────────────────────

type OutboundEventType = "SWIFT_MT103_REQUESTED" | "SWIFT_MT202_REQUESTED" | "SWIFT_PACS008_REQUESTED";

interface OutboundStreamEvent {
  event: OutboundEventType;
  /** JSON-serialised payload */
  data: string;
  /** Trace ID từ service gốc */
  traceId?: string;
}

/**
 * VNKRSwiftBridge — Redis Streams Event Bus Connector
 *
 * Kiến trúc luồng dữ liệu:
 *   otc-liquidity-engine / fiat-connector-api
 *     → XADD vnkr:swift:outbound
 *     → [bridge.ts XREADGROUP] → buildMT103/MT202/pacs008 → MGWClient
 *     → XADD vnkr:swift:inbound (ACK / status)
 *     → fiat-connector-api / P2P Escrow
 *
 * Vendor reference: TODO/6.md — "SWIFT ↔ VNKR Event Bus"
 */
export class VNKRSwiftBridge {
  private readonly signer: LAUSigner;
  private readonly mgw: MGWClient;
  private running = false;

  constructor(
    private readonly redis: Redis,
    lauKey: string,
    mgwClient?: MGWClient
  ) {
    this.signer = new LAUSigner(lauKey);
    this.mgw = mgwClient ?? new MGWClient();
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Khởi động bridge: tạo consumer group (idempotent) rồi vào vòng lặp polling.
   */
  async start(logger?: { info: (msg: string, ...a: unknown[]) => void; warn: (msg: string, ...a: unknown[]) => void; error: (msg: string, ...a: unknown[]) => void }): Promise<void> {
    const log = logger ?? console;

    // Tạo consumer group — bỏ qua lỗi BUSYGROUP (đã tồn tại)
    try {
      await (this.redis as any).xgroup("CREATE", OUTBOUND_STREAM, CONSUMER_GROUP, "0", "MKSTREAM");
      log.info(`[bridge] Consumer group '${CONSUMER_GROUP}' created on '${OUTBOUND_STREAM}'`);
    } catch (err: unknown) {
      if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) throw err;
      log.info(`[bridge] Consumer group '${CONSUMER_GROUP}' already exists — OK`);
    }

    this.running = true;
    log.info(`[bridge] 🔗 VNKR SWIFT Bridge started. Consumer: ${CONSUMER_NAME}`);

    // Vòng lặp polling Redis Stream (blocking read, timeout 2 giây)
    while (this.running) {
      try {
        const response = await (this.redis as any).xreadgroup(
          "GROUP", CONSUMER_GROUP, CONSUMER_NAME,
          "BLOCK", 2000,
          "COUNT", 10,
          "STREAMS", OUTBOUND_STREAM, ">"
        ) as Array<[string, Array<[string, string[]]>]> | null;

        if (!response) continue;

        for (const [, messages] of response) {
          for (const [msgId, rawFields] of messages) {
            // Redis trả field/value theo kiểu flat array: [k1, v1, k2, v2, ...]
            const fields = rawFieldsToObject(rawFields);
            try {
              await this.processOutbound(msgId, fields as unknown as OutboundStreamEvent, log);
              // ACK sau khi xử lý thành công
              await (this.redis as any).xack(OUTBOUND_STREAM, CONSUMER_GROUP, msgId);
            } catch (procErr) {
              log.error(`[bridge] Failed to process message ${msgId}`, procErr);
              // Không ACK → message sẽ ở trạng thái PEL, có thể XCLAIM sau
            }
          }
        }
      } catch (err) {
        if (this.running) {
          log.error("[bridge] Stream read error", err);
          // Back-off ngắn để tránh busy-loop khi Redis ngắt kết nối
          await sleep(1000);
        }
      }
    }
  }

  /** Dừng vòng lặp polling (graceful shutdown). */
  stop(): void {
    this.running = false;
  }

  // ─── Outbound processor ─────────────────────────────────────────────────────

  private async processOutbound(
    msgId: string,
    fields: OutboundStreamEvent,
    log: { info: (msg: string, ...a: unknown[]) => void; error: (msg: string, ...a: unknown[]) => void }
  ): Promise<void> {
    const { event, data, traceId } = fields;
    const payload = JSON.parse(data ?? "{}");

    log.info(`[bridge] ⚡ Processing event=${event} traceId=${traceId ?? "-"} msgId=${msgId}`);

    let rawMessage: string;
    let messageType: "MT103" | "MT202" | "pacs.008";
    let messageId: string;

    switch (event) {
      case "SWIFT_MT103_REQUESTED": {
        const p = payload as SWIFTMT103Payload;
        rawMessage = buildMT103(p);
        messageType = "MT103";
        messageId = p.reference;
        break;
      }
      case "SWIFT_MT202_REQUESTED": {
        const p = payload as SWIFTMT202Payload;
        rawMessage = buildMT202(p);
        messageType = "MT202";
        messageId = p.reference;
        break;
      }
      case "SWIFT_PACS008_REQUESTED": {
        const p = payload as Pacs008Payload;
        rawMessage = buildPacs008(p);
        messageType = "pacs.008";
        messageId = p.msgId;
        break;
      }
      default:
        log.error(`[bridge] Unknown event type: ${event as string}`);
        return;
    }

    // Ký LAU
    const { signature: lauSignature, timestamp } = this.signer.sign(rawMessage);

    // Đẩy sang MGW
    let mgwStatus = "QUEUED";
    let uetr: string | undefined;
    try {
      const mgwResult = await this.mgw.forwardMessage({
        businessApplication: process.env["SWIFT_BIC_CODE"] ?? "VNKRVNVN",
        rawMessage,
        lauSignature,
        lauTimestamp: timestamp,
        messageType,
      });
      mgwStatus = mgwResult.status ?? "TRANSMITTED_TO_SWIFT_MGW";
      uetr = mgwResult.uetr;
    } catch {
      // MGW offline → status QUEUED, message vẫn được ACK và publish inbound event
    }

    // Publish ACK vào inbound stream để fiat-connector / OTC engine xử lý
    await (this.redis as any).xadd(
      INBOUND_STREAM,
      "*",
      "type", "SWIFT_SENT_ACK",
      "payload", JSON.stringify({
        reference: messageId,
        messageType,
        uetr: uetr ?? null,
        status: mgwStatus,
        lauSignature,
        traceId: traceId ?? null,
        timestamp,
      })
    );

    log.info(`[bridge] ✅ ${event} → ${mgwStatus}  ref=${messageId}`);
  }
}

// ─── Inbound listener ─────────────────────────────────────────────────────────

/**
 * initInboundListener — lắng nghe stream vnkr:swift:inbound để forward
 * credit notification đến fiat-connector-api qua HTTP.
 *
 * Được gọi khi có điện incoming từ SWIFT vào hệ thống VNKR
 * (ví dụ: đối tác gửi MT103 → SWIFT giao điện cho Alliance Access
 *  → MGW → swift-gateway → bắn event inbound).
 */
export async function initInboundListener(
  redis: Redis,
  fiatConnectorUrl: string,
  logger: { info: (msg: string, ...a: unknown[]) => void; error: (msg: string, ...a: unknown[]) => void }
): Promise<void> {
  const group = "fiat-inbound-group";
  const consumer = `fiat-inbound-worker-${process.env["HOSTNAME"] ?? "1"}`;

  try {
    await (redis as any).xgroup("CREATE", INBOUND_STREAM, group, "0", "MKSTREAM");
  } catch (err: unknown) {
    if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) throw err;
  }

  logger.info(`[bridge:inbound] Listening on '${INBOUND_STREAM}'`);

  while (true) {
    try {
      const response = await (redis as any).xreadgroup(
        "GROUP", group, consumer,
        "BLOCK", 2000,
        "COUNT", 5,
        "STREAMS", INBOUND_STREAM, ">"
      ) as Array<[string, Array<[string, string[]]>]> | null;

      if (!response) continue;

      for (const [, messages] of response) {
        for (const [msgId, rawFields] of messages) {
          const fields = rawFieldsToObject(rawFields) as { type: string; payload: string };
          if (fields.type === "SWIFT_CREDIT_NOTIF") {
            const data = JSON.parse(fields.payload ?? "{}");
            try {
              // Gọi fiat-connector-api để cộng số dư fiat
              const { default: axios } = await import("axios");
              await axios.post(`${fiatConnectorUrl}/internal/swift-credit`, data, { timeout: 5000 });
              logger.info(`[bridge:inbound] SWIFT_CREDIT_NOTIF forwarded → fiat-connector  ref=${data.reference}`);
            } catch (err) {
              logger.error("[bridge:inbound] Failed to forward credit notification", err);
            }
          }
          await (redis as any).xack(INBOUND_STREAM, group, msgId);
        }
      }
    } catch (err) {
      logger.error("[bridge:inbound] Stream read error", err);
      await sleep(1000);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Chuyển flat array [k, v, k, v, ...] → object */
function rawFieldsToObject(fields: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < fields.length - 1; i += 2) {
    obj[fields[i]!] = fields[i + 1]!;
  }
  return obj;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
