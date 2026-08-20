import { Router } from "express";
import { signAccessToken, signRefreshToken } from "../../lib/jwt.js";
import { ok, fail } from "../../lib/response.js";
import { auditLog, buildAuditContext } from "../../lib/audit.js";
import type { LoginRequest } from "@vnkrvietnam/types";

export const authAdminRouter = Router();

// ─── POST /api/v1/admin/auth/login ────────────────────────────────────────────
authAdminRouter.post("/login", async (req, res) => {
  const { identifier, password } = req.body as LoginRequest;
  if (!identifier || !password) {
    fail(res, "identifier và password bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: lookup admin user in DB, verify password hash, check role = 'admin'
  const adminId = "admin-root-id";
  const accessToken  = signAccessToken({ sub: adminId, role: "admin" });
  const refreshToken = signRefreshToken({ sub: adminId, role: "admin" });
  await auditLog({ userId: adminId, action: "ADMIN_LOGIN", resource: "admin/auth", ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, { adminId, accessToken, refreshToken, expiresIn: 900 }, "Admin đăng nhập thành công");
});
