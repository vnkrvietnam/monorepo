import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type {
  PlaceOrderRequest,
  SwapQuoteRequest,
  SwapExecuteRequest,
} from "@vnkrvietnam/types";

export const exchangeRouter = Router();

// ─── GET /api/v1/exchange/markets — Public ────────────────────────────────────
exchangeRouter.get("/markets", (_req, res) => {
  // TODO: return live market data from matching engine / aggregator
  ok(res, [
    { symbol: "BTC/USDT", baseAsset: "BTC", quoteAsset: "USDT", lastPrice: "67420.00", volume24h: "12450.34", change24h: "+2.1%", high24h: "68000.00", low24h: "66800.00" },
    { symbol: "ETH/USDT", baseAsset: "ETH", quoteAsset: "USDT", lastPrice: "3420.00",  volume24h: "85200.12", change24h: "+1.4%", high24h: "3500.00",  low24h: "3380.00" },
    { symbol: "SOL/USDT", baseAsset: "SOL", quoteAsset: "USDT", lastPrice: "148.00",   volume24h: "9800.55",  change24h: "-0.8%", high24h: "152.00",   low24h: "146.00" },
  ]);
});

// ─── GET /api/v1/exchange/ticker — Public ─────────────────────────────────────
exchangeRouter.get("/ticker", (req, res) => {
  const { symbol } = req.query;
  if (!symbol) { fail(res, "symbol query param required", 400, "VALIDATION_ERROR"); return; }
  // TODO: fetch from Redis / in-memory cache
  ok(res, { symbol, price: "67420.00", change: "+1420.00", changePercent: "+2.1%", volume: "12450.34", timestamp: Date.now() });
});

// ─── GET /api/v1/exchange/orderbook — Public ──────────────────────────────────
exchangeRouter.get("/orderbook", (req, res) => {
  const { symbol } = req.query;
  if (!symbol) { fail(res, "symbol required", 400, "VALIDATION_ERROR"); return; }
  // TODO: fetch from matching engine
  ok(res, {
    symbol,
    bids: [{ price: "67400.00", amount: "0.5", total: "33700.00" }, { price: "67380.00", amount: "1.2", total: "80856.00" }],
    asks: [{ price: "67440.00", amount: "0.3", total: "20232.00" }, { price: "67460.00", amount: "0.8", total: "53968.00" }],
    timestamp: Date.now(),
  });
});

// ─── GET /api/v1/exchange/trades — Public ─────────────────────────────────────
exchangeRouter.get("/trades", (req, res) => {
  const { symbol, limit = "50" } = req.query;
  if (!symbol) { fail(res, "symbol required", 400, "VALIDATION_ERROR"); return; }
  // TODO: fetch recent trades from DB / cache
  ok(res, [], "Recent trades");
});

// ─── POST /api/v1/exchange/orders — Auth required ────────────────────────────
exchangeRouter.post("/orders", authenticate, async (req, res) => {
  const body = req.body as PlaceOrderRequest;
  if (!body.symbol || !body.side || !body.type || !body.amount) {
    fail(res, "Thiếu thông tin đặt lệnh", 400, "VALIDATION_ERROR");
    return;
  }
  if (body.type === "LIMIT" && !body.price) { fail(res, "Giá bắt buộc với lệnh LIMIT", 400, "VALIDATION_ERROR"); return; }
  if (body.type === "STOP_LIMIT" && (!body.price || !body.stopPrice)) {
    fail(res, "Cần price và stopPrice với STOP_LIMIT", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: validate balance, submit to matching engine
  const orderId = `ORD-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "PLACE_ORDER", resource: "orders", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: body });
  created(res, { orderId, status: "OPEN", ...body, createdAt: new Date().toISOString() }, "Đặt lệnh thành công");
});

// ─── DELETE /api/v1/exchange/orders/:id — Auth required ──────────────────────
exchangeRouter.delete("/orders/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  // TODO: cancel order in matching engine, verify ownership
  await auditLog({ userId: req.user!.sub, action: "CANCEL_ORDER", resource: "orders", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { orderId: id } });
  ok(res, { orderId: id, status: "CANCELLED" }, "Đã huỷ lệnh");
});

// ─── GET /api/v1/exchange/orders/open — Auth required ────────────────────────
exchangeRouter.get("/orders/open", authenticate, (req, res) => {
  // TODO: fetch user's open orders
  ok(res, { items: [], total: 0 });
});

// ─── POST /api/v1/exchange/swap/quote — Auth required ────────────────────────
exchangeRouter.post("/swap/quote", authenticate, (req, res) => {
  const body = req.body as SwapQuoteRequest;
  if (!body.fromToken || !body.toToken || !body.amount) {
    fail(res, "fromToken, toToken, amount required", 400, "VALIDATION_ERROR");
    return;
  }
  const quoteId = `QT-${Date.now()}`;
  // TODO: get live price from aggregator
  created(res, {
    quoteId,
    fromToken: body.fromToken,
    toToken: body.toToken,
    fromAmount: body.amount,
    toAmount: (Number(body.amount) * 0.9985).toFixed(6),
    rate: "0.9985",
    priceImpact: "0.15%",
    fee: "0.0015",
    expiresAt: Date.now() + 30_000,
  });
});

// ─── POST /api/v1/exchange/swap/execute — Auth required ──────────────────────
exchangeRouter.post("/swap/execute", authenticate, async (req, res) => {
  const body = req.body as SwapExecuteRequest;
  if (!body.quoteId || !body.pin) {
    fail(res, "quoteId và pin bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: verify PIN, verify quote not expired, execute swap
  const txId = `SW-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "EXECUTE_SWAP", resource: "swap", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { quoteId: body.quoteId } });
  ok(res, { txId, status: "SUCCESS", executedAt: new Date().toISOString() }, "Swap thực hiện thành công");
});
