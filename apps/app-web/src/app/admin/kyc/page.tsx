"use client";
/**
 * /admin/kyc — eKYC Review Queue
 */
import React, { useState } from "react";
import {
  DataTable, Button, Text, Badge, Input, Modal,
  type DataTableColumn, Search, CheckCircle, XCircle,
} from "@vnkrvietnam/ui-kit";

interface KYCRow {
  userId:        string;
  fullName:      string;
  phone:         string;
  documentType:  string;
  submittedAt:   string;
  frontImageUrl: string;
  selfieImageUrl:string;
  status:        "PENDING" | "VERIFIED" | "REJECTED";
}

const MOCK_KYCS: KYCRow[] = [
  { userId: "u002", fullName: "Trần Thị B",   phone: "0912345678", documentType: "CCCD",     submittedAt: "20/06/2024", frontImageUrl: "https://placehold.co/200x130?text=CCCD+Front",   selfieImageUrl: "https://placehold.co/200x130?text=Selfie",   status: "PENDING" },
  { userId: "u005", fullName: "Phạm Quốc D",  phone: "0934567890", documentType: "PASSPORT", submittedAt: "22/06/2024", frontImageUrl: "https://placehold.co/200x130?text=Passport+Front", selfieImageUrl: "https://placehold.co/200x130?text=Selfie", status: "PENDING" },
  { userId: "u006", fullName: "Nguyễn Thị F", phone: "0956789012", documentType: "CCCD",     submittedAt: "25/06/2024", frontImageUrl: "https://placehold.co/200x130?text=CCCD+Front",   selfieImageUrl: "https://placehold.co/200x130?text=Selfie",   status: "VERIFIED" },
];

export default function AdminKYCPage() {
  const [records,  setRecords]  = useState<KYCRow[]>(MOCK_KYCS);
  const [search,   setSearch]   = useState("");
  const [viewModal, setViewModal] = useState<KYCRow | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [reason,   setReason]   = useState("");

  const filtered = records.filter(r =>
    r.fullName.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search)
  );

  const review = async (userId: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !reason.trim()) { alert("Vui lòng nhập lý do từ chối"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setRecords(prev => prev.map(r => r.userId === userId ? { ...r, status: action === "APPROVE" ? "VERIFIED" : "REJECTED" } : r));
    setLoading(false);
    setViewModal(null);
    setReason("");
  };

  const columns: DataTableColumn[] = [
    { key: "fullName",     label: "Họ tên",         render: v => <Text variant="body2" weight="semibold" color="#1A1F36">{(v as KYCRow).fullName}</Text> },
    { key: "phone",        label: "SĐT",             render: v => <Text variant="caption" color="#4A5568">{(v as KYCRow).phone}</Text> },
    { key: "documentType", label: "Loại giấy tờ",   render: v => <Badge variant="label" color="info" label={(v as KYCRow).documentType} /> },
    { key: "submittedAt",  label: "Nộp lúc",         render: v => <Text variant="caption" color="#A0AEC0">{(v as KYCRow).submittedAt}</Text> },
    { key: "status",       label: "Trạng thái",      render: v => <Badge variant="label" color={(v as KYCRow).status === "VERIFIED" ? "success" : (v as KYCRow).status === "REJECTED" ? "error" : "warning"} label={(v as KYCRow).status} /> },
    { key: "actions",      label: "Thao tác",        render: v => (v as KYCRow).status === "PENDING" ? (
      <Button variant="outlined" color="dark" size="sm" onClick={() => setViewModal(v as KYCRow)}>Xem hồ sơ</Button>
    ) : <Text variant="caption" color="#A0AEC0">Đã xử lý</Text> },
  ];

  return (
    <div style={{ padding: "24px 24px 40px" }}>
      <div style={{ marginBottom: 20 }}>
        <Text variant="h5" weight="semibold" color="#1A1F36">Duyệt hồ sơ eKYC</Text>
        <Text variant="caption" color="#A0AEC0">{records.filter(r => r.status === "PENDING").length} hồ sơ chờ duyệt</Text>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Input placeholder="Tìm tên, SĐT…" iconLeft={<Search size={16} />} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} />
      </div>

      {/* KYC review modal */}
      <Modal
        open={!!viewModal}
        onClose={() => { setViewModal(null); setReason(""); }}
        variant="sheet"
        title={`Hồ sơ KYC — ${viewModal?.fullName}`}
        subtitle={`${viewModal?.documentType} · Nộp lúc ${viewModal?.submittedAt}`}
        footer={
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="error" size="lg" fullWidth loading={loading}
              onClick={() => viewModal && review(viewModal.userId, "REJECT")}>
              <XCircle size={16} /> Từ chối
            </Button>
            <Button variant="filled" color="success" size="lg" fullWidth loading={loading}
              onClick={() => viewModal && review(viewModal.userId, "APPROVE")}>
              <CheckCircle size={16} /> Phê duyệt
            </Button>
          </div>
        }
      >
        {viewModal && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Text variant="caption" color="#A0AEC0">Giấy tờ</Text>
                <img src={viewModal.frontImageUrl}   alt="doc"    style={{ width: "100%", borderRadius: 8, marginTop: 4 }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text variant="caption" color="#A0AEC0">Selfie</Text>
                <img src={viewModal.selfieImageUrl}  alt="selfie" style={{ width: "100%", borderRadius: 8, marginTop: 4 }} />
              </div>
            </div>
            <Input label="Lý do từ chối (nếu từ chối)" placeholder="VD: Ảnh không rõ, Giấy tờ hết hạn..." value={reason} onChange={e => setReason(e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
