"use client";
/**
 * /referral — Referral & MLM Commission Tree
 * Shows referral code, F1/F2/F3 tree, commission history, claim button
 */
import React, { useState } from "react";
import {
  Button, Text, Badge, ListItem,
  toast, CheckCircle, Users, Copy, Share,
  Gift, ArrowRight, TrendUp,
} from "@vnkrvietnam/ui-kit";

const REFERRAL_CODE = "VNKR8A4F";
const REFERRAL_LINK = `https://app.vnkr.vn/register?ref=${REFERRAL_CODE}`;

const TREE_DATA = {
  f1: [
    { userId: "u001", name: "Trần Thị B",  level: 1 as const, joinedAt: "01/03/2024", volume: "5.000.000đ",  commission: "50.000đ",  color: "#AF96FB", initials: "TB" },
    { userId: "u002", name: "Lê Minh C",   level: 1 as const, joinedAt: "15/04/2024", volume: "2.000.000đ",  commission: "20.000đ",  color: "#49DBC8", initials: "LC" },
    { userId: "u003", name: "Hoàng Thị D", level: 1 as const, joinedAt: "01/05/2024", volume: "8.500.000đ",  commission: "85.000đ",  color: "#FC7339", initials: "HD" },
  ],
  f2: [
    { userId: "u004", name: "Ngô Văn E",   level: 2 as const, joinedAt: "20/04/2024", volume: "1.200.000đ",  commission: "6.000đ",   color: "#FD9FDD", initials: "NE" },
    { userId: "u005", name: "Bùi Thị F",   level: 2 as const, joinedAt: "10/05/2024", volume: "3.400.000đ",  commission: "17.000đ",  color: "#BEFF6C", initials: "BF" },
  ],
  f3: [],
};

const COMMISSION_HISTORY = [
  { id: "c1", from: "Trần Thị B",  amount: "+50.000đ",  type: "F1", date: "27/06/2024", source: "TRADE" },
  { id: "c2", from: "Lê Minh C",   amount: "+20.000đ",  type: "F1", date: "25/06/2024", source: "SWAP"  },
  { id: "c3", from: "Ngô Văn E",   amount: "+6.000đ",   type: "F2", date: "22/06/2024", source: "TRADE" },
  { id: "c4", from: "Hoàng Thị D", amount: "+85.000đ",  type: "F1", date: "20/06/2024", source: "DEPOSIT" },
];

const LEVEL_COLORS: Record<number, string> = { 1: "#00D68F", 2: "#FFAA00", 3: "#AF96FB" };

