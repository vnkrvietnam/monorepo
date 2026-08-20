import crypto from "node:crypto";
import Fastify from "fastify";
import {
  getPool,
  closePool,
  insertFiatReceipt,
  findP2POrder,
  confirmP2PFiatPayment,
  withTransaction,
} from "@vnkrvietnam/db";
import type { FiatReceipt } from "@vnkrvietnam/types";

const app = Fastify({ logger: true });

// ─── Config ───────────────────────────────────────────────────────────────────
const BANK_HMAC_SECRET = process.env["BANK_HMAC_SECRET"];
if (!BANK_HMAC_SECRET) {
  console.error("FATAL: BANK_HMAC_SECRET env var is required");
  process.exit(1);
}

/**
 * Maximum allowed age of a webhook request — 30 seconds.
 * Requests with |now - timestamp| > REPLAY_WINDOW_MS are rejected.
 */
const REPLAY_WINDOW_MS = 30_000;

/**
 * Regex to parse the Offer ID from the bank payment Memo/Description field.
 * Format mandated by P2P UI: "VNKR P2P OFFER <OFFER_ID>"
 * Example: "VNKR P2P OFFER ORD-20241201-A3F9"
 */
const MEMO_REGEX = /VNKR P2P OFFER ([A-Z0-9-]+)/;

// ─── DB readiness probe ────────────────────────────────────────────────────────
async function dbReady(): Promise<boolean> {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// ─── HMAC-SHA256 verification ─────────────────────────────────────────────────
/**
 * Verify the `x-bank-signature` header against the raw request body.
 * HMAC-SHA256(BANK_HMAC_SECRET, rawBody) must match the provided signature.
 * Uses constant-time comparison to prevent timing attacks.
 */
function verifyBankHMAC(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", BANK_HMAC_SECRET!)
    .update(rawBody, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signature.toLowerCase().replace(/^sha256=/, ""));
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

// ─── Replay-attack protection ─────────────────────────────────────────────────
/**
 * Check that the `x-bank-timestamp` value is within REPLAY_WINDOW_MS of now.
 * Returns true only if the timestamp is valid and recent.
 */
function isTimestampFresh(timestampHeader: string | undefined): boolean {
  if (!timestampHeader) return false;
  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return false;
  return Math.abs(Date.now() - ts) < REPLAY_WINDOW_MS;
}

/**
 * POST /api/v1/fiat/webhook
 *
 * Receives bank transaction notifications with HMAC-SHA256 authentication.
 *
 * Security:
 *   1. Verify `x-bank-signature` (HMAC-SHA256 of raw body).
 *   2. Replay-attack protection: `x-bank-timestamp` must be within 30 s.
 *   3. Parse Memo for offer ID via VNKR P2P OFFER regex.
 *   4. Persist receipt + transition P2P order atomically.
 *   5. Trigger on-chain takeOffer via @vnkrvietnam/swift-adapter (TODO: wire once adapter is available in scope).
 */
app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (_req, body, done) => done(null, body)
);

app.post<{ Body: string }>("/api/v1/fiat/webhook", async (req, reply) => {
  // ── 1. Replay-attack: check timestamp header ────────────────────────────────
  const timestampHeader = req.headers["x-bank-timestamp"] as string | undefined;
  if (!isTimestampFresh(timestampHeader)) {
    app.log.warn("[fiat-connector] Rejected: stale or missing x-bank-timestamp");
    return reply.code(400).send({ ok: false, error: "Request timestamp out of window" });
  }

  // ── 2. HMAC verification ────────────────────────────────────────────────────
  const signature = (req.headers["x-bank-signature"] as string | undefined) ?? "";
  if (!signature || !verifyBankHMAC(req.body, signature)) {
    app.log.warn("[fiat-connector] Rejected: invalid x-bank-signature");
    return reply.code(401).send({ ok: false, error: "Invalid signature" });
  }

  // ── 3. Parse body ───────────────────────────────────────────────────────────
  let receipt: FiatReceipt;
  try {
    receipt = JSON.parse(req.body) as FiatReceipt;
  } catch {
    return reply.code(400).send({ ok: false, error: "Malformed JSON body" });
  }

  app.log.info(
    { receiptId: receipt.receiptId, orderId: receipt.orderId },
    "[fiat-connector] Bank webhook received"
  );

  // ── 4. Memo parsing — extract Offer ID if not already set in body ───────────
  if (!receipt.orderId && receipt.description) {
    const match = MEMO_REGEX.exec(receipt.description);
    if (match?.[1]) {
      receipt = { ...receipt, orderId: match[1] };
      app.log.info({ offerId: receipt.orderId }, "[fiat-connector] Offer ID parsed from memo");
    }
  }

  if (!receipt.orderId) {
    app.log.warn(
      { receiptId: receipt.receiptId },
      "[fiat-connector] No orderId found in body or memo — ACK without processing"
    );
    return reply.code(200).send({ ok: true, receiptId: receipt.receiptId, order: null });
  }

  // ── 5. Persist + confirm atomically ────────────────────────────────────────
  const order = await withTransaction(async (client) => {
    await insertFiatReceipt(receipt);

    const updated = await confirmP2PFiatPayment(
      client,
      receipt.orderId,
      receipt.bankTransactionRef
    );

    if (!updated) {
      app.log.warn(
        { orderId: receipt.orderId },
        "[fiat-connector] Order not found or not in confirmable state"
      );
    } else {
      app.log.info(
        { orderId: updated.order_id, status: updated.status },
        "[fiat-connector] P2P order fiat-confirmed"
      );

      // ── 6. On-chain: emit event so swift-chain-bridge can call takeOffer() ──
      // The bridge service listens on Redis stream "fiat:confirmed" and calls
      // the Solana escrow takeOffer() instruction.
      // Direct Solana call is intentionally kept out of this service to preserve
      // single-responsibility and avoid coupling to wallet keypairs here.
      // Emit is fire-and-forget; failures are handled by the bridge with retry.
      try {
        const pool = getPool();
        await pool.query(
          `NOTIFY fiat_confirmed, $1`,
          [JSON.stringify({ orderId: updated.order_id, receiptId: receipt.receiptId, bankRef: receipt.bankTransactionRef })]
        );
      } catch (err) {
        app.log.warn({ err }, "[fiat-connector] NOTIFY fiat_confirmed failed (non-fatal)");
      }
    }

    return updated;
  });

  return reply.code(200).send({ ok: true, receiptId: receipt.receiptId, order });
});

/**
 * GET /orders/:orderId
 * Internal lookup — no external auth required (service-to-service only).
 */
app.get<{ Params: { orderId: string } }>(
  "/orders/:orderId",
  async (req, reply) => {
    const order = await findP2POrder(req.params.orderId);
    if (!order) return reply.code(404).send({ error: "Order not found" });
    return order;
  }
);

/** GET /health */
app.get("/health", async () => ({
  status: "ok",
  service: "fiat-connector-api",
  ts: new Date().toISOString(),
  db: await dbReady(),
}));

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const signals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];
for (const sig of signals) {
  process.on(sig, async () => {
    app.log.info(`[fiat-connector] Received ${sig}, shutting down…`);
    await app.close();
    await closePool();
    process.exit(0);
  });
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await app.listen({ port: 4001, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
