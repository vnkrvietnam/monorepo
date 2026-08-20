import { Router } from "express";
import { authenticate, requireCompliance, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ok, created, paginated } from "../../lib/response.js";
import { auditLog, buildAuditContext } from "../../lib/audit.js";
import type { NQ05ReportRequest } from "@vnkrvietnam/types";

export const complianceAdminRouter = Router();

complianceAdminRouter.use(authenticate);

// ─── POST /api/v1/admin/compliance/nq05/report ───────────────────────────────
complianceAdminRouter.post("/nq05/report", requireCompliance, async (req, res) => {
  const body = req.body as NQ05ReportRequest;
  const reportId = `RPT-NQ05-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "ADMIN_GENERATE_NQ05_REPORT", resource: "compliance/nq05", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: body });
  created(res, {
    reportId,
    period: `${body.startDate} — ${body.endDate}`,
    totalTransactions: 0,
    totalVolume: "0",
    fileUrl: `https://reports.vnkr.vn/nq05/${reportId}.${(body.format ?? "JSON").toLowerCase()}`,
    generatedAt: new Date().toISOString(),
  }, "Báo cáo NQ-05 đã được xuất");
});

// ─── GET /api/v1/admin/compliance/nd284/audit-log ────────────────────────────
complianceAdminRouter.get("/nd284/audit-log", requireAdmin, (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 100;
  // TODO: query compliance.audit_log
  paginated(res, [], 0, page, limit);
});

// ─── GET /api/v1/admin/compliance/aml/flagged ────────────────────────────────
complianceAdminRouter.get("/aml/flagged", requireAdmin, (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  // TODO: fetch transactions with riskLevel >= HIGH
  paginated(res, [], 0, page, limit);
});
