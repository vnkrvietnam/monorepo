"use client";
/**
 * /learn — Fintech/Crypto Learning CMS
 * Course listing, progress tracking, certificates
 */
import React, { useState } from "react";
import {
  Button, Text, Badge, ListItem,
  BookOpen, Play, CheckCircle, ArrowRight,
} from "@vnkrvietnam/ui-kit";

interface Course {
  courseId: string;
  title:    string;
  level:    "BEGINNER" | "INTERMEDIATE" | "PRO";
  category: string;
  lessons:  number;
  minutes:  number;
  progress: number; // 0-100
  color:    string;
  initials: string;
}

const COURSES: Course[] = [
  { courseId: "C001", title: "Bitcoin & Blockchain Cơ Bản",   level: "BEGINNER",     category: "Crypto",  lessons: 8,  minutes: 120, progress: 75, color: "#FC7339", initials: "BT" },
  { courseId: "C002", title: "DeFi Nâng Cao — Yield Farming", level: "INTERMEDIATE", category: "DeFi",    lessons: 12, minutes: 240, progress: 25, color: "#AF96FB", initials: "DF" },
  { courseId: "C003", title: "Trading Kỹ Thuật Chuyên Sâu",   level: "PRO",          category: "Trading", lessons: 20, minutes: 480, progress: 0,  color: "#49DBC8", initials: "TK" },
  { courseId: "C004", title: "Thanh Toán Số & Quy Định VN",   level: "BEGINNER",     category: "Fintech", lessons: 6,  minutes: 90,  progress: 100, color: "#00D68F", initials: "TP" },
];

const LEVEL_COLOR: Record<string, "info" | "warning" | "error"> = {
  BEGINNER: "info", INTERMEDIATE: "warning", PRO: "error",
};
const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Cơ bản", INTERMEDIATE: "Trung cấp", PRO: "Nâng cao",
};

export default function LearnPage() {
  const [filter, setFilter] = useState<"ALL" | "BEGINNER" | "INTERMEDIATE" | "PRO">("ALL");

  const filtered = COURSES.filter(c => filter === "ALL" || c.level === filter);

  const totalCompleted = COURSES.filter(c => c.progress === 100).length;

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <BookOpen size={22} color="#1A1F36" />
          <Text variant="h6" weight="semibold" color="#1A1F36">Học tập</Text>
        </div>
        <Text variant="caption" color="#A0AEC0">Nâng cao kiến thức Crypto & Fintech</Text>
      </div>

      {/* Progress summary */}
      <div style={{ margin: "0 16px 16px", background: "#000", borderRadius: 20, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <Text variant="caption" color="rgba(255,255,255,0.5)">Tiến độ học tập</Text>
            <Text variant="h5" weight="semibold" color="#BEFF6C">{totalCompleted}/{COURSES.length} khóa học</Text>
          </div>
          {totalCompleted > 0 && (
            <div style={{ background: "rgba(190,255,108,0.1)", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle size={16} color="#BEFF6C" />
              <Text variant="caption" color="#BEFF6C" weight="semibold">{totalCompleted} hoàn thành</Text>
            </div>
          )}
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 99, height: 6, overflow: "hidden" }}>
          <div style={{ width: `${(totalCompleted / COURSES.length) * 100}%`, background: "#BEFF6C", height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {(["ALL", "BEGINNER", "INTERMEDIATE", "PRO"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20,
              border: "none", cursor: "pointer",
              background: filter === f ? "#000" : "#F5F6FA",
              color: filter === f ? "#BEFF6C" : "#718096",
              fontSize: 12, fontWeight: 700, fontFamily: "'Work Sans', sans-serif",
            }}>
              {f === "ALL" ? "Tất cả" : LEVEL_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Course list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
        {filtered.map(course => (
          <div key={course.courseId} style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: 12, background: course.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Text variant="subtitle2" weight="semibold" color={course.color}>{course.initials}</Text>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text variant="subtitle2" weight="semibold" color="#1A1F36">{course.title}</Text>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Badge variant="label" color={LEVEL_COLOR[course.level]} label={LEVEL_LABEL[course.level]} />
                  <Text variant="caption" color="#A0AEC0">{course.lessons} bài · {course.minutes} phút</Text>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <Text variant="caption" color="#A0AEC0">Tiến độ</Text>
                <Text variant="caption" color="#1A1F36" weight="semibold">{course.progress}%</Text>
              </div>
              <div style={{ background: "#F3F4F6", borderRadius: 99, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${course.progress}%`, background: course.progress === 100 ? "#00D68F" : course.color, height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
            </div>
            <Button
              variant={course.progress === 100 ? "outlined" : "filled"}
              color="dark" size="sm" fullWidth
              iconLeft={course.progress === 100 ? <CheckCircle size={14} /> : <Play size={14} />}
              iconRight={course.progress === 0 ? <ArrowRight size={14} /> : undefined}
              onClick={() => window.location.href = `/learn/${course.courseId}`}
            >
              {course.progress === 100 ? "Xem chứng chỉ" : course.progress > 0 ? "Tiếp tục học" : "Bắt đầu học"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
