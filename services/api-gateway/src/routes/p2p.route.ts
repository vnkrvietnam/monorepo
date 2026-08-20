import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";

export const p2pRouter = Router();

// All P2P routes require authentication
p2pRouter.use(authenticate);

// ─── GET /api/v1/p2p/offers ──────────────────────────────────────────────────
/**
 * Fetch the live P2P orderbook (buy + sell offers).
 * Query params: side (BUY|SELL), asset, minAmount, maxAmount, page, limit
 */
p2pRouter.get("/offers", (req, res) => {
  const page  = Number(req.query["page"])  || 1;
  const limit = Number(req.query["limit"]) || 20;
  const side  = req.query["side"] as string | undefined;
  const asset = req.query["asset"] as string | undefined;
  // TODO: query P2P orderbook from DB with filters
  paginated(res, [], 0, page, limit);
});

// ─── POST /api/v1/p2p/offers ─────────────────────────────────────────────────
/**
 * Create a new P2P offer (makeOffer).
 * Locks AXVN/VNKR into the Solana escrow PDA via on-chain instruction.
 */
p2pRouter.post("/offers", async (req, res) => {
  const { side, asset, amount, rate, minLimit, maxLimit, paymentMethod, pin } = req.body as {
    side:          "BUY" | "SELL";
    asset:         string;
    amount:        number;
    rate:          number;
    minLimit:      number;
    maxLimit:      number;
    paymentMethod: string;
    pin:           string;
  };
  if (!side || !asset || !amount || !rate || !minLimit || !maxLimit || !paymentMethod || !pin) {
    fail(res, "Thiếu thông tin tạo lệnh P2P", 400, "VALIDATION_ERROR");
    return;
  }
  if (!["BUY", "SELL"].includes(side)) {
    fail(res, "side phải là BUY hoặc SELL", 400, "VALIDATION_ERROR");
    return;
  }
  if (pin.length !== 6) { fail(res, "PIN không hợp lệ", 401, "INVALID_PIN"); return; }
  // TODO: verify PIN, check balance, call makeOffer() on Solana escrow
  const offerId = `OFFER-${Date.now().toString(36).toUpperCase()}`;
  await auditLog({
    userId: req.user!.sub, action: "P2P_MAKE_OFFER", resource: "p2p",
    ...buildAuditContext(req), timestamp: new Date().toISOString(),
    changes: { offerId, side, asset, amount },
  });
  created(res, {
    offerId,
    side,
    asset,
    amount,
    rate,
    minLimit,
    maxLimit,
    paymentMethod,
    status: "OPEN",
    onChainTx: null, // set once makeOffer() confirms
    createdAt: new Date().toISOString(),
  }, "Lệnh P2P đã được tạo");
});

// ─── POST /api/v1/p2p/offers/:id/take ────────────────────────────────────────
/**
 * Take an existing P2P offer (takeOffer).
 * Transitions the offer to MATCHED and triggers the fiat payment window.
 */
p2pRouter.post("/offers/:id/take", async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body as { pin: string };
  if (!pin) { fail(res, "PIN bắt buộc", 400, "VALIDATION_ERROR"); return; }
  if (pin.length !== 6) { fail(res, "PIN không hợp lệ", 401, "INVALID_PIN"); return; }
  // TODO: find offer, verify status = OPEN, call takeOffer() on Solana escrow
  await auditLog({
    userId: req.user!.sub, action: "P2P_TAKE_OFFER", resource: "p2p",
    ...buildAuditContext(req), timestamp: new Date().toISOString(),
    changes: { offerId: id },
  });
  ok(res, {
    offerId: id,
    status: "MATCHED",
    fiatDeadlineMinutes: 15,
    bankAccountInfo: null, // populated from offer maker's verified bank details
    matchedAt: new Date().toISOString(),
  }, "Đã nhận lệnh. Vui lòng chuyển khoản trong 15 phút.");
});

// ─── DELETE /api/v1/p2p/offers/:id ───────────────────────────────────────────
/**
 * Cancel a P2P offer (cancelOffer).
 * Only the offer creator can cancel; offer must be in OPEN state.
 * Returns AXVN/VNKR from the escrow PDA back to the maker's wallet.
 */
p2pRouter.delete("/offers/:id", async (req, res) => {
  const { id } = req.params;
  // TODO: find offer, verify ownership, verify status = OPEN, call cancelOffer()
  await auditLog({
    userId: req.user!.sub, action: "P2P_CANCEL_OFFER", resource: "p2p",
    ...buildAuditContext(req), timestamp: new Date().toISOString(),
    changes: { offerId: id },
  });
  ok(res, { offerId: id, status: "CANCELLED", cancelledAt: new Date().toISOString() }, "Lệnh P2P đã bị hủy");
});
