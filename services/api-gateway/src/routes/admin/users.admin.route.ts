import { Router } from "express";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../../lib/response.js";
import { auditLog, buildAuditContext } from "../../lib/audit.js";
import type { UpdateUserStatusRequest } from "@vnkrvietnam/types";

export const usersAdminRouter = Router();

usersAdminRouter.use(authenticate, requireAdmin);

// ─── GET /api/v1/admin/users ──────────────────────────────────────────────────
usersAdminRouter.get("/", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 50;
  // TODO: query DB with filters
  paginated(res, [
    { userId: "u001", fullName: "Nguyễn Văn A", phone: "0901234567", kycStatus: "VERIFIED", kycTier: 2, accountStatus: "ACTIVE",  createdAt: "2024-01-15T00:00:00Z", totalVolume: "50000000" },
    { userId: "u002", fullName: "Trần Thị B",   phone: "0912345678", kycStatus: "PENDING",  kycTier: 1, accountStatus: "ACTIVE",  createdAt: "2024-02-10T00:00:00Z", totalVolume: "5000000"  },
    { userId: "u003", fullName: "Lê Minh C",    phone: "0923456789", kycStatus: "VERIFIED", kycTier: 2, accountStatus: "LOCKED",  createdAt: "2024-03-05T00:00:00Z", totalVolume: "0"        },
  ], 3, page, limit);
});

// ─── PUT /api/v1/admin/users/:id/status ──────────────────────────────────────
usersAdminRouter.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const body = req.body as UpdateUserStatusRequest;
  if (!body.status || !["ACTIVE", "LOCKED", "SUSPENDED"].includes(body.status)) {
    fail(res, "status phải là ACTIVE | LOCKED | SUSPENDED", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: update user status in DB
  await auditLog({
    userId: req.user!.sub,
    action: `ADMIN_UPDATE_USER_STATUS_${body.status}`,
    resource: `users/${id}`,
    ...buildAuditContext(req),
    timestamp: new Date().toISOString(),
    changes: { targetUserId: id, status: body.status, reason: body.reason },
  });
  ok(res, { userId: id, status: body.status, updatedAt: new Date().toISOString() }, "Trạng thái tài khoản đã được cập nhật");
});
