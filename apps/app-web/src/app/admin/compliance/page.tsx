"use client";
/**
 * /admin/compliance — Compliance Reports (NQ-05 & NĐ-284)
 */
import React, { useState } from "react";
import {
  Button, Text, Badge, Input, ListItem,
  Activity, AlertCircle, CheckCircle, Download, FileText,
} from "@vnkrvietnam/ui-kit";

const RECENT_REPORTS = [
  { id: "RPT-001", type: "NQ-05",  period: "01/06 – 30/06/2024", generated: "27/06/2024", status: "READY",       url: "#" },
  { id: "RPT-002", type: "NĐ-284", period: "01/06 – 30/06/2024", generated: "27/06/2024", status: "READY",       url: "#" },
  { id: "RPT-003", type: "NQ-05",  period: "01/05 – 31/05/2024", generated: "01/06/2024", status: "ARCHIVED",    url: "#" },
];

const AML_FLAGS = [
  { txId: "TXN-9001", user: "Lê Minh C",    amount: "200.000.000đ", direction: "OUT", riskLevel: "HIGH",     flags: ["LARGE_OUTFLOW"], ts: "27/06 11:30" },
  { txId: "TXN-9002", user: "Trần Thị B",   amount: "500.000.000đ", direction: "OUT", riskLevel: "CRITICAL", flags: ["VERY_LARGE_TRANSACTION", "LARGE_OUTFLOW"], ts: "27/06 13:00" },
];

export default function AdminCompliancePage() {
  const [nq05From,   setNq05From]   = useState("");
  const [nq05To,     setNq05To]     = useState("");
  const [nq05Format, setNq05Format] = useState<"JSON" | "CSV" | "XML">("JSON");
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);

  const handleGenerate = async () => {
    if (!nq05From || !nq05To) { alert("Vui lòng chọn khoảng thời gian"); return; }
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setGenerating(false);
    setGenerated(true);
  };

  return (
    <div style={{ padding: "24px 24px 40px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Activity size={22} color="#1A1F36" />
          <Text variant="h5" weight="semibold" color="#1A1F36">Tuân thủ Pháp lý</Text>
        </div>
        <Text variant="caption" color="#A0AEC0">Nghị quyết 05/NQ-CP & Nghị định 284/2025/NĐ-CP</Text>
      </div>

      {/* NQ-05 Report generator */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16 }}>
        <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 12 }}>Xuất báo cáo NQ-05</Text>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Text variant="caption" color="#A0AEC0" style={{ display: "block", marginBottom: 4 }}>Từ ngày</Text>
            <Input type="date" value={nq05From} onChange={e => setNq05From(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <Text variant="caption" color="#A0AEC0" style={{ display: "block", marginBottom: 4 }}>Đến ngày</Text>
            <Input type="date" value={nq05To} onChange={e => setNq05To(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <Text variant="caption" color="#A0AEC0" style={{ display: "block", marginBottom: 4 }}>Định dạng</Text>
            <div style={{ display: "flex", gap: 4 }}>
              {(["JSON", "CSV", "XML"] as const).map(f => (
                <button key={f} onClick={() => setNq05Format(f)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${nq05Format === f ? "#000" : "#E5E7EB"}`,
                  background: nq05Format === f ? "#000" : "#fff", color: nq05Format === f ? "#BEFF6C" : "#4A5568",
                  fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Work Sans', sans-serif",
                }}>{f}</button>
              ))}
            </div>
          </div>
        </div>
        {generated && (
          <div style={{ background: "#ECFDF5", borderRadius: 10, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} color="#00D68F" />
            <Text variant="caption" color="#065F46" weight="semibold">Báo cáo đã được tạo và sẵn sàng tải về.</Text>
            <Button variant="ghost" color="success" size="sm" iconLeft={<Download size={14} />} style={{ marginLeft: "auto" }}>Tải về</Button>
          </div>
        )}
        <Button variant="filled" color="dark" size="md" fullWidth loading={generating} iconLeft={<FileText size={16} />} onClick={handleGenerate}>
          Tạo báo cáo NQ-05
        </Button>
      </div>

      {/* AML flagged transactions */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <AlertCircle size={18} color="#FF3D71" />
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">Giao dịch bị gắn cờ AML</Text>
          <Badge variant="count" count={AML_FLAGS.length} color="error" />
        </div>
        {AML_FLAGS.map((f, i) => (
          <div key={f.txId} style={{ padding: "10px 0", borderBottom: i < AML_FLAGS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Text variant="body2" weight="semibold" color="#1A1F36">{f.user}</Text>
              <Badge variant="label" color={f.riskLevel === "CRITICAL" ? "error" : "warning"} label={f.riskLevel} />
            </div>
            <Text variant="caption" color="#4A5568">{f.amount} · {f.direction} · {f.ts}</Text>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {f.flags.map(flag => <Badge key={flag} variant="label" color="error" label={flag} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Recent reports list */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "12px 0 4px" }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">Báo cáo gần đây</Text>
        </div>
        {RECENT_REPORTS.map((r, i) => (
          <ListItem
            key={r.id}
            title={`${r.type} · ${r.period}`}
            subtitle={`Tạo lúc ${r.generated}`}
            avatar={{ icon: <FileText size={16} color="#718096" />, iconBg: "#F5F6FA", size: 40 }}
            divider={i < RECENT_REPORTS.length - 1}
            rightSlot={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge variant="label" color={r.status === "READY" ? "success" : "info"} label={r.status} />
                <Button variant="ghost" color="dark" size="sm" iconLeft={<Download size={14} />} onClick={() => window.open(r.url)}>Tải</Button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
