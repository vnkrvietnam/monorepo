import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type {
  UpdateProfileRequest,
  KYCSubmitRequest,
  RevokeSessionRequest,
  ChangePasswordRequest,
  MarkNotificationsReadRequest,
} from "@vnkrvietnam/types";

export const userRouter = Router();

// ─── All user routes require authentication ───────────────────────────────────
userRouter.use(authenticate);

// ─── GET /api/v1/user/profile ─────────────────────────────────────────────────
userRouter.get("/profile", (req, res) => {
  // TODO: fetch from DB
  ok(res, {
    userId: req.user!.sub,
    fullName: "Nguyễn Văn A",
    phone: "0901234567",
    email: "nguyen.van.a@vnkr.vn",
    avatar: null,
    kycStatus: "VERIFIED",
    kycTier: 2,
    createdAt: "2024-01-15T00:00:00Z",
  });
});

// ─── PUT /api/v1/user/profile ─────────────────────────────────────────────────
userRouter.put("/profile", async (req, res) => {
  const body = req.body as UpdateProfileRequest;
  // TODO: update DB record
  await auditLog({ userId: req.user!.sub, action: "UPDATE_PROFILE", resource: "users", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: body });
  ok(res, body, "Hồ sơ đã được cập nhật");
});

// ─── POST /api/v1/user/kyc/submit ────────────────────────────────────────────
userRouter.post("/kyc/submit", async (req, res) => {
  const body = req.body as KYCSubmitRequest;
  if (!body.documentType || !body.documentNumber || !body.frontImageUrl || !body.selfieImageUrl) {
    fail(res, "Thiếu thông tin hồ sơ KYC", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: create KYC record in DB with PENDING status, enqueue for review
  await auditLog({ userId: req.user!.sub, action: "KYC_SUBMIT", resource: "kyc", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  created(res, { status: "PENDING", submittedAt: new Date().toISOString() }, "Hồ sơ KYC đã được nộp");
});

// ─── GET /api/v1/user/kyc/status ─────────────────────────────────────────────
userRouter.get("/kyc/status", (req, res) => {
  // TODO: fetch from DB
  ok(res, { status: "VERIFIED", tier: 2, verifiedAt: "2024-02-01T00:00:00Z" });
});

// ─── GET /api/v1/user/security/sessions ──────────────────────────────────────
userRouter.get("/security/sessions", (req, res) => {
  // TODO: fetch sessions from Redis/DB
  ok(res, [
    { sessionId: "sess-001", deviceName: "iPhone 15 Pro", deviceOS: "iOS 17.4", ipAddress: "103.1.2.3", location: "TP.HCM, VN", lastSeen: new Date().toISOString(), current: true },
  ]);
});

// ─── POST /api/v1/user/security/sessions/revoke ──────────────────────────────
userRouter.post("/security/sessions/revoke", async (req, res) => {
  const { sessionId } = req.body as RevokeSessionRequest;
  if (!sessionId) { fail(res, "sessionId bắt buộc", 400, "VALIDATION_ERROR"); return; }
  // TODO: remove session from Redis
  await auditLog({ userId: req.user!.sub, action: "REVOKE_SESSION", resource: "sessions", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { sessionId } });
  ok(res, null, "Đã đăng xuất thiết bị thành công");
});

// ─── PUT /api/v1/user/security/change-password ───────────────────────────────
userRouter.put("/security/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body as ChangePasswordRequest;
  if (!currentPassword || !newPassword) { fail(res, "Thiếu thông tin đổi mật khẩu", 400, "VALIDATION_ERROR"); return; }
  if (newPassword.length < 8) { fail(res, "Mật khẩu mới phải có ít nhất 8 ký tự", 400, "WEAK_PASSWORD"); return; }
  // TODO: verify currentPassword, update hash
  await auditLog({ userId: req.user!.sub, action: "CHANGE_PASSWORD", resource: "security", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, null, "Đổi mật khẩu thành công");
});

// ─── GET /api/v1/user/notifications ──────────────────────────────────────────
userRouter.get("/notifications", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  // TODO: fetch from DB
  paginated(res, [], 0, page, limit);
});

// ─── PATCH /api/v1/user/notifications/read ───────────────────────────────────
userRouter.patch("/notifications/read", async (req, res) => {
  const { notificationIds } = req.body as MarkNotificationsReadRequest;
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    fail(res, "notificationIds phải là mảng không rỗng", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: update isRead = true in DB
  ok(res, null, "Đã đánh dấu đã đọc");
});
