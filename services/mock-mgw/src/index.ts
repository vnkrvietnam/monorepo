import Fastify from "fastify";
import crypto from "node:crypto";

// ─── Mock SWIFT Microgateway Daemon ──────────────────────────────────────────
// Mô phỏng swift-mgw-2.0.17-1 để test local không cần PKI / Alliance Access.
// Chạy trên port 9003 — cùng port với swift-mgw-daemon thật.
// Chỉ dùng trong môi trường dev/staging, KHÔNG deploy production.

const PORT = Number(process.env["MOCK_MGW_PORT"] ?? 9003);
const MGW_APIKEY = process.env["SWIFT_MGW_APIKEY"] ?? "dev-mgw-apikey";

const app = Fastify({ logger: true });

// ─── Auth hook ────────────────────────────────────────────────────────────────

app.addHook("preHandler", async (req, reply) => {
  const openPaths = ["/health", "/info"];
  if (openPaths.includes(req.url)) return;

  const key = req.headers["x-api-key"] as string | undefined;
  if (!key || key !== MGW_APIKEY) {
    app.log.warn({ url: req.url }, "[mock-mgw] Unauthorized");
    return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing or invalid X-API-Key" });
  }
});

// ─── Monitoring API (/health /info /metrics) ──────────────────────────────────

app.get("/health", async () => ({
  status: "UP",
  service: "SWIFT MGW Mock Daemon",
  mode: "SANDBOX_MOCK",
  version: "2.0.17-1-mock",
}));

app.get("/info", async () => ({
  app: { name: "swift-mgw-mock", version: "2.0.17-1-mock" },
  environment: process.env["NODE_ENV"] ?? "development",
  build: { timestamp: "2026-08-19T00:00:00Z" },
}));

app.get<{ Params: { metricName: string } }>(
  "/metrics/:metricName",
  async (req) => ({
    metric: req.params.metricName,
    value: Math.floor(Math.random() * 100),
    unit: "count",
    timestamp: new Date().toISOString(),
  })
);

// ─── Management API (/sag/active /local-sign /oas-repository) ────────────────

app.get("/sag/active", async () => ({
  active: true,
  sag: "SAG-MOCK-01",
  environment: "SANDBOX",
  connectedAt: new Date(Date.now() - 3_600_000).toISOString(),
}));

app.put("/sag/active", async (req) => ({
  success: true,
  sag: (req.body as Record<string, unknown>)?.["sag"] ?? "SAG-MOCK-01",
  activatedAt: new Date().toISOString(),
}));

app.post<{ Body: { message: string } }>("/local-sign", async (req) => {
  const { message } = req.body;
  // Giả lập LAU signing của swift-security-sdk
  const hmac = crypto.createHmac("sha256", "mock-lau-key-for-testing-only");
  hmac.update(message ?? "");
  const signature = hmac.digest("hex").toUpperCase();
  return { signature, algorithm: "HMAC-SHA256-MOCK", timestamp: new Date().toISOString() };
});

app.get("/oas-repository", async () => ({
  apis: ["gpi-tracker", "preval", "gcase"],
  count: 3,
}));

// ─── Business Message Forwarding (/api/v1/messages) ─────────────────────────
// Đây là endpoint chính được gọi bởi services/swift-gateway

interface MessageForwardBody {
  businessApplication?: string;
  message: string;
  lau?: { signature: string; timestamp: string };
  messageType: string;
}

app.post<{ Body: MessageForwardBody }>("/api/v1/messages", async (req, reply) => {
  const { businessApplication, message, lau, messageType } = req.body;

  const transmissionId = `MOCK-TX-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const uetr = crypto.randomUUID();

  app.log.info(
    {
      messageType,
      businessApplication,
      lauSig: lau?.signature?.slice(0, 16) + "…",
      snippet: message?.slice(0, 120) + "…",
    },
    "[mock-mgw] ✅ Message received"
  );

  return reply.send({
    uetr,
    status: "ACKNOWLEDGED_BY_SWIFTNet",
    mgwRef: transmissionId,
    lauValidated: true,
    rmaCheckPassed: true,
    swiftNetAckCode: "ACK_000",
    timestamp: new Date().toISOString(),
  });
});

// ─── RMA Check (/api/v1/rma/check) ────────────────────────────────────────────

app.get<{ Querystring: { senderBic?: string; receiverBic?: string; service?: string } }>(
  "/api/v1/rma/check",
  async (req) => ({
    authorized: true,
    senderBic: req.query.senderBic ?? "UNKNOWN",
    receiverBic: req.query.receiverBic ?? "UNKNOWN",
    service: req.query.service ?? "swift.fin",
    validUntil: "2030-12-31T23:59:59Z",
    source: "MOCK_REGISTRY",
  })
);

// ─── Start ───────────────────────────────────────────────────────────────────

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   VNKR Mock SWIFT MGW Daemon running on port ${PORT}    ║
║   Replaces: swift-mgw-daemon (swift-mgw-2.0.17-1.jar) ║
║   Mode: SANDBOX_MOCK  — DEV/STAGING ONLY              ║
╚═══════════════════════════════════════════════════════╝`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