export default function ReferralPage() {
  const [tab, setTab] = useState<"overview" | "tree" | "history">("overview");
  const [claimLoading, setClaimLoading] = useState(false);

  const totalEarned      = 178_000;
  const claimableBalance = 156_000;

  const copyCode = () => {
    navigator.clipboard.writeText(REFERRAL_LINK).then(() => toast.success("Đã sao chép link giới thiệu!"));
  };

  const handleClaim = async () => {
    setClaimLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setClaimLoading(false);
    toast.success(`Đã chuyển ${claimableBalance.toLocaleString("vi-VN")}đ về ví chính!`);
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Gift size={22} color="#1A1F36" />
          <div>
            <Text variant="h6" weight="semibold" color="#1A1F36">Giới thiệu & Hoa hồng</Text>
            <Text variant="caption" color="#A0AEC0">Referral Program — F1, F2, F3</Text>
          </div>
        </div>
      </div>

      {/* Stats card */}
      <div style={{ margin: "0 16px 16px", background: "#000", borderRadius: 20, padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <Text variant="caption" color="rgba(255,255,255,0.5)">Tổng đã nhận</Text>
            <Text variant="h5" weight="semibold" color="#BEFF6C">{totalEarned.toLocaleString("vi-VN")}đ</Text>
          </div>
          <Badge variant="label" color="greeny" label="SILVER" />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px" }}>
            <Text variant="caption" color="rgba(255,255,255,0.4)">F1 trực tiếp</Text>
            <Text variant="subtitle1" weight="semibold" color="#fff">{TREE_DATA.f1.length}</Text>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "8px 12px" }}>
            <Text variant="caption" color="rgba(255,255,255,0.4)">Có thể rút</Text>
            <Text variant="subtitle1" weight="semibold" color="#BEFF6C">{claimableBalance.toLocaleString("vi-VN")}đ</Text>
          </div>
        </div>
        <Button variant="filled" color="success" size="md" fullWidth loading={claimLoading} onClick={handleClaim}>
          Nhận hoa hồng về ví
        </Button>
      </div>

      {/* Referral code */}
      <div style={{ margin: "0 16px 16px", background: "#F5F6FA", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Text variant="caption" color="#A0AEC0">Mã giới thiệu của bạn</Text>
          <Text variant="subtitle1" weight="semibold" color="#1A1F36" style={{ fontFamily: "monospace", letterSpacing: 3 }}>{REFERRAL_CODE}</Text>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outlined" color="dark" size="sm" iconLeft={<Copy size={14} />} onClick={copyCode}>Sao chép</Button>
          <Button variant="filled" color="dark" size="sm" iconLeft={<Share size={14} />} onClick={copyCode}>Chia sẻ</Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ padding: "0 16px 12px" }}>
        <div style={{ display: "flex", background: "#F5F6FA", borderRadius: 12, padding: 3 }}>
          {[{ id: "overview", label: "Tổng quan" }, { id: "tree", label: "Cây F1-F3" }, { id: "history", label: "Lịch sử" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)} style={{
              flex: 1, height: 34, borderRadius: 9, border: "none",
              background: tab === t.id ? "#000" : "transparent",
              color: tab === t.id ? "#fff" : "#718096",
              fontSize: 12, fontWeight: tab === t.id ? 700 : 400, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Hoa hồng theo cấp</Text>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { level: "F1", rate: "1%",   desc: "Từ giao dịch của tuyến trực tiếp",   color: "#00D68F" },
                { level: "F2", rate: "0.5%", desc: "Từ giao dịch của tuyến cấp 2",       color: "#FFAA00" },
                { level: "F3", rate: "0.2%", desc: "Từ giao dịch của tuyến cấp 3",       color: "#AF96FB" },
              ].map(r => (
                <div key={r.level} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: r.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Text variant="caption" weight="semibold" color={r.color}>{r.level}</Text>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text variant="body2" weight="semibold" color="#1A1F36">{r.rate} hoa hồng</Text>
                    <Text variant="caption" color="#A0AEC0">{r.desc}</Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendUp size={14} color={r.color} />
                    <Text variant="caption" color={r.color} weight="semibold">{r.rate}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "tree" && (
        <div style={{ padding: "0 16px" }}>
          {(["f1", "f2"] as const).map(tier => (
            <div key={tier} style={{ marginBottom: 16 }}>
              <Text variant="caption" weight="semibold" color="#A0AEC0" style={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", padding: "0 0 8px" }}>
                Tuyến {tier.toUpperCase()} · {TREE_DATA[tier].length} người
              </Text>
              <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                {TREE_DATA[tier].length === 0 ? (
                  <div style={{ padding: "16px 0", textAlign: "center" }}>
                    <Text variant="body2" color="#A0AEC0">Chưa có tuyến {tier.toUpperCase()}</Text>
                  </div>
                ) : TREE_DATA[tier].map((node, i) => (
                  <ListItem
                    key={node.userId}
                    title={node.name}
                    subtitle={`Tham gia ${node.joinedAt} · Vol: ${node.volume}`}
                    avatar={{ initials: node.initials, bg: node.color }}
                    divider={i < TREE_DATA[tier].length - 1}
                    rightSlot={
                      <div style={{ textAlign: "right" }}>
                        <Text variant="body2" weight="semibold" color="#00D68F">{node.commission}</Text>
                        <Badge variant="label" color={node.level === 1 ? "success" : node.level === 2 ? "warning" : "info"} label={`F${node.level}`} />
                      </div>
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div style={{ margin: "0 16px" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {COMMISSION_HISTORY.map((h, i) => (
              <ListItem
                key={h.id}
                title={h.from}
                subtitle={`${h.source} · ${h.date}`}
                amount={h.amount}
                amountColor="#00D68F"
                avatar={{ initials: h.from.slice(0, 2), bg: LEVEL_COLORS[parseInt(h.type[1])] }}
                divider={i < COMMISSION_HISTORY.length - 1}
                rightSlot={
                  <div style={{ textAlign: "right" }}>
                    <Text variant="body2" weight="semibold" color="#00D68F">{h.amount}</Text>
                    <Badge variant="label" color={h.type === "F1" ? "success" : "warning"} label={h.type} />
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
