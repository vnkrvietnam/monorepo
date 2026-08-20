import { Router } from "express";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { ok, created, paginated, fail } from "../../lib/response.js";
import { auditLog, buildAuditContext } from "../../lib/audit.js";

export const cmsAdminRouter = Router();

cmsAdminRouter.use(authenticate, requireAdmin);

// ─── GET /api/v1/admin/cms/blogs ─────────────────────────────────────────────
cmsAdminRouter.get("/blogs", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  // TODO: fetch all blogs including drafts
  paginated(res, [], 0, page, limit);
});

// ─── POST /api/v1/admin/cms/blogs ────────────────────────────────────────────
cmsAdminRouter.post("/blogs", async (req, res) => {
  const { title, content, category, published } = req.body as { title: string; content: string; category: string; published: boolean };
  if (!title || !content) { fail(res, "title và content bắt buộc", 400, "VALIDATION_ERROR"); return; }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
  // TODO: insert into CMS DB
  await auditLog({ userId: req.user!.sub, action: "CMS_CREATE_BLOG", resource: "cms/blogs", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { title, category } });
  created(res, { slug, title, published: published ?? false, createdAt: new Date().toISOString() }, "Bài viết đã được tạo");
});

// ─── PUT /api/v1/admin/cms/blogs/:slug ───────────────────────────────────────
cmsAdminRouter.put("/blogs/:slug", async (req, res) => {
  const { slug } = req.params;
  // TODO: update in DB
  await auditLog({ userId: req.user!.sub, action: "CMS_UPDATE_BLOG", resource: `cms/blogs/${slug}`, ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, { slug, updatedAt: new Date().toISOString() }, "Bài viết đã được cập nhật");
});

// ─── DELETE /api/v1/admin/cms/blogs/:slug ────────────────────────────────────
cmsAdminRouter.delete("/blogs/:slug", async (req, res) => {
  const { slug } = req.params;
  await auditLog({ userId: req.user!.sub, action: "CMS_DELETE_BLOG", resource: `cms/blogs/${slug}`, ...buildAuditContext(req), timestamp: new Date().toISOString() });
  ok(res, null, "Bài viết đã được xoá");
});

// ─── GET /api/v1/admin/cms/courses ───────────────────────────────────────────
cmsAdminRouter.get("/courses", (req, res) => {
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  paginated(res, [], 0, page, limit);
});

// ─── POST /api/v1/admin/cms/courses ──────────────────────────────────────────
cmsAdminRouter.post("/courses", async (req, res) => {
  const { title, description, level, category } = req.body as { title: string; description: string; level: string; category: string };
  if (!title || !level) { fail(res, "title và level bắt buộc", 400, "VALIDATION_ERROR"); return; }
  const courseId = `C${Date.now()}`;
  await auditLog({ userId: req.user!.sub, action: "CMS_CREATE_COURSE", resource: "cms/courses", ...buildAuditContext(req), timestamp: new Date().toISOString(), changes: { courseId, title, level } });
  created(res, { courseId, title, level, category, published: false, createdAt: new Date().toISOString() }, "Khóa học đã được tạo");
});
