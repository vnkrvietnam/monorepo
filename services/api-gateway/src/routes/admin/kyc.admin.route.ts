import { Router } from "express";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../../lib/response.js";
import { auditLog, buildAuditContext } from "../../lib/audit.js";
import type { KYCReviewRequest } from "@vnkrvietnam/types";

export const kycAdminRouter = Router();

kycAdminRouter.use(authenticate, requireAdmin);

// ─── GET /api/v1/admin/kyc/pending ────────────────────────────────────────────
kycAdminRouter.get("/pending", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  // TODO: fetch from DB where kyc_status = 'PENDING'
  paginated(res, [
    { userId: "u002", fullName: "Trần Thị B",  phone: "0912345678", documentType: "CCCD",     submittedAt: "2024-06-20T09:00:00Z", frontImageUrl: "https://cdn.vnkr.vn/kyc/u002-front.jpg", selfieImageUrl: "https://cdn.vnkr.vn/kyc/u002-selfie.jpg" },
    { userId: "u005", fullName: "Phạm Quốc D", phone: "0934567890", documentType: "PASSPORT", submittedAt: "2024-06-22T14:30:00Z", frontImageUrl: "https://cdn.vnkr.vn/kyc/u005-front.jpg", selfieImageUrl: "https://cdn.vnkr.vn/kyc/u005-selfie.jpg" },
  ], 2, page, limit);
});

// ─── POST /api/v1/admin/kyc/review ────────────────────────────────────────────
kycAdminRouter.post("/review", async (req, res) => {
  const body = req.body as KYCReviewRequest;
  if (!body.userId || !body.action || !["APPROVE", "REJECT"].includes(body.action)) {
    fail(res, "userId và action (APPROVE|REJECT) bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  if (body.action === "REJECT" && !body.reason) {
    fail(res, "Cần lý do từ chối khi action = REJECT", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: update KYC status in DB, notify user via WebSocket/Email
  await auditLog({
    userId: req.user!.sub,
    action: `ADMIN_KYC_${body.action}`,
    resource: `kyc/${body.userId}`,
    ...buildAuditContext(req),
    timestamp: new Date().toISOString(),
    changes: { targetUserId: body.userId, action: body.action, reason: body.reason, tierToGrant: body.tierToGrant },
  });
  ok(res, {
    userId: body.userId,
    kycStatus: body.action === "APPROVE" ? "VERIFIED" : "REJECTED",
    reviewedAt: new Date().toISOString(),
    reason: body.reason,
  }, `KYC đã được ${body.action === "APPROVE" ? "phê duyệt" : "từ chối"}`);
});
