import Fastify from "fastify";
import { SwiftChainBridgeRelayer } from "./relayer.js";
import { registerSwiftWebhookRoutes } from "./listeners/swift-webhook.js";

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const PORT   = Number(process.env["PORT"]                  ?? 4005);
const SECRET = process.env["VNKR_INTERNAL_WEBHOOK_SECRET"] ?? "dev-webhook-secret";

const app = Fastify({ logger: true });

// Kiểm tra biến bắt buộc
const requiredEnvs = ["RELAYER_PRIVATE_KEY", "BRIDGE_CONTRACT_ADDRESS", "VNKR_EVM_RPC"];
for (const key of requiredEnvs) {
  if (!process.env[key]) {
    console.error(`FATAL: env var ${key} is required`);
    process.exit(1);
  }
}

const relayer = new SwiftChainBridgeRelayer();

const log = {
  info:  (msg: string, ...a: unknown[]) => app.log.info({ extra: a }, msg),
  warn:  (msg: string, ...a: unknown[]) => app.log.warn({ extra: a }, msg),
  error: (msg: string, ...a: unknown[]) => app.log.error({ extra: a }, msg),
};

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health check
app.get("/health", async () => ({
  status: "ok",
  service: "swift-chain-bridge",
  port: PORT,
  evm: process.env["VNKR_EVM_RPC"],
  bridge: process.env["BRIDGE_CONTRACT_ADDRESS"],
}));

// Đăng ký webhook routes (inbound-credit, outbound-ack)
registerSwiftWebhookRoutes(
  app,
  async (payload) => {
    await relayer.handleSwiftInbound(payload, log);
  },
  SECRET
);

/**
 * POST /admin/backfill
 * Backfill events on-chain bị bỏ lỡ từ block cụ thể.
 * Chỉ dùng admin nội bộ.
 */
app.post<{ Body: { fromBlock: number } }>(
  "/admin/backfill",
  async (req, reply) => {
    const secret = req.headers["x-vnkr-webhook-secret"] as string | undefined;
    if (!secret || secret !== SECRET) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const { fromBlock = 0 } = req.body ?? {};
    app.log.info({ fromBlock }, "[admin] Starting backfill");
    relayer.backfillOutboundEvents(fromBlock, log).catch((err) =>
      app.log.error({ err }, "[admin] Backfill error")
    );
    return reply.send({ ok: true, fromBlock });
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    app.log.info(`🚀 SWIFT Chain Bridge Relayer running on http://0.0.0.0:${PORT}`);

    // Bắt đầu lắng nghe on-chain outbound events
    relayer.startOutboundListener(log);

    // Graceful shutdown
    const shutdown = async () => {
      app.log.info("[shutdown] Stopping relayer…");
      relayer.stopOutboundListener();
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
