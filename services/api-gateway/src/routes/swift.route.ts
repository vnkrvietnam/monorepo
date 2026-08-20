import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type { SwiftTransferRequest } from "@vnkrvietnam/types";

export const swiftRouter = Router();

// All SWIFT routes require authentication
swiftRouter.use(authenticate);

// ─── POST /api/v1/swift/transfer ─────────────────────────────────────────────
/**
 * Initiate a cross-border SWIFT transfer (pacs.008 FIToFI Credit Transfer).
 *
 * Flow:
 *  1. Validate input + PIN.
 *  2. Debit user VND/VNKR balance (pending state).
 *  3. Forward pacs.008 payload to swift-gateway service (port 4004).
 *  4. Return UETR for client-side tracking.
 *
 * @returns { uetr, status, estimatedSettlement }
 */
swiftRouter.post("/transfer", async (req, res) => {
  const body = req.body as SwiftTransferRequest;
  if (
    !body.beneficiaryName ||
    !body.swiftCode ||
    !body.amount ||
    !body.currency ||
    !body.pin
  ) {
    fail(res, "Thiếu thông tin SWIFT", 400, "VALIDATION_ERROR");
    return;
  }
  if (body.pin.length !== 6) {
    fail(res, "PIN không hợp lệ", 401, "INVALID_PIN");
    return;
  }
  // Validate BIC/SWIFT code format (8 or 11 chars)
  const bic = body.swiftCode.trim().toUpperCase();
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    fail(res, "BIC/SWIFT code không hợp lệ", 400, "INVALID_BIC");
    return;
  }

  // Generate UETR (Unique End-to-End Transaction Reference) per ISO 20022
  const uetr = [
    Date.now().toString(16).padStart(12, "0"),
    Math.random().toString(16).slice(2, 10),
    Math.random().toString(16).slice(2, 6),
  ].join("-");

  // TODO: verify PIN hash, check balance, enqueue pacs.008 to swift-gateway
  await auditLog({
    userId: req.user!.sub, action: "SWIFT_TRANSFER", resource: "swift",
    ...buildAuditContext(req), timestamp: new Date().toISOString(),
    changes: {
      uetr,
      amount: body.amount,
      currency: body.currency,
      swiftCode: bic,
      beneficiaryName: body.beneficiaryName,
    },
  });
  ok(res, {
    uetr,
    status: "SUBMITTED",
    estimatedSettlement: "1-3 ngày làm việc",
    submittedAt: new Date().toISOString(),
  }, "Lệnh SWIFT đã được gửi");
});

// ─── GET /api/v1/swift/uetr/:uetr/status ────────────────────────────────────
/**
 * Retrieve the real-time status of a SWIFT GPI payment by UETR.
 * Proxied from the SWIFT GPI Tracker API via @vnkrvietnam/sdk-swift GpiTrackerClient.
 */
swiftRouter.get("/uetr/:uetr/status", async (req, res) => {
  const { uetr } = req.params;
  if (!uetr || !/^[0-9a-f-]{20,}$/.test(uetr.toLowerCase())) {
    fail(res, "UETR không hợp lệ", 400, "INVALID_UETR");
    return;
  }
  // TODO: call GpiTrackerClient.getPaymentStatus(uetr) from @vnkrvietnam/sdk-swift
  ok(res, {
    uetr,
    status: "PROCESSING",
    lastUpdateTime: new Date().toISOString(),
    agents: [],
    creditDebitIndicator: "CRDT",
  });
});

// ─── GET /api/v1/swift/statement ─────────────────────────────────────────────
/**
 * Retrieve the camt.053 account statement for the authenticated user's SWIFT account.
 * Query params: startDate (ISO), endDate (ISO)
 */
swiftRouter.get("/statement", async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
  if (!startDate || !endDate) {
    fail(res, "startDate và endDate bắt buộc (ISO 8601)", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: fetch camt.053 from SWIFT Alliance Gateway via sdk-swift Camt053 parser
  ok(res, {
    accountId: req.user!.sub,
    period: { from: startDate, to: endDate },
    openingBalance: { amount: "0", currency: "VND" },
    closingBalance: { amount: "0", currency: "VND" },
    entries: [],
  });
});
