import { Router } from "express";
import { ok } from "../lib/response.js";

export const publicRouter = Router();

// ─── GET /api/v1/public/config ────────────────────────────────────────────────
publicRouter.get("/config", (_req, res) => {
  ok(res, {
    appName: "VNKR Wallet",
    appVersion: "1.1.0",
    maintenance: false,
    supportedNetworks: ["TRC20", "ERC20", "BEP20", "SOL"],
    fiatCurrencies: ["VND"],
    features: {
      swap:     true,
      staking:  true,
      botTrading: true,
      referral: true,
      learn:    true,
      p2p:      true,
      swift:    true,
    },
    exchangeRates: {
      USDT_VND: 25400,
      BTC_USDT: 67420,
      ETH_USDT: 3420,
    },
  });
});

// ─── GET /api/v1/blogs ────────────────────────────────────────────────────────
publicRouter.get("/blogs", (_req, res) => {
  ok(res, {
    items: [
      { slug: "bitcoin-halving-2024", title: "Bitcoin Halving 2024 — Phân tích tác động", publishedAt: "2024-04-19", category: "Market Analysis", excerpt: "Sự kiện Bitcoin Halving diễn ra như thế nào và tác động đến thị trường crypto..." },
      { slug: "vnkr-stablecoin-guide", title: "Hướng dẫn sử dụng VNKR Stablecoin",       publishedAt: "2024-03-15", category: "Tutorial", excerpt: "VNKR là stablecoin được đảm bảo 1:1 với VND, hỗ trợ đa chuỗi..." },
    ],
    total: 2,
    page: 1,
    limit: 20,
  });
});

// ─── GET /api/v1/blogs/:slug ──────────────────────────────────────────────────
publicRouter.get("/blogs/:slug", (req, res) => {
  const { slug } = req.params;
  // TODO: fetch from CMS DB
  ok(res, { slug, title: slug, content: "<p>Nội dung bài viết...</p>", publishedAt: new Date().toISOString() });
});

// ─── GET /api/v1/content/announcements ───────────────────────────────────────
publicRouter.get("/content/announcements", (_req, res) => {
  ok(res, [
    { id: "ann-001", title: "Bảo trì hệ thống lúc 2:00–4:00 ngày 30/06", body: "Hệ thống sẽ tạm ngưng giao dịch để nâng cấp cơ sở hạ tầng.", type: "MAINTENANCE", publishedAt: new Date().toISOString() },
  ]);
});

// ─── POST /api/v1/upload/media — File upload ──────────────────────────────────
// NOTE: multer middleware is attached in main index before this router
publicRouter.post("/upload/media", (req, res) => {
  // multer sets req.file when a file is received
  const file = (req as unknown as { file?: { originalname: string; size: number; mimetype: string; location?: string } }).file;
  if (!file) { ok(res, null, "No file received"); return; }
  // TODO: upload to S3/Cloudinary, return CDN URL
  ok(res, {
    url: `https://cdn.vnkr.vn/media/${Date.now()}-${file.originalname}`,
    size: file.size,
    mimeType: file.mimetype,
  }, "File đã được tải lên thành công");
});
