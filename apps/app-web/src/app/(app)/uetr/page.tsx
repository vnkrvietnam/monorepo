"use client";
/**
 * /uetr — UETR Payment Tracker
 * Theo dõi trạng thái điện thanh toán liên ngân hàng SWIFT gpi
 * ISO 20022 pain.001 / camt.053
 */
import React, { useState, useEffect } from "react";
import {
  Button, Text, Badge, Input,
  Search, CheckCircle, ArrowRight, Globe,
  Clock, AlertCircle,
} from "@vnkrvietnam/ui-kit";

interface TrackEvent {
  timestamp:   string;
  status:      string;
  agent:       string;
  country:     string;
  flag:        string;
  description: string;
  final?:      boolean;
}

const UETR_SAMPLE = "b916b5ce-8e7d-42f3-8e73-f5f17e2e9a0b";

const TRACK_EVENTS: TrackEvent[] = [
  {
    timestamp:   "2025-06-27 14:23:07 ICT",
    status:      "ACSP",
    agent:       "VCBVVNVX · Vietcombank",
    country:     "Vietnam",
    flag:        "🇻🇳",
    description: "Lệnh được chấp nhận và đang xử lý",
  },
  {
    timestamp:   "2025-06-27 09:15:22 GMT+1",
    status:      "ACSP",
    agent:       "DEUTDEDB · Deutsche Bank",
    country:     "Germany",
    flag:        "🇩🇪",
    description: "Ngân hàng trung gian nhận và chuyển tiếp",
  },
  {
    timestamp:   "2025-06-27 10:42:11 GMT+1",
    status:      "ACCC",
    agent:       "DEUTDEDB · Deutsche Bank",
    country:     "Germany",
    flag:        "🇩🇪",
    description: "Ghi có vào tài khoản thụ hưởng thành công",
    final:       true,
  },
];

const STATUS_LABELS: Record<string, { label: string; color: "success" | "info" | "warning" | "error" | "dark" }> = {
  ACSP: { label: "Đang xử lý", color: "info"    },
  ACCC: { label: "Hoàn tất",   color: "success" },
  RJCT: { label: "Từ chối",    color: "error"   },
  PDNG: { label: "Chờ duyệt",  color: "warning" },
};

const META = {
  uetr:      UETR_SAMPLE,
  msgId:     "VCB2025062700001",
  amount:    "1.500,00 USD",
  currency:  "USD",
  date:      "27/06/2025",
  sender:    "🇻🇳 Vietcombank · Nguyễn Văn A",
  receiver:  "🇩🇪 Deutsche Bank · JOHN DOE",
  purpose:   "Học phí",
  overall:   "ACCC",
};

