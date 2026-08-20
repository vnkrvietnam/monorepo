"use client";
/**
 * /orders — Orders List
 * Full DataTable with search, select, modal detail
 */
import React, { useState } from "react";
import {
  Text,
  Button,
  Badge,
  DataTable,
  Modal,
  ArrowExport,
  Plus,
} from "@vnkrvietnam/ui-kit";
import type { DataTableColumn } from "@vnkrvietnam/ui-kit";
import type { MerchantOrderResponse } from "@vnkrvietnam/types";

// ─── Extended order row ───────────────────────────────────────────────────────

interface OrderRow extends Record<string, unknown> {
  orderId:    string;
  merchant:   string;
  amount:     number;
  currency:   string;
  status:     MerchantOrderResponse["status"];
  paymentUrl: string;
  expiresAt:  string;
  createdAt:  string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const ORDERS: OrderRow[] = [
  { orderId: "ORD-0081", merchant: "Cửa hàng ABC",    amount: 450000,  currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0081", expiresAt: "2025-06-18 15:32", createdAt: "2025-06-18 14:32" },
  { orderId: "ORD-0080", merchant: "Cửa hàng ABC",    amount: 1200000, currency: "VND", status: "PENDING", paymentUrl: "https://pay.vnkr.vn/ORD-0080", expiresAt: "2025-06-18 15:18", createdAt: "2025-06-18 14:18" },
  { orderId: "ORD-0079", merchant: "Shop Thời Trang",  amount: 89000,   currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0079", expiresAt: "2025-06-18 14:55", createdAt: "2025-06-18 13:55" },
  { orderId: "ORD-0078", merchant: "Cửa hàng ABC",    amount: 320000,  currency: "VND", status: "EXPIRED", paymentUrl: "https://pay.vnkr.vn/ORD-0078", expiresAt: "2025-06-18 14:10", createdAt: "2025-06-18 13:10" },
  { orderId: "ORD-0077", merchant: "Dịch vụ Online",  amount: 750000,  currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0077", expiresAt: "2025-06-18 13:44", createdAt: "2025-06-18 12:44" },
  { orderId: "ORD-0076", merchant: "Shop Thời Trang",  amount: 2100000, currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0076", expiresAt: "2025-06-18 12:30", createdAt: "2025-06-18 11:30" },
  { orderId: "ORD-0075", merchant: "Dịch vụ Online",  amount: 60000,   currency: "VND", status: "PENDING", paymentUrl: "https://pay.vnkr.vn/ORD-0075", expiresAt: "2025-06-18 12:05", createdAt: "2025-06-18 11:05" },
  { orderId: "ORD-0074", merchant: "Cửa hàng ABC",    amount: 980000,  currency: "VND", status: "EXPIRED", paymentUrl: "https://pay.vnkr.vn/ORD-0074", expiresAt: "2025-06-18 11:22", createdAt: "2025-06-18 10:22" },
  { orderId: "ORD-0073", merchant: "Shop Thời Trang",  amount: 340000,  currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0073", expiresAt: "2025-06-18 10:55", createdAt: "2025-06-18 09:55" },
  { orderId: "ORD-0072", merchant: "Dịch vụ Online",  amount: 1500000, currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0072", expiresAt: "2025-06-18 10:00", createdAt: "2025-06-18 09:00" },
  { orderId: "ORD-0071", merchant: "Cửa hàng ABC",    amount: 220000,  currency: "VND", status: "FAILED",  paymentUrl: "https://pay.vnkr.vn/ORD-0071", expiresAt: "2025-06-18 09:30", createdAt: "2025-06-18 08:30" },
  { orderId: "ORD-0070", merchant: "Shop Thời Trang",  amount: 890000,  currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0070", expiresAt: "2025-06-17 22:00", createdAt: "2025-06-17 21:00" },
  { orderId: "ORD-0069", merchant: "Dịch vụ Online",  amount: 450000,  currency: "VND", status: "PENDING", paymentUrl: "https://pay.vnkr.vn/ORD-0069", expiresAt: "2025-06-17 21:30", createdAt: "2025-06-17 20:30" },
  { orderId: "ORD-0068", merchant: "Cửa hàng ABC",    amount: 600000,  currency: "VND", status: "PAID",    paymentUrl: "https://pay.vnkr.vn/ORD-0068", expiresAt: "2025-06-17 20:00", createdAt: "2025-06-17 19:00" },
  { orderId: "ORD-0067", merchant: "Shop Thời Trang",  amount: 1350000, currency: "VND", status: "EXPIRED", paymentUrl: "https://pay.vnkr.vn/ORD-0067", expiresAt: "2025-06-17 18:30", createdAt: "2025-06-17 17:30" },
];

const STATUS_BADGE: Record<MerchantOrderResponse["status"], { color: "success" | "warning" | "error" | "info"; label: string }> = {
  PAID:    { color: "success", label: "PAID"    },
  PENDING: { color: "warning", label: "PENDING" },
  EXPIRED: { color: "error",   label: "EXPIRED" },
  FAILED:  { color: "error",   label: "FAILED"  },
};

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: DataTableColumn<OrderRow>[] = [
  {
    key:   "orderId",
    label: "ID",
    width: 110,
    render: (v) => (
      <span style={{ fontFamily: "monospace", fontSize: 13, color: "#2E3A59", fontWeight: 600 }}>{v as string}</span>
    ),
  },
  {
    key:          "merchant",
    label:        "Merchant",
    hideOnMobile: true,
  },
  {
    key:     "amount",
    label:   "Amount",
    sortable: true,
    align:   "right",
    render:  (v) => (
      <span style={{ fontWeight: 600, color: "#1A1F36" }}>
        {(v as number).toLocaleString("vi-VN")}
      </span>
    ),
  },
  {
    key:   "currency",
    label: "Currency",
    align: "center",
    width: 80,
  },
  {
    key:   "status",
    label: "Status",
    align: "center",
    render: (v) => {
      const s = STATUS_BADGE[v as MerchantOrderResponse["status"]];
      return <Badge variant="label" color={s.color} label={s.label} />;
    },
  },
  {
    key:          "paymentUrl",
    label:        "Payment URL",
    hideOnMobile: true,
    render: (v) => {
      const url = v as string;
      return (
        <span style={{ fontSize: 12, color: "#0095FF", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
          {url.replace("https://pay.vnkr.vn/", "pay.vnkr.vn/")}
        </span>
      );
    },
  },
  {
    key:          "expiresAt",
    label:        "Expires",
    hideOnMobile: true,
    render: (v) => <span style={{ fontSize: 12, color: "#718096" }}>{v as string}</span>,
  },
  {
    key:   "createdAt",
    label: "Created",
    render: (v) => <span style={{ fontSize: 12, color: "#718096" }}>{v as string}</span>,
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [selectedKeys, setSelectedKeys]   = useState<string[]>([]);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Text variant="h5" weight="bold" color="#1A1F36">Orders</Text>
        <Text variant="body2" color="#718096">Danh sách tất cả đơn hàng thanh toán</Text>
      </div>

      {/* ── DataTable ─────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #F3F4F6", padding: "0 0 4px" }}>
        <DataTable<OrderRow>
          columns={COLUMNS}
          data={ORDERS}
          rowKey="orderId"
          searchable
          searchPlaceholder="Tìm theo Order ID, merchant..."
          selectable
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          pageSize={10}
          onRowClick={(row) => setSelectedOrder(row)}
          toolbarSlot={
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="outlined"
                color="dark"
                size="sm"
                iconLeft={<ArrowExport size={14} />}
                onClick={() => alert("Export CSV")}
              >
                Export
              </Button>
              <Button
                variant="filled"
                color="dark"
                size="sm"
                iconLeft={<Plus size={14} />}
                onClick={() => alert("Create Order")}
              >
                Create Order
              </Button>
            </div>
          }
        />
      </div>

      {/* ── Order detail modal ───────────────────────────────────────────── */}
      <Modal
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        variant="center"
        title={`Chi tiết đơn hàng`}
        subtitle={selectedOrder?.orderId}
        maxWidth={480}
      >
        {selectedOrder && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8 }}>
            {(
              [
                ["Order ID",    selectedOrder.orderId],
                ["Merchant",    selectedOrder.merchant],
                ["Amount",      `${selectedOrder.amount.toLocaleString("vi-VN")} ${selectedOrder.currency}`],
                ["Expires At",  selectedOrder.expiresAt],
                ["Created At",  selectedOrder.createdAt],
              ] as [string, string][]
            ).map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", paddingBottom: 10 }}>
                <Text variant="body2" color="#718096">{label}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36">{val}</Text>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 4 }}>
              <Text variant="body2" color="#718096">Status</Text>
              <Badge
                variant="label"
                color={STATUS_BADGE[selectedOrder.status].color}
                label={STATUS_BADGE[selectedOrder.status].label}
              />
            </div>
            <div style={{ paddingTop: 4 }}>
              <Text variant="caption" color="#718096">Payment URL</Text>
              <div style={{
                marginTop:    6,
                padding:      "10px 14px",
                background:   "#F5F6FA",
                borderRadius: 8,
                fontSize:     12,
                fontFamily:   "monospace",
                color:        "#0095FF",
                wordBreak:    "break-all",
              }}>
                {selectedOrder.paymentUrl}
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
