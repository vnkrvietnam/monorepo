import { Router } from "express";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  Enable2FARequest,
  Disable2FARequest,
  VerifyPinRequest,
} from "@vnkrvietnam/types";

export const authRouter = Router();

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
authRouter.post("/register", async (req, res) => {
  const body = req.body as RegisterRequest;
  if (!body.password || (!body.phone && !body.email)) {
    fail(res, "Vui lòng cung cấp số điện thoại/email và mật khẩu", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: persist user to DB, check uniqueness
  const passwordHash = await bcrypt.hash(body.password, 12);
  const userId = uuidv4();
  const accessToken  = signAccessToken({ sub: userId, role: "user" });
  const refreshToken = signRefreshToken({ sub: userId, role: "user" });
  await auditLog({ userId, action: "REGISTER", resource: "users", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  created(res, { userId, accessToken, refreshToken, expiresIn: 900 }, "Đăng ký thành công");
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
authRouter.post("/login", async (req, res) => {
  const body = req.body as LoginRequest;
  if (!body.identifier || !body.password) {
    fail(res, "Thiếu thông tin đăng nhập", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: fetch user from DB, validate password hash, check 2FA
  const userId = "demo-user-id"; // placeholder
  const accessToken  = signAccessToken({ sub: userId, role: "user" });
  const refreshToken = signRefreshToken({ sub: userId, role: "user" });
  await auditLog({ userId, action: "LOGIN", resource: "auth", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, { userId, accessToken, refreshToken, expiresIn: 900 }, "Đăng nhập thành công");
});

// ─── POST /api/v1/auth/refresh-token ─────────────────────────────────────────
authRouter.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body as RefreshTokenRequest;
  if (!refreshToken) { fail(res, "Missing refresh token", 400, "VALIDATION_ERROR"); return; }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    ok(res, { accessToken, expiresIn: 900 });
  } catch {
    fail(res, "Refresh token không hợp lệ hoặc đã hết hạn", 401, "INVALID_REFRESH_TOKEN");
  }
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
authRouter.post("/logout", authenticate, async (req, res) => {
  // TODO: blacklist refresh token in Redis
  await auditLog({ userId: req.user!.sub, action: "LOGOUT", resource: "auth", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, null, "Đã đăng xuất thành công");
});

// ─── POST /api/v1/auth/forgot-password ───────────────────────────────────────
authRouter.post("/forgot-password", async (req, res) => {
  const { identifier } = req.body as ForgotPasswordRequest;
  if (!identifier) { fail(res, "Vui lòng cung cấp email hoặc số điện thoại", 400, "VALIDATION_ERROR"); return; }
  // TODO: generate OTP, send via email/SMS
  ok(res, { otpSent: true }, "Mã khôi phục đã được gửi");
});

// ─── POST /api/v1/auth/reset-password ────────────────────────────────────────
authRouter.post("/reset-password", async (req, res) => {
  const body = req.body as ResetPasswordRequest;
  if (!body.otp || !body.newPassword || !body.identifier) {
    fail(res, "Thiếu thông tin xác nhận", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: verify OTP, update password hash in DB
  ok(res, null, "Mật khẩu đã được cập nhật thành công");
});

// ─── POST /api/v1/auth/2fa/setup ─────────────────────────────────────────────
authRouter.post("/2fa/setup", authenticate, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `VNKR:${req.user!.sub}`, length: 20 });
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url ?? "");
  // TODO: persist secret (encrypted) to user record temporarily until enabled
  ok(res, {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes: Array.from({ length: 8 }, () => uuidv4().slice(0, 8).toUpperCase()),
  });
});

// ─── POST /api/v1/auth/2fa/enable ────────────────────────────────────────────
authRouter.post("/2fa/enable", authenticate, async (req, res) => {
  const { totpCode } = req.body as Enable2FARequest;
  if (!totpCode) { fail(res, "Mã TOTP bắt buộc", 400, "VALIDATION_ERROR"); return; }
  // TODO: retrieve pending secret, verify totpCode, set user.twoFAEnabled = true
  await auditLog({ userId: req.user!.sub, action: "2FA_ENABLE", resource: "security", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, { twoFAEnabled: true }, "2FA đã được kích hoạt");
});

// ─── POST /api/v1/auth/2fa/disable ───────────────────────────────────────────
authRouter.post("/2fa/disable", authenticate, async (req, res) => {
  const { totpCode, backupCode } = req.body as Disable2FARequest;
  if (!totpCode && !backupCode) { fail(res, "Cần mã TOTP hoặc mã dự phòng", 400, "VALIDATION_ERROR"); return; }
  // TODO: verify code, disable 2FA
  await auditLog({ userId: req.user!.sub, action: "2FA_DISABLE", resource: "security", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, { twoFAEnabled: false }, "2FA đã được tắt");
});

// ─── POST /api/v1/auth/pin/verify ────────────────────────────────────────────
authRouter.post("/pin/verify", authenticate, async (req, res) => {
  const { pin, action } = req.body as VerifyPinRequest;
  if (!pin || !action) { fail(res, "PIN và action bắt buộc", 400, "VALIDATION_ERROR"); return; }
  // TODO: retrieve PIN hash from DB, compare with bcrypt
  const isValid = pin.length === 6; // placeholder
  if (!isValid) { fail(res, "PIN không đúng", 401, "INVALID_PIN"); return; }
  const verifyToken = signAccessToken({ sub: req.user!.sub, role: req.user!.role });
  ok(res, { verified: true, verifyToken }, "PIN xác thực thành công");
});
