import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../lib/response.js";
import { auditLog, buildAuditContext } from "../lib/audit.js";
import type {
  CryptoDepositAddressRequest,
  FiatDepositRequest,
  WithdrawCryptoRequest,
  WithdrawFiatRequest,
  P2PTransferRequest,
  SwiftTransferRequest,
} from "@vnkrvietnam/types";

export const financeRouter = Router();

// All finance routes require authentication
financeRouter.use(authenticate);

// ─── GET /api/v1/finance/balances ─────────────────────────────────────────────
financeRouter.get("/balances", (req, res) => {
  // TODO: aggregate balances from DB
  ok(res, [
    { asset: "VND",  network: "VND",   available: "2500000", locked: "0",       usdEquivalent: "100.00"  },
    { asset: "BTC",  network: "ERC20", available: "0.0842",  locked: "0",       usdEquivalent: "5680.04" },
    { asset: "ETH",  network: "ERC20", available: "1.25",    locked: "0",       usdEquivalent: "4275.00" },
    { asset: "SOL",  network: "SOL",   available: "12.5",    locked: "0",       usdEquivalent: "1850.00" },
    { asset: "USDT", network: "TRC20", available: "500.00",  locked: "100.00",  usdEquivalent: "500.00"  },
  ]);
});

// ─── POST /api/v1/finance/deposit/crypto/address ─────────────────────────────
financeRouter.post("/deposit/crypto/address", async (req, res) => {
  const body = req.body as CryptoDepositAddressRequest;
  if (!body.asset || !body.network) {
    fail(res, "asset và network bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: generate or fetch deposit address from Tatum/Alchemy
  const address = `T${req.user!.sub.slice(0, 30)}`; // mock TRC20 address placeholder
  created(res, { address, asset: body.asset, network: body.network, memo: undefined, qrCode: undefined });
});

// ─── POST /api/v1/finance/deposit/fiat ───────────────────────────────────────
financeRouter.post("/deposit/fiat", async (req, res) => {
  const body = req.body as FiatDepositRequest;
  if (!body.amount || body.amount <= 0) { fail(res, "Số tiền không hợp lệ", 400, "VALIDATION_ERROR"); return; }
  const orderId = `FD-${Date.now()}`;
  // TODO: create VietQR payment intent
  created(res, {
    orderId,
    vietQrContent: `00020101021238540010A000000727012700069704220113${orderId}5303704540${body.amount}5802VN6304`,
    bankAccount: "1234567890",
    bankName: "VNKR Internal Bank",
    amount: body.amount,
    description: body.description ?? `VNKR NAP ${orderId}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
});

// ─── POST /api/v1/finance/withdraw/crypto ────────────────────────────────────
financeRouter.post("/withdraw/crypto", async (req, res) => {
  const body = req.body as WithdrawCryptoRequest;
  if (!body.asset || !body.network || !body.toAddress || !body.amount || !body.pin) {
    fail(res, "Thiếu thông tin rút tiền crypto", 400, "VALIDATION_ERROR");
    return;
  }
  // Security: validate PIN before processing
  if (body.pin.length !== 6) { fail(res, "PIN không hợp lệ", 401, "INVALID_PIN"); return; }
  // TODO: verify PIN hash, check balance, check AML, enqueue to withdraw-worker
  const withdrawId = `WC-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "WITHDRAW_CRYPTO", resource: "finance", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { withdrawId, asset: body.asset, amount: body.amount, network: body.network } });
  created(res, { withdrawId, status: "PENDING", estimatedTime: "5-30 phút" }, "Lệnh rút đã được khởi tạo");
});

// ─── POST /api/v1/finance/withdraw/fiat ──────────────────────────────────────
financeRouter.post("/withdraw/fiat", async (req, res) => {
  const body = req.body as WithdrawFiatRequest;
  if (!body.amount || !body.bankCode || !body.accountNumber || !body.accountName || !body.pin) {
    fail(res, "Thiếu thông tin rút tiền fiat", 400, "VALIDATION_ERROR");
    return;
  }
  if (body.pin.length !== 6) { fail(res, "PIN không hợp lệ", 401, "INVALID_PIN"); return; }
  // TODO: verify PIN, check balance, enqueue to withdraw-worker (may require admin approval if > threshold)
  const withdrawId = `WF-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "WITHDRAW_FIAT", resource: "finance", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { withdrawId, amount: body.amount, bankCode: body.bankCode } });
  created(res, { withdrawId, status: "PENDING", estimatedTime: "1-2 giờ" }, "Lệnh rút về tài khoản ngân hàng đã được gửi");
});

// ─── POST /api/v1/finance/transfer/p2p ───────────────────────────────────────
financeRouter.post("/transfer/p2p", async (req, res) => {
  const body = req.body as P2PTransferRequest;
  if (!body.toIdentifier || !body.amount || !body.pin || !body.idempotencyKey) {
    fail(res, "Thiếu thông tin chuyển tiền P2P", 400, "VALIDATION_ERROR");
    return;
  }
  if (body.pin.length !== 6) { fail(res, "PIN không hợp lệ", 401, "INVALID_PIN"); return; }
  // Idempotency check
  // TODO: check idempotencyKey in Redis, if exists return cached result
  const txId = `P2P-${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "P2P_TRANSFER", resource: "finance", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { txId, to: body.toIdentifier, amount: body.amount } });
  ok(res, { txId, status: "SUCCESS", completedAt: new Date().toISOString() }, "Chuyển tiền thành công");
});

// ─── POST /api/v1/finance/swift/transfer ─────────────────────────────────────
financeRouter.post("/swift/transfer", async (req, res) => {
  const body = req.body as SwiftTransferRequest;
  if (!body.beneficiaryName || !body.swiftCode || !body.amount || !body.currency || !body.pin) {
    fail(res, "Thiếu thông tin SWIFT", 400, "VALIDATION_ERROR");
    return;
  }
  if (body.pin.length !== 6) { fail(res, "PIN không hợp lệ", 401, "INVALID_PIN"); return; }
  // TODO: verify PIN, send to swift-gateway service
  const uetr = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  await auditLog({ userId: req.user!.sub, action: "SWIFT_TRANSFER", resource: "finance", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { uetr, amount: body.amount, currency: body.currency } });
  ok(res, { uetr, status: "SUBMITTED", estimatedSettlement: "1-3 ngày làm việc" }, "Lệnh SWIFT đã được gửi");
});

// ─── GET /api/v1/finance/transactions/history ────────────────────────────────
financeRouter.get("/transactions/history", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  // TODO: fetch paginated from DB
  paginated(res, [], 0, page, limit);
});
