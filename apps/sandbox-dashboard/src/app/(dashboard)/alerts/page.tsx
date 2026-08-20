"use client";
/**
 * /alerts — Real-time Alert Log
 * Severity filter · DataTable with color-coded rows · auto-refresh counter
 */
import React, { useState, useEffect } from "react";
import {
  DataTable,
  Badge,
  Button,
  Text,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
} from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";

type Severity = "ALL" | "CRITICAL" | "WARNING" | "INFO";
type AlertStatus = "OPEN" | "RESOLVED" | "INVESTIGATING";

interface AlertRow {
  id:          string;
  time:        string;
  type:        string;
  severity:    "CRITICAL" | "WARNING" | "INFO";
  description: string;
  address:     string;
  status:      AlertStatus;
}

const ALL_ALERTS: AlertRow[] = [
  { id:"A001", time:"14:32:05", type:"Volume Spike",        severity:"CRITICAL", description:"Transaction volume >320% hourly average",           address:"0x1a2b...3c4d", status:"INVESTIGATING" },
  { id:"A002", time:"14:28:11", type:"Blacklist Address",   severity:"CRITICAL", description:"Interaction with OFAC blacklisted wallet detected",  address:"0xDEAD...BEEF", status:"OPEN"          },
  { id:"A003", time:"13:55:42", type:"Failed Tx Rate",      severity:"WARNING",  description:"Failed tx rate reached 4.8% (threshold: 5%)",        address:"System",        status:"OPEN"          },
  { id:"A004", time:"13:40:18", type:"High Gas Usage",      severity:"WARNING",  description:"Abnormal gas consumption spike detected",             address:"0x9f8e...7d6c", status:"RESOLVED"      },
  { id:"A005", time:"13:12:33", type:"New Contract Deploy",  severity:"INFO",     description:"Unregistered smart contract deployed in sandbox",     address:"0x5b4a...3c2d", status:"RESOLVED"      },
  { id:"A006", time:"12:58:07", type:"P2P Volume Spike",    severity:"WARNING",  description:"P2P order volume 180% of daily average",              address:"System",        status:"OPEN"          },
  { id:"A007", time:"12:44:55", type:"KYC Anomaly",         severity:"INFO",     description:"Unusual KYC submission rate from single IP",          address:"103.x.x.x",     status:"RESOLVED"      },
  { id:"A008", time:"11:30:22", type:"Reserve Ratio Drop",  severity:"WARNING",  description:"Backing ratio dropped to 9.2% (min: 10%)",            address:"TreasuryVault", status:"INVESTIGATING" },
  { id:"A009", time:"10:15:09", type:"API Rate Limit",      severity:"INFO",     description:"Merchant API rate limit exceeded 3 times in 1 hour",  address:"merchant_id_42",status:"RESOLVED"      },
  { id:"A010", time:"09:02:44", type:"Tx Dispute Spike",    severity:"WARNING",  description:"Dispute rate 0.048% approaching 0.05% threshold",     address:"System",        status:"OPEN"          },
];

const SEV_COLOR = {
  CRITICAL: { color: "error"   as const, label: "CRITICAL" },
  WARNING:  { color: "warning" as const, label: "WARNING"  },
  INFO:     { color: "info"    as const, label: "INFO"      },
};

const STATUS_COLOR = {
  OPEN:          { color: "error"   as const, label: "Mở"         },
  INVESTIGATING: { color: "warning" as const, label: "Điều tra"   },
  RESOLVED:      { color: "success" as const, label: "Đã xử lý"   },
};

const COLS: DataTableColumn<AlertRow>[] = [
  { key: "time",        label: "Thời gian", width: 90  },
  { key: "type",        label: "Loại",      width: 170, sortable: true },
  {
    key: "severity", label: "Mức độ",
    render: (v) => {
      const s = SEV_COLOR[v as keyof typeof SEV_COLOR];
      return <Badge variant="label" color={s.color} label={s.label} />;
    },
  },
  { key: "description", label: "Mô tả",     sortable: false },
  { key: "address",     label: "Địa chỉ / ID", width: 130, hideOnMobile: true,
    render: (v) => (
      <code style={{ fontSize: 11, color: "#BEFF6C", fontFamily: "monospace" }}>{String(v)}</code>
    ),
  },
  {
    key: "status", label: "Trạng thái",
    render: (v) => {
      const s = STATUS_COLOR[v as keyof typeof STATUS_COLOR];
      return <Badge variant="label" color={s.color} label={s.label} />;
    },
  },
];

export default function AlertsPage() {
  const [filter,    setFilter]    = useState<Severity>("ALL");
  const [lastSecs,  setLastSecs]  = useState(0);

  // Simulate auto-refresh counter
  useEffect(() => {
    const id = setInterval(() => setLastSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = filter === "ALL"
    ? ALL_ALERTS
    : ALL_ALERTS.filter(a => a.severity === filter);

  const FILTER_BTNS: { id: Severity; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "ALL",      label: "Tất cả",  icon: <Info size={14} />,          count: ALL_ALERTS.length },
    { id: "CRITICAL", label: "Critical",icon: <AlertTriangle size={14} />, count: ALL_ALERTS.filter(a => a.severity === "CRITICAL").length },
    { id: "WARNING",  label: "Warning", icon: <AlertCircle size={14} />,   count: ALL_ALERTS.filter(a => a.severity === "WARNING").length  },
    { id: "INFO",     label: "Info",    icon: <CheckCircle size={14} />,   count: ALL_ALERTS.filter(a => a.severity === "INFO").length     },
  ];

  return (
    <div style={{ padding: "0 24px 32px" }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <Text variant="subtitle2" weight="semibold" color="#E6EDF3">
          Real-time Alert Log
        </Text>
        <Text variant="caption" color="#8B949E">
          Cập nhật {lastSecs}s trước
          {lastSecs < 30 && (
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%",
              background: "#00D68F", marginLeft: 6, verticalAlign: "middle" }} />
          )}
        </Text>
      </div>

      {/* ── Severity filter ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTER_BTNS.map(btn => (
          <Button
            key={btn.id}
            variant={filter === btn.id ? "filled" : "outlined"}
            color={filter === btn.id
              ? (btn.id === "CRITICAL" ? "error" : btn.id === "WARNING" ? "warning" : btn.id === "INFO" ? "info" : "dark")
              : "grey"
            }
            size="sm"
            iconLeft={btn.icon}
            onClick={() => setFilter(btn.id)}
          >
            {btn.label} ({btn.count})
          </Button>
        ))}
      </div>

      {/* ── Alert table ──────────────────────────────────────────────────── */}
      <DataTable<AlertRow>
        columns={COLS}
        data={filtered}
        rowKey="id"
        searchable
        searchPlaceholder="Tìm kiếm alert..."
        pageSize={10}
        caption=""
        style={{ background: "#161B22", borderColor: "#30363D" }}
        emptySlot={
          <div style={{ color: "#8B949E", fontFamily: "'Work Sans', sans-serif" }}>
            Không có cảnh báo
          </div>
        }
      />
    </div>
  );
}
