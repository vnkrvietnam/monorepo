import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type { ClaimCommissionRequest } from "@vnkrvietnam/types";

export const referralRouter = Router();

// All referral routes require authentication
referralRouter.use(authenticate);

// ─── GET /api/v1/referral/info ────────────────────────────────────────────────
referralRouter.get("/info", (req, res) => {
  const userId = req.user!.sub;
  // TODO: fetch from DB
  ok(res, {
    referralCode: userId.slice(0, 8).toUpperCase(),
    referralLink: `https://app.vnkr.vn/register?ref=${userId.slice(0, 8).toUpperCase()}`,
    tier: "SILVER",
    totalReferrals: 12,
    totalEarned: "2450000",
  });
});

// ─── GET /api/v1/referral/tree ────────────────────────────────────────────────
referralRouter.get("/tree", (req, res) => {
  // TODO: recursive query for up to 3 levels
  ok(res, {
    f1: [
      { userId: "u001", name: "Trần Thị B", level: 1, joinedAt: "2024-03-01T00:00:00Z", volume: "5000000", commission: "50000" },
      { userId: "u002", name: "Lê Minh C",  level: 1, joinedAt: "2024-04-15T00:00:00Z", volume: "2000000", commission: "20000" },
    ],
    f2: [],
    f3: [],
    totalTree: 2,
  });
});

// ─── GET /api/v1/referral/commissions ────────────────────────────────────────
referralRouter.get("/commissions", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  // TODO: fetch from DB
  paginated(res, [], 0, page, limit);
});

// ─── POST /api/v1/referral/claim ─────────────────────────────────────────────
referralRouter.post("/claim", async (req, res) => {
  const body = req.body as ClaimCommissionRequest;
  // TODO: check claimable balance, transfer to main wallet
  const claimId = `CLM-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "CLAIM_COMMISSION", resource: "referral", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { claimId, amount: body.amount ?? "all" } });
  created(res, { claimId, status: "PROCESSED", transferredAt: new Date().toISOString() }, "Hoa hồng đã được chuyển về ví chính");
});