export default function UETRPage() {
  const [query,    setQuery]    = useState(UETR_SAMPLE);
  const [loaded,   setLoaded]   = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [animIdx,  setAnimIdx]  = useState(0);

  // Animate timeline items appearing
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => {
      setAnimIdx(i => {
        if (i >= TRACK_EVENTS.length - 1) { clearInterval(id); return i; }
        return i + 1;
      });
    }, 600);
    return () => clearInterval(id);
  }, [loaded]);

  const doSearch = async () => {
    setLoading(true);
    setAnimIdx(0);
    setLoaded(false);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setLoaded(true);
  };

  const overallCfg = STATUS_LABELS[META.overall] ?? { label: META.overall, color: "dark" as const };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <Globe size={22} color="#1A1F36" />
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">UETR Tracker</Text>
          <Text variant="caption" color="#A0AEC0">SWIFT gpi · ISO 20022</Text>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Badge variant="label" color={overallCfg.color} label={overallCfg.label} />
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "8px 20px 16px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder="Nhập mã UETR…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            iconLeft={<Search size={16} />}
          />
        </div>
        <Button variant="filled" color="dark" size="md" loading={loading} onClick={doSearch}>
          Tra cứu
        </Button>
      </div>

      {loaded && (
        <>
          {/* Summary card */}
          <div style={{
            margin:     "0 16px 16px",
            background: "#000",
            borderRadius: 20,
            padding:    "18px 20px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <Text variant="caption" color="rgba(255,255,255,0.5)">Số tiền</Text>
                <Text variant="h4" weight="semibold" color="#BEFF6C">{META.amount}</Text>
              </div>
              <Badge variant="label" color={overallCfg.color} label={overallCfg.label} />
            </div>
            {[
              { label: "Người gửi",  value: META.sender   },
              { label: "Người nhận", value: META.receiver  },
              { label: "Ngày lệnh",  value: META.date      },
              { label: "Mục đích",   value: META.purpose   },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text variant="caption" color="rgba(255,255,255,0.5)">{r.label}</Text>
                <Text variant="caption" weight="semibold" color="rgba(255,255,255,0.9)">{r.value}</Text>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,255,255,0.07)", borderRadius: 8 }}>
              <Text variant="caption" color="rgba(255,255,255,0.4)" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                UETR: {META.uetr}
              </Text>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ padding: "0 20px 8px" }}>
            <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 16 }}>
              Hành trình thanh toán
            </Text>
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{
                position:   "absolute",
                left:       11,
                top:        12,
                bottom:     12,
                width:      2,
                background: "#E5E7EB",
              }} />

              {TRACK_EVENTS.map((ev, i) => {
                const cfg    = STATUS_LABELS[ev.status] ?? { label: ev.status, color: "dark" as const };
                const visible = i <= animIdx;
                return (
                  <div
                    key={i}
                    style={{
                      display:    "flex",
                      gap:        14,
                      marginBottom: i < TRACK_EVENTS.length - 1 ? 20 : 0,
                      opacity:    visible ? 1 : 0,
                      transform:  visible ? "translateX(0)" : "translateX(16px)",
                      transition: "opacity 0.4s, transform 0.4s",
                    }}
                  >
                    {/* Dot */}
                    <div style={{
                      width:        24, height: 24, borderRadius: "50%",
                      background:   ev.final ? "#00D68F" : "#000",
                      flexShrink:   0,
                      display:      "flex", alignItems: "center", justifyContent: "center",
                      zIndex:       1,
                    }}>
                      {ev.final
                        ? <CheckCircle size={12} color="#fff" />
                        : <Clock size={12} color="#BEFF6C" />
                      }
                    </div>

                    {/* Content */}
                    <div style={{
                      flex:         1,
                      background:   "#fff",
                      borderRadius: 12,
                      padding:      "12px 14px",
                      boxShadow:    "0 1px 3px rgba(0,0,0,0.06)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <Text variant="caption" weight="semibold" color="#1A1F36">
                            {ev.flag} {ev.agent}
                          </Text>
                          <Text variant="caption" color="#A0AEC0" style={{ display: "block" }}>{ev.timestamp}</Text>
                        </div>
                        <Badge variant="label" color={cfg.color} label={cfg.label} />
                      </div>
                      <Text variant="caption" color="#718096">{ev.description}</Text>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ISO 20022 info */}
          <div style={{ margin: "16px 20px 0", background: "#EFF6FF", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
            <AlertCircle size={18} color="#0095FF" style={{ flexShrink: 0 }} />
            <Text variant="caption" color="#1E40AF">
              Giao dịch này được xử lý theo chuẩn <strong>ISO 20022 pain.001</strong> và theo dõi qua <strong>SWIFT gpi Tracker</strong>. Mã trạng thái: ACCC = Accepted Credit Completed.
            </Text>
          </div>

          {/* Actions */}
          <div style={{ padding: "16px 20px 0", display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth
              onClick={() => window.location.href = "/receipt"}>
              Xem biên lai
            </Button>
            <Button variant="filled" color="dark" size="lg" fullWidth
              onClick={() => window.location.href = "/swift"}>
              Lệnh mới
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
