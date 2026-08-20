import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { ok, created, fail } from "../lib/response.js";
import type { LessonProgressRequest } from "@vnkrvietnam/types";

export const learnRouter = Router();

// ─── GET /api/v1/learn/courses — Public ───────────────────────────────────────
learnRouter.get("/courses", (_req, res) => {
  ok(res, [
    { courseId: "C001", title: "Bitcoin & Blockchain Cơ Bản",     level: "BEGINNER",     category: "Crypto",  lessonCount: 8,  durationMinutes: 120, published: true },
    { courseId: "C002", title: "DeFi Nâng Cao — Yield Farming",   level: "INTERMEDIATE", category: "DeFi",    lessonCount: 12, durationMinutes: 240, published: true },
    { courseId: "C003", title: "Trading Kỹ Thuật Chuyên Sâu",     level: "PRO",          category: "Trading", lessonCount: 20, durationMinutes: 480, published: true },
    { courseId: "C004", title: "Thanh Toán Số & Quy Định VN",     level: "BEGINNER",     category: "Fintech", lessonCount: 6,  durationMinutes: 90,  published: true },
  ]);
});

// ─── GET /api/v1/learn/courses/:id — Public ───────────────────────────────────
learnRouter.get("/courses/:id", (req, res) => {
  const { id } = req.params;
  // TODO: fetch from DB
  ok(res, {
    courseId: id,
    title: "Bitcoin & Blockchain Cơ Bản",
    description: "Tìm hiểu toàn diện về Bitcoin, cách thức hoạt động của blockchain và ứng dụng trong tài chính.",
    level: "BEGINNER",
    lessons: [
      { lessonId: "L001", title: "Blockchain là gì?",      contentType: "VIDEO",   durationMinutes: 15, order: 1 },
      { lessonId: "L002", title: "Bitcoin hoạt động thế nào?", contentType: "VIDEO", durationMinutes: 20, order: 2 },
      { lessonId: "L003", title: "Ví Crypto & Private Key",   contentType: "ARTICLE", durationMinutes: 10, order: 3 },
    ],
  });
});

// ─── GET /api/v1/learn/lessons/:id — Auth required ───────────────────────────
learnRouter.get("/lessons/:id", authenticate, (req, res) => {
  const { id } = req.params;
  // TODO: check user has access (free / paid), return streaming URL if video
  ok(res, {
    lessonId: id,
    title: "Blockchain là gì?",
    contentType: "VIDEO",
    videoUrl: `https://stream.vnkr.vn/lessons/${id}/index.m3u8`,
    durationMinutes: 15,
    order: 1,
  });
});

// ─── POST /api/v1/learn/progress — Auth required ─────────────────────────────
learnRouter.post("/progress", authenticate, async (req, res) => {
  const body = req.body as LessonProgressRequest;
  if (!body.lessonId || !body.courseId) {
    fail(res, "lessonId và courseId bắt buộc", 400, "VALIDATION_ERROR");
    return;
  }
  // TODO: upsert progress record, check if course complete, award certificate
  created(res, {
    courseId: body.courseId,
    completedLessons: 3,
    totalLessons: 8,
    percentComplete: 37.5,
    certificateUrl: null,
  }, "Tiến độ đã được cập nhật");
});
