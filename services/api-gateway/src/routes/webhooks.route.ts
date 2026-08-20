import { Router } from "express";
import crypto from "crypto";
import { ok, fail } from "../lib/response.js";
import type { CryptoDepositWebhook, VietQRWebhook, P2PEscrowWebhook } from "@vnkrvietnam/types";

export const webhookRouter = Router();

const WEBHOOK_SECRET = process.env.COMPLIANCE_SECRET_KEY ?? "webhook_secret_placeholder";

/** Verify HMAC-SHA256 signature from request header */
function verifyHMAC(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─── POST /api/v1/webhooks/crypto/deposit ─────────────────────────────────────
webhookRouter.post("/crypto/deposit", async (req, res) => {
  const sig = req.headers["x-tatum-signature"] as string ?? "";
  const raw = JSON.stringify(req.body);
  if (sig && !verifyHMAC(raw, sig)) {
    fail(res, "Invalid webhook signature", 401, "WEBHOOK_AUTH_FAILED");
    return;
  }
  const event = req.body as CryptoDepositWebhook;
  if (!event.txHash || !event.toAddress || !event.asset || !event.amount) {
    fail(res, "Invalid payload", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: find user by toAddress, credit balance if confirmations >= threshold
  // TODO: enqueue to deposit-worker BullMQ queue
  console.log("[webhook/crypto/deposit]", event);
  ok(res, { received: true, txHash: event.txHash });
});

// ─── POST /api/v1/webhooks/fiat/vietqr ───────────────────────────────────────
webhookRouter.post("/fiat/vietqr", async (req, res) => {
  const sig = req.headers["x-hmac-signature"] as string ?? "";
  const raw = JSON.stringify(req.body);
  if (sig && !verifyHMAC(raw, sig)) {
    fail(res, "Invalid HMAC signature", 401, "WEBHOOK_AUTH_FAILED");
    return;
  }
  const event = req.body as VietQRWebhook;
  if (!event.transactionId || !event.amount || !event.description) {
    fail(res, "Invalid VietQR payload", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: parse description for orderId, credit user VND balance
  // TODO: enqueue to deposit-worker
  console.log("[webhook/fiat/vietqr]", event);
  ok(res, { received: true, transactionId: event.transactionId });
});

// ─── POST /api/v1/webhooks/p2p/escrow ────────────────────────────────────────
webhookRouter.post("/p2p/escrow", async (req, res) => {
  const event = req.body as P2PEscrowWebhook;
  if (!event.orderId || !event.event || !event.txHash) {
    fail(res, "Invalid escrow webhook payload", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: update P2P order status in DB
  console.log("[webhook/p2p/escrow]", event);
  ok(res, { received: true, orderId: event.orderId, event: event.event });
});
