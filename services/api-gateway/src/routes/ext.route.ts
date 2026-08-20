import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type {
  StartBotRequest,
  StakingSubscribeRequest,
} from "@vnkrvietnam/types";

export const extRouter = Router();

// ─── GET /api/v1/ext/bot-trading/configs — Auth required ─────────────────────
extRouter.get("/bot-trading/configs", authenticate, (req, res) => {
  // TODO: fetch from DB
  ok(res, [
    { botId: "BOT-001", type: "GRID", symbol: "BTC/USDT", status: "RUNNING", profit: "+$42.50", createdAt: new Date().toISOString() },
    { botId: "BOT-002", type: "DCA",  symbol: "ETH/USDT", status: "PAUSED",  profit: "+$12.20", createdAt: new Date().toISOString() },
  ]);
});

// ─── POST /api/v1/ext/bot-trading/start — Auth required ──────────────────────
extRouter.post("/bot-trading/start", authenticate, async (req, res) => {
  const body = req.body as StartBotRequest;
  if (!body.type || !body.symbol || !body.totalInvestment) {
    fail(res, "type, symbol, totalInvestment bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  const botId = `BOT-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "START_BOT", resource: "bots", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: body });
  created(res, { botId, status: "RUNNING", startedAt: new Date().toISOString() }, "Bot trading đã được kích hoạt");
});

// ─── GET /api/v1/ext/staking/pools — Public ───────────────────────────────────
extRouter.get("/staking/pools", (_req, res) => {
  ok(res, [
    { poolId: "SP-BTC-FLEX", asset: "BTC", type: "FLEXIBLE", apr: "4.5%",  minStake: "0.001",  totalStaked: "125.5 BTC", status: "ACTIVE" },
    { poolId: "SP-ETH-90D",  asset: "ETH", type: "FIXED",    apr: "8.2%",  minStake: "0.1",    lockPeriodDays: 90,       totalStaked: "842.3 ETH", status: "ACTIVE" },
    { poolId: "SP-USDT-30D", asset: "USDT",type: "FIXED",    apr: "12.5%", minStake: "100",    lockPeriodDays: 30,       totalStaked: "5000000 USDT", status: "FULL" },
  ]);
});

// ─── POST /api/v1/ext/staking/subscribe — Auth required ──────────────────────
extRouter.post("/staking/subscribe", authenticate, async (req, res) => {
  const body = req.body as StakingSubscribeRequest;
  if (!body.poolId || !body.amount || !body.pin) {
    fail(res, "poolId, amount, pin bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  if (body.pin.length !== 6) { fail(res, "PIN không hợp lệ", 401, "INVALID_PIN"); return; }
  const subscriptionId = `STAK-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "STAKING_SUBSCRIBE", resource: "staking", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { subscriptionId, poolId: body.poolId, amount: body.amount } });
  created(res, { subscriptionId, status: "ACTIVE", startedAt: new Date().toISOString() }, "Đăng ký staking thành công");
});

// ─── GET /api/v1/ext/ai-signals/latest — Auth required ───────────────────────
extRouter.get("/ai-signals/latest", authenticate, (_req, res) => {
  // TODO: fetch from AI signal service
  ok(res, [
    { signalId: "SIG-001", symbol: "BTC/USDT", direction: "LONG",  confidence: 82, entryPrice: "67000", targetPrice: "72000", stopLoss: "65000", timeframe: "4H", reasoning: "Breakout pattern + RSI divergence", createdAt: new Date().toISOString() },
    { signalId: "SIG-002", symbol: "ETH/USDT", direction: "SHORT", confidence: 65, entryPrice: "3450",  targetPrice: "3200",  stopLoss: "3550",  timeframe: "1H", reasoning: "Resistance rejection + bearish engulfing", createdAt: new Date().toISOString() },
  ]);
});
