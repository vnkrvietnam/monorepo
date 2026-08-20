"use client";
/**
 * /admin/cms — Blog & Course Management
 */
import React, { useState } from "react";
import {
  DataTable, Button, Text, Badge, Input, Modal,
  type DataTableColumn, Search, Edit, Trash, Plus,
} from "@vnkrvietnam/ui-kit";

interface BlogRow { slug: string; title: string; category: string; published: boolean; createdAt: string; }
interface CourseRow { courseId: string; title: string; level: string; lessonCount: number; published: boolean; }

const MOCK_BLOGS: BlogRow[] = [
  { slug: "bitcoin-halving-2024",   title: "Bitcoin Halving 2024 — Phân tích tác động", category: "Market",  published: true,  createdAt: "19/04/2024" },
  { slug: "vnkr-stablecoin-guide",  title: "Hướng dẫn sử dụng VNKR Stablecoin",        category: "Tutorial",published: true,  createdAt: "15/03/2024" },
  { slug: "defi-yield-farming-101", title: "DeFi Yield Farming cho người mới",           category: "DeFi",    published: false, createdAt: "01/06/2024" },
];

const MOCK_COURSES: CourseRow[] = [
  { courseId: "C001", title: "Bitcoin & Blockchain Cơ Bản",   level: "BEGINNER",     lessonCount: 8,  published: true  },
  { courseId: "C002", title: "DeFi Nâng Cao — Yield Farming", level: "INTERMEDIATE", lessonCount: 12, published: true  },
  { courseId: "C003", title: "Trading Kỹ Thuật Chuyên Sâu",   level: "PRO",          lessonCount: 20, published: false },
];

export default function AdminCMSPage() {
  const [tab,          setTab]          = useState<"blogs" | "courses">("blogs");
  const [search,       setSearch]       = useState("");
  const [blogs,        setBlogs]        = useState<BlogRow[]>(MOCK_BLOGS);
  const [courses,      setCourses]      = useState<CourseRow[]>(MOCK_COURSES);
  const [deleteModal,  setDeleteModal]  = useState<string | null>(null);
  const [newBlogModal, setNewBlogModal] = useState(false);
  const [newTitle,     setNewTitle]     = useState("");
  const [newCat,       setNewCat]       = useState("");
  const [loading,      setLoading]      = useState(false);

  const handleCreateBlog = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const slug = newTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").slice(0, 60);
    setBlogs(prev => [{ slug, title: newTitle, category: newCat || "General", published: false, createdAt: new Date().toLocaleDateString("vi-VN") }, ...prev]);
    setLoading(false);
    setNewBlogModal(false);
    setNewTitle("");
    setNewCat("");
  };

  const togglePublish = (slug: string) => {
    setBlogs(prev => prev.map(b => b.slug === slug ? { ...b, published: !b.published } : b));
  };

  const blogColumns: DataTableColumn[] = [
    { key: "title",     label: "Tiêu đề",    render: v => <Text variant="body2" weight="semibold" color="#1A1F36">{(v as BlogRow).title}</Text> },
    { key: "category",  label: "Danh mục",   render: v => <Badge variant="label" color="info" label={(v as BlogRow).category} /> },
    { key: "published", label: "Trạng thái", render: v => <Badge variant="label" color={(v as BlogRow).published ? "success" : "warning"} label={(v as BlogRow).published ? "Đã đăng" : "Bản nháp"} /> },
    { key: "createdAt", label: "Ngày tạo",   render: v => <Text variant="caption" color="#A0AEC0">{(v as BlogRow).createdAt}</Text> },
    {
      key: "actions", label: "Thao tác",
      render: v => (
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="ghost" color="dark" size="sm" iconLeft={<Edit size={14} />} onClick={() => togglePublish((v as BlogRow).slug)}>
            {(v as BlogRow).published ? "Ẩn" : "Đăng"}
          </Button>
          <Button variant="ghost" color="error" size="sm" iconLeft={<Trash size={14} />} onClick={() => setDeleteModal((v as BlogRow).slug)}>Xoá</Button>
        </div>
      ),
    },
  ];

  const courseColumns: DataTableColumn[] = [
    { key: "title",       label: "Tên khóa học", render: v => <Text variant="body2" weight="semibold" color="#1A1F36">{(v as CourseRow).title}</Text> },
    { key: "level",       label: "Cấp độ",       render: v => <Badge variant="label" color={(v as CourseRow).level === "BEGINNER" ? "info" : (v as CourseRow).level === "INTERMEDIATE" ? "warning" : "error"} label={(v as CourseRow).level} /> },
    { key: "lessonCount", label: "Số bài",        render: v => <Text variant="caption" color="#4A5568">{(v as CourseRow).lessonCount} bài học</Text> },
    { key: "published",   label: "Trạng thái",    render: v => <Badge variant="label" color={(v as CourseRow).published ? "success" : "warning"} label={(v as CourseRow).published ? "Công khai" : "Ẩn"} /> },
  ];

  const filteredBlogs   = blogs.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "24px 24px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Text variant="h5" weight="semibold" color="#1A1F36">CMS & Học thuật</Text>
        {tab === "blogs" && (
          <Button variant="filled" color="dark" size="sm" iconLeft={<Plus size={14} />} onClick={() => setNewBlogModal(true)}>Bài viết mới</Button>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", background: "#F5F6FA", borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {[{ id: "blogs", label: "Blog & Tin tức" }, { id: "courses", label: "Khóa học" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
            flex: 1, height: 34, borderRadius: 9, border: "none",
            background: tab === t.id ? "#000" : "transparent",
            color: tab === t.id ? "#fff" : "#718096",
            fontSize: 13, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <Input placeholder="Tìm kiếm..." iconLeft={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {tab === "blogs"   && <DataTable columns={blogColumns}   data={filteredBlogs   as unknown as Record<string, unknown>[]} />}
        {tab === "courses" && <DataTable columns={courseColumns} data={filteredCourses as unknown as Record<string, unknown>[]} />}
      </div>

      {/* Delete confirm modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} variant="center"
        title="Xoá bài viết?" subtitle="Hành động này không thể hoàn tác."
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setDeleteModal(null)}>Huỷ</Button>
            <Button variant="filled" color="error" size="lg" fullWidth onClick={() => { setBlogs(prev => prev.filter(b => b.slug !== deleteModal)); setDeleteModal(null); }}>Xoá</Button>
          </div>
        }
      />

      {/* New blog modal */}
      <Modal open={newBlogModal} onClose={() => setNewBlogModal(false)} variant="sheet" title="Tạo bài viết mới"
        footer={<Button variant="filled" color="dark" size="lg" fullWidth loading={loading} onClick={handleCreateBlog}>Tạo bài viết</Button>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Tiêu đề" placeholder="Nhập tiêu đề bài viết..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <Input label="Danh mục" placeholder="VD: Market, DeFi, Tutorial" value={newCat} onChange={e => setNewCat(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
