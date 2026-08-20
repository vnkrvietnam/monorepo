import Fastify from "fastify";
import { Redis } from "ioredis";
import {
  LAUSigner,
  buildMT103,
  buildMT202,
  buildPacs008,
  type SWIFTMT103Payload,
  type SWIFTMT202Payload,
  type Pacs008Payload,
  type MGWTransmissionResult,
} from "@vnkrvietnam/swift-adapter";
import { MGWClient } from "./mgw-client.js";
import { VNKRSwiftBridge, initInboundListener } from "./bridge.js";

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const PORT = Number(process.env["PORT"] ?? 4004);

const app = Fastify({ logger: true });

const lauKey = process.env["SWIFT_LAU_KEY"];
if (!lauKey) {
  console.error("FATAL: SWIFT_LAU_KEY env var is required");
  process.exit(1);
}

const signer = new LAUSigner(lauKey);
const mgw = new MGWClient();

// ─── Redis Event Bus ─────────────────────────────────────────────────────────

const redisUrl = process.env["REDIS_URL"] ?? "redis://localhost:6379";
const redis = new Redis(redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => app.log.warn({ err }, "[redis] Connection error"));
redis.on("connect", () => app.log.info("[redis] Connected to Redis Event Bus"));

const bridge = new VNKRSwiftBridge(redis, lauKey, mgw);

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/swift/send-mt103
 *
 * Accepts an MT103 payload, builds the FIN message, signs it with LAU,
 * and forwards it to the SWIFT Microgateway daemon.
 *
 * Called by:  services/otc-liquidity-engine  (Port 4002)
 */
app.post<{ Body: SWIFTMT103Payload }>(
  "/api/v1/swift/send-mt103",
  async (req, reply) => {
    const payload = req.body;
    app.log.info({ ref: payload.reference }, "[swift-gw] MT103 request received");

    const rawMT103 = buildMT103(payload);
    const { signature, timestamp } = signer.sign(rawMT103);

    let mgwResult: Awaited<ReturnType<MGWClient["forwardMessage"]>> | null = null;
    try {
      mgwResult = await mgw.forwardMessage({
        businessApplication: process.env["SWIFT_BIC_CODE"] ?? "VNKRVNVN",
        rawMessage: rawMT103,
        lauSignature: signature,
        lauTimestamp: timestamp,
        messageType: "MT103",
      });
    } catch (err) {
      // MGW daemon may be offline in non-prod; log and return QUEUED status
      app.log.warn({ err }, "[swift-gw] MGW forward failed — returning QUEUED");
    }

    const result: MGWTransmissionResult = {
      success: true,
      messageId: payload.reference,
      lauSignature: signature,
      status: mgwResult ? "TRANSMITTED_TO_SWIFT_MGW" : "QUEUED",
      rawMessage: rawMT103,
      timestamp,
    };

    app.log.info({ messageId: result.messageId, status: result.status }, "[swift-gw] MT103 done");
    return reply.send(result);
  }
);

/**
 * POST /api/v1/swift/send-mt202
 *
 * Interbank cover payment (MT202).
 */
app.post<{ Body: SWIFTMT202Payload }>(
  "/api/v1/swift/send-mt202",
  async (req, reply) => {
    const payload = req.body;
    const rawMT202 = buildMT202(payload);
    const { signature, timestamp } = signer.sign(rawMT202);

    let mgwResult: Awaited<ReturnType<MGWClient["forwardMessage"]>> | null = null;
    try {
      mgwResult = await mgw.forwardMessage({
        businessApplication: process.env["SWIFT_BIC_CODE"] ?? "VNKRVNVN",
        rawMessage: rawMT202,
        lauSignature: signature,
        lauTimestamp: timestamp,
        messageType: "MT202",
      });
    } catch {
      /* intentional — QUEUED fallback */
    }

    const result: MGWTransmissionResult = {
      success: true,
      messageId: payload.reference,
      lauSignature: signature,
      status: mgwResult ? "TRANSMITTED_TO_SWIFT_MGW" : "QUEUED",
      rawMessage: rawMT202,
      timestamp,
    };

    return reply.send(result);
  }
);

