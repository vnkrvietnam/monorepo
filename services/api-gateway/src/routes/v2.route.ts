/**
 * API v2 Router — Stub
 *
 * v2 introduces:
 *  - Cursor-based pagination (`cursor` / `nextCursor`) instead of offset
 *  - Enriched market data endpoints
 *  - Native ISO 20022 payment initiation
 *
 * All v2 routes are aliased here and evolve independently from v1.
 * New products/features ship to v2 first; v1 remains stable.
 */
import { Router } from "express";
import { ok } from "../lib/response.js";

export const v2Router = Router();

// ─── GET /api/v2/meta — V2 capability discovery ───────────────────────────────
v2Router.get("/meta", (_req, res) => {
  ok(res, {
    version:  "2",
    released: "2025-01-01",
    features: [
      "cursor_pagination",
      "batch_rpc",
      "iso20022_payments",
      "enhanced_market_data",
      "streaming_candles",
    ],
    deprecates: {
      v1: {
        sunset:  "2026-12-31",
        docsUrl: "https://docs.vnkr.vn/api/migration/v1-to-v2",
      },
    },
  }, "VNKR API v2");
});

// ─── TODO: v2 route modules will be added here ────────────────────────────────
// import { exchangeV2Router } from "./v2/exchange.v2.route.js";
// v2Router.use("/exchange", exchangeV2Router);
