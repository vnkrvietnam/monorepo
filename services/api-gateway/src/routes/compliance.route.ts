import { Router } from "express";
import { authenticate, requireCompliance, requireAdmin } from "../middlewares/auth.middleware.js";
import { ok, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type { NQ05ReportRequest, AMLVerifyRequest } from "@vnkrvietnam/types";

export const complianceRouter = Router();

complianceRouter.use(authenticate);

// ─── POST /api/v1/compliance/nq05/report ─────────────────────────────────────
complianceRouter.post("/nq05/report", requireCompliance, async (req, res) => {
  const body = req.body as NQ05ReportRequest;
  if (!body.startDate || !body.endDate || !body.format) {
    fail(res, "startDate, endDate, format bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: query all transactions in period, generate report file, upload to S3
  const reportId = `RPT-NQ05-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "GENERATE_NQ05_REPORT", resource: "compliance", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: body });
  ok(res, {
    reportId,
    period: `${body.startDate} — ${body.endDate}`,
    totalTransactions: 0, // placeholder until DB query
    totalVolume: "0",
    fileUrl: `https://reports.vnkr.vn/nq05/${reportId}.${body.format.toLowerCase()}`,
    generatedAt: new Date().toISOString(),
  }, "Báo cáo NQ-05 đã được tạo");
});

// ─── GET /api/v1/compliance/nd284/audit-log ───────────────────────────────────
complianceRouter.get("/nd284/audit-log", requireAdmin, (req, res) => {
  const page   = Number(req.query.page)   || 1;
  const limit  = Number(req.query.limit)  || 50;
  const userId = req.query.userId as string | undefined;
  const action = req.query.action as string | undefined;
  // TODO: query from compliance.audit_log table
  ok(res, { items: [], total: 0, page, limit, filters: { userId, action } });
});

// ─── POST /api/v1/compliance/aml/verify ──────────────────────────────────────
complianceRouter.post("/aml/verify", async (req, res) => {
  const body = req.body as AMLVerifyRequest;
  if (!body.transactionId || !body.userId || !body.amount || !body.asset) {
    fail(res, "Thiếu thông tin AML check", 400, "VALIDATION_ERROR");
    return;
  }
  const amount = parseFloat(body.amount);
  // Simple rule-based scoring — replace with Chainalysis/TRM integration
  let riskScore = 0;
  const flags: string[] = [];
  if (amount > 100_000_000) { riskScore += 40; flags.push("LARGE_TRANSACTION"); }
  if (amount > 500_000_000) { riskScore += 30; flags.push("VERY_LARGE_TRANSACTION"); }
  if (body.direction === "OUT" && amount > 50_000_000) { riskScore += 20; flags.push("LARGE_OUTFLOW"); }

  const riskLevel =
    riskScore >= 80 ? "CRITICAL" :
    riskScore >= 50 ? "HIGH" :
    riskScore >= 20 ? "MEDIUM" : "LOW";

  ok(res, {
    transactionId: body.transactionId,
    riskScore,
    riskLevel,
    flags,
    requiresReview: riskScore >= 50,
  });
});