/**
 * POST /api/v1/swift/send-pacs008
 *
 * ISO 20022 FIToFI Customer Credit Transfer (pacs.008).
 */
app.post<{ Body: Pacs008Payload }>(
  "/api/v1/swift/send-pacs008",
  async (req, reply) => {
    const payload = req.body;
    const rawXML = buildPacs008(payload);
    const { signature, timestamp } = signer.sign(rawXML);

    let mgwResult: Awaited<ReturnType<MGWClient["forwardMessage"]>> | null = null;
    try {
      mgwResult = await mgw.forwardMessage({
        businessApplication: process.env["SWIFT_BIC_CODE"] ?? "VNKRVNVN",
        rawMessage: rawXML,
        lauSignature: signature,
        lauTimestamp: timestamp,
        messageType: "pacs.008",
      });
    } catch {
      /* intentional — QUEUED fallback */
    }

    const result: MGWTransmissionResult = {
      success: true,
      messageId: payload.msgId,
      lauSignature: signature,
      status: mgwResult ? "TRANSMITTED_TO_SWIFT_MGW" : "QUEUED",
      rawMessage: rawXML,
      timestamp,
    };

    return reply.send(result);
  }
);

/**
 * GET /health — liveness probe
 */
app.get("/health", async () => ({ status: "ok", service: "swift-gateway", port: PORT }));

/**
 * GET /api/v1/swift/mgw/health — proxy to the underlying MGW daemon health
 */
app.get("/api/v1/swift/mgw/health", async (_req, reply) => {
  try {
    const health = await mgw.health();
    return reply.send(health);
  } catch (err) {
    return reply.code(503).send({ status: "unavailable", detail: String(err) });
  }
});

/**
 * GET /api/v1/mgw/management/rma/check
 *
 * Proxy an RMA (Relationship Management Application) authorisation check
 * to the SWIFT Microgateway management API.
 */
app.get<{
  Querystring: { senderBic?: string; receiverBic?: string; service?: string };
}>("/api/v1/mgw/management/rma/check", async (req, reply) => {
  try {
    const result = await mgw.rmaCheck(req.query);
    return reply.send(result);
  } catch (err) {
    return reply.code(503).send({ error: "MGW unavailable", detail: String(err) });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

const start = async () => {
  try {
    // 1. Khởi động Fastify HTTP server
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`🚀 SWIFT Gateway Service running on http://0.0.0.0:${PORT}`);

    // 2. Kết nối Redis (lazyConnect=true → không block startup)
    await redis.connect();

    // 3. Khởi động VNKR SWIFT Bridge (vòng lặp Redis Stream consumer)
    //    Chạy trong background — lỗi không làm crash HTTP server
    bridge.start({
      info:  (msg, ...a) => app.log.info({ extra: a }, msg),
      warn:  (msg, ...a) => app.log.warn({ extra: a }, msg),
      error: (msg, ...a) => app.log.error({ extra: a }, msg),
    }).catch((err) => app.log.error({ err }, "[bridge] Unexpected error"));

    // 4. Khởi động inbound listener (optional — chỉ khi FIAT_CONNECTOR_URL được set)
    const fiatConnectorUrl = process.env["FIAT_CONNECTOR_URL"];
    if (fiatConnectorUrl) {
      initInboundListener(redis, fiatConnectorUrl, {
        info:  (msg, ...a) => app.log.info({ extra: a }, msg),
        error: (msg, ...a) => app.log.error({ extra: a }, msg),
      }).catch((err) => app.log.error({ err }, "[bridge:inbound] Unexpected error"));
    }

    // 5. Graceful shutdown
    const shutdown = async () => {
      app.log.info("[shutdown] Stopping SWIFT Bridge…");
      bridge.stop();
      await redis.quit();
      await app.close();
      process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT",  shutdown);

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
