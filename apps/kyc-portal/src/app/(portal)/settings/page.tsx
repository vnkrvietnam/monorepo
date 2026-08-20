"use client";

import React, { useState } from "react";
import { Input, Button, Toggle, Badge, toast } from "@vnkrvietnam/ui-kit";

interface SettingSection {
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingCard({ title, description, children }: SettingSection) {
  return (
    <div
      style={{
        background: "#FFF",
        borderRadius: 14,
        border: "1px solid #F3F4F6",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        padding: "24px",
        marginBottom: 20,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1F36", margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 13, color: "#8F9BB3", marginTop: 4, marginBottom: 0 }}>{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(true);
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);
  const [pendingThreshold, setPendingThreshold] = useState("20");
  const [rejectionRateAlert, setRejectionRateAlert] = useState("10");

  const handleSave = () => {
    toast.success("Cài đặt đã được lưu thành công");
  };

  return (
    <div style={{ padding: 24, fontFamily: "'Work Sans', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1F36", margin: 0 }}>Cài đặt Hệ thống</h1>
        <p style={{ fontSize: 14, color: "#8F9BB3", marginTop: 4 }}>Cấu hình tham số vận hành KYC Portal</p>
      </div>

      <SettingCard
        title="Bảo mật & Xác thực"
        description="Cài đặt Rate Limit, 2FA và phiên đăng nhập"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F36" }}>Rate Limiting</div>
              <div style={{ fontSize: 12, color: "#8F9BB3" }}>Giới hạn 100 req/phút cho API xác minh</div>
            </div>
            <Toggle
              checked={rateLimitEnabled}
              onChange={() => setRateLimitEnabled((v) => !v)}
              color="success"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F36" }}>Xác thực 2 bước (2FA)</div>
              <div style={{ fontSize: 12, color: "#8F9BB3" }}>Bắt buộc với tất cả tài khoản Operator</div>
            </div>
            <Toggle
              checked={twoFaEnabled}
              onChange={() => setTwoFaEnabled((v) => !v)}
              color="success"
            />
          </div>
        </div>
      </SettingCard>

      <SettingCard
        title="Thông báo & Cảnh báo"
        description="Cấu hình ngưỡng cảnh báo và kênh thông báo"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F36" }}>Email Notifications</div>
              <div style={{ fontSize: 12, color: "#8F9BB3" }}>Gửi email khi có hồ sơ chờ duyệt quá ngưỡng</div>
            </div>
            <Toggle
              checked={emailNotifEnabled}
              onChange={() => setEmailNotifEnabled((v) => !v)}
              color="success"
            />
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: "#4A5568", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Ngưỡng cảnh báo Pending (số hồ sơ)
              </label>
              <Input
                type="number"
                value={pendingThreshold}
                onChange={(e) => setPendingThreshold(e.target.value)}
                size="sm"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: "#4A5568", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Ngưỡng cảnh báo Rejection Rate (%)
              </label>
              <Input
                type="number"
                value={rejectionRateAlert}
                onChange={(e) => setRejectionRateAlert(e.target.value)}
                size="sm"
              />
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard
        title="Thông tin Hệ thống"
        description="Phiên bản phần mềm và cấu hình môi trường"
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { label: "Phiên bản Portal",  value: "v0.1.0" },
            { label: "Môi trường",         value: process.env.NODE_ENV ?? "development" },
            { label: "KYC Engine",         value: "VNeID v2.0" },
            { label: "ZKP Scheme",         value: "Semaphore v3.0" },
          ].map((item) => (
            <div key={item.label} style={{ padding: "12px 16px", background: "#F7F8FA", borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: "#8F9BB3", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F36" }}>
                <Badge variant="label" color="dark" label={item.value} />
              </div>
            </div>
          ))}
        </div>
      </SettingCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button variant="outlined" color="dark" onClick={() => toast.info("Đã huỷ thay đổi")}>Huỷ</Button>
        <Button variant="primary" color="success" onClick={handleSave}>Lưu thay đổi</Button>
      </div>
    </div>
  );
}
