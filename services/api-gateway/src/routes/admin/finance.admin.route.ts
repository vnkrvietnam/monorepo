import { Router } from "express";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../../lib/response.js";
import { auditLog, buildAuditContext } from "../../lib/audit.js";
import type { ApproveWithdrawalRequest } from "@vnkrvietnam/types";

export const financeAdminRouter = Router();

financeAdminRouter.use(authenticate, requireAdmin);

// ─── GET /api/v1/admin/finance/withdrawals ────────────────────────────────────
financeAdminRouter.get("/withdrawals", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  // TODO: fetch high-value pending withdrawals from DB (above auto-approve threshold)
  paginated(res, [
    { withdrawId: "WC-001", userId: "u001", userName: "Nguyễn Văn A", asset: "BTC", amount: "1.5",       network: "ERC20", createdAt: "2024-06-27T10:00:00Z", riskScore: 15 },
    { withdrawId: "WF-002", userId: "u003", userName: "Lê Minh C",    asset: "VND", amount: "200000000", bankCode: "VCB",  createdAt: "2024-06-27T11:30:00Z", riskScore: 55 },
  ], 2, page, limit);
});

// ─── POST /api/v1/admin/finance/withdrawals/approve ───────────────────────────
financeAdminRouter.post("/withdrawals/approve", async (req, res) => {
  const body = req.body as ApproveWithdrawalRequest;
  if (!body.withdrawId || !body.action || !["APPROVE", "REJECT"].includes(body.action)) {
    fail(res, "withdrawId và action (APPROVE|REJECT) bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: update withdrawal status, trigger on-chain tx if APPROVE, notify user
  await auditLog({
    userId: req.user!.sub,
    action: `ADMIN_WITHDRAWAL_${body.action}`,
    resource: `finance/withdrawals/${body.withdrawId}`,
    ...buildAuditContext(req),
    timestamp: new Date().toISOString(),
    changes: { withdrawId: body.withdrawId, action: body.action, reason: body.reason },
  });
  ok(res, {
    withdrawId: body.withdrawId,
    status: body.action === "APPROVE" ? "PROCESSING" : "REJECTED",
    processedAt: new Date().toISOString(),
  }, `Lệnh rút đã được ${body.action === "APPROVE" ? "phê duyệt" : "từ chối"}`);
});
