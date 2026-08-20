import { Router } from "express";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ok, fail } from "../../lib/response.js";
import { auditLog, buildAuditContext } from "../../lib/audit.js";

export const systemAdminRouter = Router();

systemAdminRouter.use(authenticate, requireAdmin);

// ─── GET /api/v1/admin/system/metrics ────────────────────────────────────────
systemAdminRouter.get("/metrics", (_req, res) => {
  // TODO: aggregate from DB/Redis
  ok(res, {
    dailyVolume:         "2500000000",
    dailyTransactions:   4820,
    totalUsers:          125000,
    activeUsers24h:      8400,
    pendingKYC:          124,
    pendingWithdrawals:  18,
    revenue24h:          "12500000",
    serverUptime:        "99.98%",
    redisLatencyMs:      1.2,
    dbConnectionsActive: 8,
  });
});

// ─── PUT /api/v1/admin/system/exchange-rates ─────────────────────────────────
systemAdminRouter.put("/exchange-rates", async (req, res) => {
  const rates = req.body as Record<string, number>;
  // TODO: validate and persist rates to Redis/DB
  await auditLog({ userId: req.user!.sub, action: "UPDATE_EXCHANGE_RATES", resource: "system/rates", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: rates });
  ok(res, { updatedRates: rates, updatedAt: new Date().toISOString() }, "Tỷ giá đã được cập nhật");
});

// ─── PUT /api/v1/admin/system/maintenance ────────────────────────────────────
systemAdminRouter.put("/maintenance", async (req, res) => {
  const { enabled, message } = req.body as { enabled: boolean; message?: string };
  if (typeof enabled !== "boolean") { fail(res, "enabled (boolean) bắt buộc", 400, "VALIDATION_ERROR"); return; }
  // TODO: set maintenance flag in Redis
  await auditLog({ userId: req.user!.sub, action: enabled ? "MAINTENANCE_ON" : "MAINTENANCE_OFF", resource: "system/maintenance", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, { maintenance: enabled, message, updatedAt: new Date().toISOString() }, "Maintenance mode đã được cập nhật");
});

// ─── GET /api/v1/admin/system/feature-flags ──────────────────────────────────
systemAdminRouter.get("/feature-flags", (_req, res) => {
  // TODO: fetch from Redis
  ok(res, { swap: true, staking: true, botTrading: true, referral: true, learn: true, p2p: true, swift: true });
});

// ─── PUT /api/v1/admin/system/feature-flags ──────────────────────────────────
systemAdminRouter.put("/feature-flags", async (req, res) => {
  const flags = req.body as Record<string, boolean>;
  await auditLog({ userId: req.user!.sub, action: "UPDATE_FEATURE_FLAGS", resource: "system/features", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: flags });
  ok(res, flags, "Feature flags đã được cập nhật");
});
