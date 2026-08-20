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

// ─── DB readiness probe (called from /health) ─────────────────────────────────
async function dbReady(): Promise<boolean> {
  try {
    await getPool().query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /webhook/bank
 * Receives bank transaction notifications, persists the fiat receipt, and
 * transitions the linked P2P order to FIAT_CONFIRMED atomically.
 */
app.post<{ Body: FiatReceipt }>("/webhook/bank", async (req, reply) => {
  const receipt = req.body;
  app.log.info({ receiptId: receipt.receiptId, orderId: receipt.orderId },
    "[fiat-connector] Bank webhook received");

  // TODO: verify HMAC signature from bank before accepting

  // Persist receipt + confirm order in one transaction.
  const order = await withTransaction(async (client) => {
    await insertFiatReceipt(receipt);

    const updated = await confirmP2PFiatPayment(
      client,
      receipt.orderId,
      receipt.bankTransactionRef
    );

    if (!updated) {
      // Order not found or already in a terminal state — log but still ACK the bank.
      app.log.warn(
        { orderId: receipt.orderId },
        "[fiat-connector] Order not found or not in confirmable state"
      );
    } else {
      app.log.info(
        { orderId: updated.order_id, status: updated.status },
        "[fiat-connector] P2P order confirmed"
      );
    }

    // TODO: call take_offer on-chain (Solana escrow) once fiat is confirmed.

    return updated;
  });

  return reply.code(200).send({ ok: true, receiptId: receipt.receiptId, order });
});

/**
 * GET /orders/:orderId
 * Look up a P2P order by ID (for internal service calls).
 */
app.get<{ Params: { orderId: string } }>(
  "/orders/:orderId",
  async (req, reply) => {
    const order = await findP2POrder(req.params.orderId);
    if (!order) return reply.code(404).send({ error: "Order not found" });
    return order;
  }
);

/**
 * GET /health
 */
app.get("/health", async () => ({
  status: "ok",
  service: "fiat-connector-api",
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
