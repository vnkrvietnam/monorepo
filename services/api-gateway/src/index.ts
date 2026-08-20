/**
 * API Gateway — Main Entry Point
 * Express server wiring all route domains.
 *
 * Ports:
 *   HTTP API  — PORT=5000   (env: PORT)
 *   WebSocket — PORT=5001   (env: WEBSOCKET_PORT)
 *
 * Versioning:
 *   /api/v1  — stable, current default  (env: API_PREFIX)
 *   /api/v2  — new features, cursor pagination
 *   /api/v1/rpc — JSON-RPC 2.0 blockchain node proxy
 */
import express from "express";
import cors    from "cors";
import helmet  from "helmet";
import rateLimit from "express-rate-limit";
import multer  from "multer";

// ── Route modules — v1 ────────────────────────────────────────────────────────
import { authRouter }       from "./routes/auth.route.js";
import { userRouter }       from "./routes/user.route.js";
import { exchangeRouter }   from "./routes/exchange.route.js";
import { financeRouter }    from "./routes/finance.route.js";
import { extRouter }        from "./routes/ext.route.js";
import { publicRouter }     from "./routes/public.route.js";
import { learnRouter }      from "./routes/learn.route.js";
import { referralRouter }   from "./routes/referral.route.js";
import { webhookRouter }    from "./routes/webhooks.route.js";
import { complianceRouter } from "./routes/compliance.route.js";
import { rpcRouter }        from "./routes/rpc.route.js";

// ── Admin route modules ───────────────────────────────────────────────────────
import { authAdminRouter }        from "./routes/admin/auth.admin.route.js";
import { usersAdminRouter }       from "./routes/admin/users.admin.route.js";
import { kycAdminRouter }         from "./routes/admin/kyc.admin.route.js";
import { financeAdminRouter }     from "./routes/admin/finance.admin.route.js";
import { cmsAdminRouter }         from "./routes/admin/cms.admin.route.js";
import { complianceAdminRouter }  from "./routes/admin/compliance.admin.route.js";
import { systemAdminRouter }      from "./routes/admin/system.admin.route.js";

// ── v2 router ─────────────────────────────────────────────────────────────────
import { v2Router } from "./routes/v2.route.js";

const app  = express();
const PORT = Number(process.env.PORT) || 5000;
const V1   = process.env.API_PREFIX ?? "/api/v1";
const V2   = "/api/v2";

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.APP_URL ?? "http://localhost:3010",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting — global 200 req/min per IP
app.use(rateLimit({
  windowMs:       60 * 1000,
  max:            200,
  message:        { success: false, message: "Too many requests. Please try again later.", data: null },
  standardHeaders: true,
  legacyHeaders:   false,
}));

// Stricter rate limit for auth endpoints (20 req / 15 min)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// Stricter rate limit for RPC endpoint (60 req / min)
const rpcLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

// Multer for media upload (memory storage — upload to cloud from there)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway", ts: new Date().toISOString() });
});

// ── API Discovery ─────────────────────────────────────────────────────────────
app.get("/api", (_req, res) => {
  res.json({
    service:  "vnkr-api-gateway",
    versions: [
      { version: "v1", prefix: V1,  status: "stable",     docsUrl: "https://docs.vnkr.vn/api/v1" },
      { version: "v2", prefix: V2,  status: "preview",    docsUrl: "https://docs.vnkr.vn/api/v2" },
    ],
    rpc: { url: `${V1}/rpc`, protocol: "JSON-RPC 2.0", description: "Blockchain node proxy" },
    ws:  { url: `ws://api.vnkr.vn:5001`,             protocol: "WebSocket",     description: "Real-time data streams" },
  });
});

// ── API v1 Routes ─────────────────────────────────────────────────────────────
app.use(`${V1}/auth`,       authLimiter, authRouter);
app.use(`${V1}/user`,       userRouter);
app.use(`${V1}/exchange`,   exchangeRouter);
app.use(`${V1}/finance`,    financeRouter);
app.use(`${V1}/ext`,        extRouter);
app.use(`${V1}/public`,     publicRouter);
app.use(`${V1}/blogs`,      publicRouter);   // /blogs shares publicRouter handlers
app.use(`${V1}/content`,    publicRouter);   // /content/announcements
app.use(`${V1}/upload`,     upload.single("file"), publicRouter);
app.use(`${V1}/learn`,      learnRouter);
app.use(`${V1}/referral`,   referralRouter);
app.use(`${V1}/webhooks`,   webhookRouter);
app.use(`${V1}/compliance`, complianceRouter);

// ── JSON-RPC 2.0 endpoint (blockchain node proxy) ─────────────────────────────
app.use(`${V1}/rpc`,  rpcLimiter, rpcRouter);
app.use(`${V2}/rpc`,  rpcLimiter, rpcRouter); // same handler, different prefix

// ── Admin API Routes ──────────────────────────────────────────────────────────
app.use(`${V1}/admin/auth`,       authLimiter, authAdminRouter);
app.use(`${V1}/admin/users`,      usersAdminRouter);
app.use(`${V1}/admin/kyc`,        kycAdminRouter);
app.use(`${V1}/admin/finance`,    financeAdminRouter);
app.use(`${V1}/admin/cms`,        cmsAdminRouter);
app.use(`${V1}/admin/compliance`, complianceAdminRouter);
app.use(`${V1}/admin/system`,     systemAdminRouter);

// ── API v2 Routes ─────────────────────────────────────────────────────────────
app.use(V2, v2Router);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found", data: null, errorCode: "NOT_FOUND" });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api-gateway] Unhandled error:", err.message, err.stack);
  res.status(500).json({ success: false, message: "Internal server error", data: null, errorCode: "INTERNAL_ERROR" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[api-gateway] Listening on port ${PORT} (v1: ${V1}  v2: ${V2})`);
});

export default app;
