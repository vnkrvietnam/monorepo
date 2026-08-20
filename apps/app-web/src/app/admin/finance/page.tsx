"use client";
/**
 * /admin/finance — Pending withdrawal approvals
 */
import React, { useState } from "react";
import {
  DataTable, Button, Text, Badge, Modal,
  type DataTableColumn, CheckCircle, XCircle, AlertCircle,
} from "@vnkrvietnam/ui-kit";

interface WithdrawalRow {
  withdrawId: string;
  userId:     string;
  userName:   string;
  asset:      string;
  amount:     string;
  type:       "CRYPTO" | "FIAT";
  createdAt:  string;
  riskScore:  number;
  status:     "PENDING" | "APPROVED" | "REJECTED";
}

const MOCK_WITHDRAWALS: WithdrawalRow[] = [
  { withdrawId: "WC-001", userId: "u001", userName: "Nguyễn Văn A", asset: "BTC",  amount: "1.5 BTC",       type: "CRYPTO", createdAt: "27/06 10:00", riskScore: 15, status: "PENDING" },
  { withdrawId: "WF-002", userId: "u003", userName: "Lê Minh C",    asset: "VND",  amount: "200.000.000đ",  type: "FIAT",   createdAt: "27/06 11:30", riskScore: 55, status: "PENDING" },
  { withdrawId: "WC-003", userId: "u005", userName: "Hoàng Thị E",  asset: "ETH",  amount: "5.0 ETH",       type: "CRYPTO", createdAt: "27/06 12:00", riskScore: 8,  status: "PENDING" },
  { withdrawId: "WF-004", userId: "u002", userName: "Trần Thị B",   asset: "VND",  amount: "500.000.000đ",  type: "FIAT",   createdAt: "27/06 13:00", riskScore: 72, status: "PENDING" },
];

export default function AdminFinancePage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>(MOCK_WITHDRAWALS);
  const [actionModal, setActionModal] = useState<{ item: WithdrawalRow; action: "APPROVE" | "REJECT" } | null>(null);
  const [loading,     setLoading]     = useState(false);

  const handleApproval = async () => {
    if (!actionModal) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setWithdrawals(prev => prev.map(w => w.withdrawId === actionModal.item.withdrawId
      ? { ...w, status: actionModal.action === "APPROVE" ? "APPROVED" : "REJECTED" }
      : w
    ));
    setLoading(false);
    setActionModal(null);
  };

  const riskBadge = (score: number) =>
    score >= 70 ? <Badge variant="label" color="error"   label={`⚠ ${score}`} /> :
    score >= 40 ? <Badge variant="label" color="warning" label={`⚡ ${score}`} /> :
                  <Badge variant="label" color="success" label={`✓ ${score}`} />;

  const columns: DataTableColumn[] = [
    { key: "userName",   label: "Người dùng",  render: v => <Text variant="body2" weight="semibold" color="#1A1F36">{(v as WithdrawalRow).userName}</Text> },
    { key: "asset",      label: "Tài sản",     render: v => <Badge variant="label" color={(v as WithdrawalRow).type === "CRYPTO" ? "info" : "info"} label={(v as WithdrawalRow).asset} /> },
    { key: "amount",     label: "Số tiền",     render: v => <Text variant="body2" weight="semibold" color="#1A1F36">{(v as WithdrawalRow).amount}</Text> },
    { key: "riskScore",  label: "Risk Score",  render: v => riskBadge((v as WithdrawalRow).riskScore) },
    { key: "createdAt",  label: "Thời gian",   render: v => <Text variant="caption" color="#A0AEC0">{(v as WithdrawalRow).createdAt}</Text> },
    { key: "status",     label: "Trạng thái",  render: v => <Badge variant="label" color={(v as WithdrawalRow).status === "APPROVED" ? "success" : (v as WithdrawalRow).status === "REJECTED" ? "error" : "warning"} label={(v as WithdrawalRow).status} /> },
    {
      key: "actions", label: "Thao tác",
      render: v => (v as WithdrawalRow).status === "PENDING" ? (
        <div style={{ display: "flex", gap: 6 }}>
          <Button variant="outlined" color="success" size="sm" onClick={() => setActionModal({ item: v as WithdrawalRow, action: "APPROVE" })}>Duyệt</Button>
          <Button variant="outlined" color="error"   size="sm" onClick={() => setActionModal({ item: v as WithdrawalRow, action: "REJECT"  })}>Từ chối</Button>
        </div>
      ) : <Text variant="caption" color="#A0AEC0">Đã xử lý</Text>,
    },
  ];

  const pending = withdrawals.filter(w => w.status === "PENDING");

  return (
    <div style={{ padding: "24px 24px 40px" }}>
      <div style={{ marginBottom: 16 }}>
        <Text variant="h5" weight="semibold" color="#1A1F36">Quản lý lệnh rút tiền</Text>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <Badge variant="count" count={pending.length} color="warning" />
          <Text variant="caption" color="#A0AEC0">lệnh chờ phê duyệt</Text>
          {withdrawals.some(w => w.riskScore >= 70) && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#FFF1F2", borderRadius: 6, padding: "2px 8px" }}>
              <AlertCircle size={12} color="#FF3D71" />
              <Text variant="caption" color="#FF3D71">{withdrawals.filter(w => w.riskScore >= 70 && w.status === "PENDING").length} lệnh rủi ro cao!</Text>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <DataTable columns={columns} data={withdrawals as unknown as Record<string, unknown>[]} />
      </div>

      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        variant="center"
        title={actionModal?.action === "APPROVE" ? "Phê duyệt lệnh rút?" : "Từ chối lệnh rút?"}
        subtitle={`${actionModal?.item.userName} · ${actionModal?.item.amount}`}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setActionModal(null)}>Huỷ</Button>
            <Button variant="filled" color={actionModal?.action === "APPROVE" ? "success" : "error"} size="lg" fullWidth loading={loading} onClick={handleApproval}>
              {actionModal?.action === "APPROVE" ? <><CheckCircle size={16} /> Phê duyệt</> : <><XCircle size={16} /> Từ chối</>}
            </Button>
          </div>
        }
      />
    </div>
  );
}
