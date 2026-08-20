"use client";
/**
 * /admin/dashboard — System Metrics Overview
 */
import React, { useState, useEffect } from "react";
import {
  Text, Badge, LineChart, BarChart,
  Users, Wallet, ShieldCheck, Activity, TrendUp, TrendDown,
} from "@vnkrvietnam/ui-kit";
import type { ChartSeries } from "@vnkrvietnam/ui-kit";

const VOL_LABELS  = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const VOL_DATA    = [1.2, 1.8, 2.1, 1.5, 2.8, 3.2, 2.5].map(v => v * 1e9);
const USER_SERIES: ChartSeries[] = [
  { name: "Đăng ký mới", data: [45, 72, 38, 95, 61, 88, 54], color: "#AF96FB", area: true },
];

interface MetricCardProps { title: string; value: string; change: string; up: boolean; icon: React.ReactNode; bg: string; }

function MetricCard({ title, value, change, up, icon, bg }: MetricCardProps) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", flex: "1 1 140px", minWidth: 140, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <Text variant="caption" color="#A0AEC0" weight="semibold">{title}</Text>
      </div>
      <Text variant="h6" weight="semibold" color="#1A1F36">{value}</Text>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
        {up ? <TrendUp size={12} color="#00D68F" /> : <TrendDown size={12} color="#FF3D71" />}
        <Text variant="caption" color={up ? "#00D68F" : "#FF3D71"}>{change}</Text>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  if (loading) return <div style={{ padding: 32, textAlign: "center" }}><Text variant="body2" color="#A0AEC0">Đang tải dữ liệu...</Text></div>;

  return (
    <div style={{ padding: "24px 24px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <Text variant="h5" weight="semibold" color="#1A1F36">Dashboard Quản trị</Text>
        <Text variant="caption" color="#A0AEC0">Cập nhật: {new Date().toLocaleString("vi-VN")}</Text>
      </div>

      {/* Metric cards */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <MetricCard title="Tổng người dùng"    value="125.000"     change="+2.4% tháng này" up icon={<Users      size={18} color="#0095FF" />} bg="#EFF6FF" />
        <MetricCard title="Vol 24h (VND)"      value="2.5 tỷ"      change="+18.5% hôm qua"  up icon={<Activity   size={18} color="#00D68F" />} bg="#ECFDF5" />
        <MetricCard title="Doanh thu 24h"      value="12,5tr VND"  change="+5.2%"            up icon={<Wallet     size={18} color="#FFAA00" />} bg="#FFFBEB" />
        <MetricCard title="KYC chờ duyệt"      value="124"         change="-12 so hôm qua"  up icon={<ShieldCheck size={18} color="#AF96FB" />} bg="#F5F3FF" />
        <MetricCard title="Lệnh rút chờ duyệt" value="18"          change="+3"               up={false} icon={<Wallet size={18} color="#FF3D71" />} bg="#FFF1F2" />
      </div>

      {/* Volume chart */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16 }}>
        <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 12 }}>Khối lượng giao dịch 7 ngày</Text>
        <BarChart
          labels={VOL_LABELS}
          series={[{ name: "Volume (VND)", data: VOL_DATA, color: "#000" }]}
          height={200}
          grid
        />
      </div>

      {/* New users chart */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 12 }}>Đăng ký mới 7 ngày</Text>
        <LineChart labels={VOL_LABELS} series={USER_SERIES} height={160} grid />
      </div>
    </div>
  );
}
