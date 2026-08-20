"use client";
/**
 * /crypto-deposit — On-chain Crypto Deposit
 * Features:
 *  - Network selector: TRC20, ERC20, BEP20, SOL
 *  - Wrong-network warning & MEMO requirement (e.g. for XLM, XRP)
 *  - Minimum deposit amount per network
 *  - Block confirmation counter (simulated)
 */
import React, { useState, useEffect } from "react";
import {
  Button, Text, Badge, Modal, Input,
  QRCodeModal, toast,
  AlertCircle, CheckCircle, Copy, ArrowDown,
} from "@vnkrvietnam/ui-kit";

interface NetworkConfig {
  id:            string;
  label:         string;
  token:         string;
  chain:         string;
  minDeposit:    number;
  minDepositStr: string;
  confirmations: number;     // required confirmations
  requiresMemo:  boolean;
  gasFee:        string;
  address:       string;
  color:         string;
}

const NETWORKS: NetworkConfig[] = [
  {
    id: "trc20", label: "TRC20", token: "USDT", chain: "TRON",
    minDeposit: 1, minDepositStr: "1 USDT",
    confirmations: 20, requiresMemo: false,
    gasFee: "1 TRX (~100đ)", color: "#FF0013",
    address: "TJj2EhH9WJFg3rHnUC9L6GNdRpCVXJQm7a",
  },
  {
    id: "erc20", label: "ERC20", token: "USDT", chain: "Ethereum",
    minDeposit: 10, minDepositStr: "10 USDT",
    confirmations: 12, requiresMemo: false,
    gasFee: "~$2–5 ETH Gas", color: "#627EEA",
    address: "0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b",
  },
  {
    id: "bep20", label: "BEP20 (BSC)", token: "USDT", chain: "BNB Smart Chain",
    minDeposit: 1, minDepositStr: "1 USDT",
    confirmations: 15, requiresMemo: false,
    gasFee: "~0.0001 BNB", color: "#F3BA2F",
    address: "0x9F3a5D2c1B8e6A4f7C0D3E2b1A9f8c7d6e5B4a3",
  },
  {
    id: "sol", label: "SOL / SPL", token: "USDC", chain: "Solana",
    minDeposit: 0.1, minDepositStr: "0.1 SOL / 1 USDC",
    confirmations: 32, requiresMemo: false,
    gasFee: "~0.000005 SOL", color: "#9945FF",
    address: "8ZXD7mWYHbZkTqXaJ3bZXkqb4NkHNkRFvPqwZJdH1ab",
  },
];

interface PendingDeposit {
  txHash:       string;
  network:      string;
  amount:       string;
  confirmations: number;
  required:     number;
  status:       "pending"|"confirmed";
}

const MOCK_PENDING: PendingDeposit = {
  txHash:       "0xabc123def456789abcdef0123456789abcdef0123",
  network:      "ERC20",
  amount:       "50 USDT",
  confirmations: 7,
  required:     12,
  status:       "pending",
};

export default function CryptoDepositPage() {
  const [tab,         setTab]         = useState<"deposit"|"withdraw">("deposit");
  const [network,     setNetwork]     = useState<NetworkConfig>(NETWORKS[0]);
  const [qrOpen,      setQrOpen]      = useState(false);
  const [wrongNetWarn, setWrongNetWarn] = useState(false);
  const [pending,     setPending]     = useState<PendingDeposit | null>(MOCK_PENDING);
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawAddr,setWithdrawAddr]= useState("");
  const [withdrawMemo,setWithdrawMemo]= useState("");
  const [withdrawStep, setWithdrawStep] = useState<"form"|"confirm"|"done">("form");
  const [loading,     setLoading]     = useState(false);
  const [copied,      setCopied]      = useState(false);

  // Simulate confirmation counter progressing
  useEffect(() => {
    if (!pending || pending.status === "confirmed") return;
    const t = setInterval(() => {
      setPending(p => {
        if (!p) return null;
        const next = Math.min(p.confirmations + 1, p.required);
        return { ...p, confirmations: next, status: next >= p.required ? "confirmed" : "pending" };
      });
    }, 3000);
    return () => clearInterval(t);
  }, [pending?.status]);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(network.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdrawSubmit = async () => {
    const amt = Number(withdrawAmt);
    if (amt < network.minDeposit) {
      toast.warning(`Số tiền tối thiểu: ${network.minDepositStr}`);
      return;
    }
    if (network.requiresMemo && !withdrawMemo.trim()) {
      toast.error("Vui lòng nhập MEMO/TAG để tránh mất tiền!");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setWithdrawStep("done");
  };

  const confPct = pending ? Math.round((pending.confirmations / pending.required) * 100) : 0;

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <ArrowDown size={22} color="#1A1F36" />
        <div>
          <Text variant="h6" weight="semibold" color="#1A1F36">Nạp / Rút Crypto</Text>
          <Text variant="caption" color="#A0AEC0">On-chain Deposit / Withdrawal</Text>
        </div>
      </div>

      {/* Tab */}
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ display: "flex", background: "#F5F6FA", borderRadius: 12, padding: 3 }}>
          {(["deposit", "withdraw"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: 36, borderRadius: 9, border: "none",
                background: tab === t ? "#000" : "transparent",
                color: tab === t ? "#fff" : "#718096",
                fontSize: 13, fontWeight: 700, fontFamily: "'Work Sans', sans-serif", cursor: "pointer",
              }}
            >
              {t === "deposit" ? "Nạp (Deposit)" : "Rút (Withdraw)"}
            </button>
          ))}
        </div>
      </div>

      {/* Network selector */}
      <div style={{ padding: "0 20px 16px" }}>
        <Text variant="caption" weight="semibold" color="#57606a" style={{ display: "block", marginBottom: 8 }}>Chọn mạng lưới</Text>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {NETWORKS.map(n => (
            <button
              key={n.id}
              onClick={() => { setNetwork(n); setWrongNetWarn(false); }}
              style={{
                flexShrink: 0, padding: "6px 14px", borderRadius: 10,
                border: `2px solid ${network.id === n.id ? n.color : "#E5E7EB"}`,
                background: network.id === n.id ? n.color + "22" : "#fff",
                cursor: "pointer",
              }}
            >
              <Text variant="caption" weight="semibold" color={network.id === n.id ? "#1A1F36" : "#718096"}>{n.label}</Text>
            </button>
          ))}
        </div>
      </div>

      {tab === "deposit" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Network info card */}
          <div style={{ background: "#000", borderRadius: 16, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <Text variant="caption" color="rgba(255,255,255,0.5)">Địa chỉ nạp — {network.label}</Text>
                <Text variant="caption" color="rgba(255,255,255,0.7)" style={{ display: "block", fontFamily: "monospace", wordBreak: "break-all", marginTop: 4 }}>
                  {network.address}
                </Text>
              </div>
              <button
                onClick={copyAddress}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", flexShrink: 0, marginLeft: 8 }}
              >
                {copied ? <CheckCircle size={16} color="#BEFF6C" /> : <Copy size={16} color="rgba(255,255,255,0.7)" />}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge variant="label" color="info" label={`Min: ${network.minDepositStr}`} />
              <Badge variant="label" color="dark" label={`${network.confirmations} xác nhận`} />
              <Badge variant="label" color="warning" label={`Phí gas: ${network.gasFee}`} />
            </div>
          </div>

          {/* Wrong network warning */}
          <div style={{ background: "#FFF1F2", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
            <AlertCircle size={18} color="#FF3D71" style={{ flexShrink: 0 }} />
            <div>
              <Text variant="caption" color="#FF3D71" weight="semibold">Quan trọng — Nạp đúng mạng</Text>
              <Text variant="caption" color="#FF3D71" style={{ display: "block" }}>
                Chỉ nạp <strong>{network.token}</strong> qua mạng <strong>{network.label}</strong>. Nạp sai mạng sẽ mất tiền vĩnh viễn.
              </Text>
            </div>
          </div>

          {/* MEMO warning if required */}
          {network.requiresMemo && (
            <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
              <AlertCircle size={18} color="#FFAA00" style={{ flexShrink: 0 }} />
              <Text variant="caption" color="#92400E">
                <strong>Bắt buộc điền MEMO/TAG</strong> khi gửi. Thiếu MEMO sẽ không nhận được tiền.
              </Text>
            </div>
          )}

          {/* Show QR */}
          <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => setQrOpen(true)}>
            Hiện QR Code để nạp
          </Button>

          {/* Pending confirmations */}
          {pending && (
            <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text variant="subtitle2" weight="semibold" color="#1A1F36">Giao dịch đang chờ</Text>
                <Badge variant="label" color={pending.status === "confirmed" ? "success" : "warning"} label={pending.status === "confirmed" ? "Đã xác nhận" : "Đang xác nhận"} />
              </div>
              <Text variant="caption" color="#A0AEC0">{pending.network} · {pending.amount}</Text>
              <Text variant="caption" color="#A0AEC0" style={{ display: "block", fontFamily: "monospace", marginTop: 4 }}>
                {pending.txHash.slice(0, 20)}...
              </Text>
              {/* Confirmation progress */}
              <div style={{ marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text variant="caption" color="#718096">Xác nhận: {pending.confirmations}/{pending.required}</Text>
                  <Text variant="caption" color="#718096">{confPct}%</Text>
                </div>
                <div style={{ height: 6, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${confPct}%`, height: "100%", background: pending.status === "confirmed" ? "#00D68F" : "#FFAA00", borderRadius: 99, transition: "width 0.5s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "withdraw" && withdrawStep === "form" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
            <AlertCircle size={18} color="#FFAA00" style={{ flexShrink: 0 }} />
            <Text variant="caption" color="#92400E">
              Rút qua mạng <strong>{network.label}</strong>. Kiểm tra kỹ địa chỉ và mạng trước khi xác nhận.
            </Text>
          </div>
          <Input
            label={`Số lượng ${network.token} rút`}
            placeholder={`Tối thiểu ${network.minDepositStr}`}
            type="number"
            value={withdrawAmt}
            onChange={e => setWithdrawAmt(e.target.value)}
            caption={`Min: ${network.minDepositStr} · Gas: ${network.gasFee}`}
          />
          <Input
            label="Địa chỉ ví nhận"
            placeholder={network.id === "sol" ? "Solana address (base58)" : "0x..."}
            value={withdrawAddr}
            onChange={e => setWithdrawAddr(e.target.value)}
          />
          {network.requiresMemo && (
            <Input
              label="MEMO / TAG (Bắt buộc)"
              placeholder="Nhập MEMO để tránh mất tiền"
              value={withdrawMemo}
              onChange={e => setWithdrawMemo(e.target.value)}
              caption="Bỏ trống MEMO sẽ khiến giao dịch thất bại"
              error={!withdrawMemo ? "Trường bắt buộc" : undefined}
            />
          )}
          <Button
            variant="filled" color="dark" size="lg" fullWidth
            disabled={!withdrawAmt || !withdrawAddr || (network.requiresMemo && !withdrawMemo)}
            onClick={() => setWithdrawStep("confirm")}
          >
            Xem lại lệnh rút
          </Button>
        </div>
      )}

      {tab === "withdraw" && withdrawStep === "confirm" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {[
              { label: "Mạng",        value: network.label },
              { label: "Token",       value: network.token },
              { label: "Số lượng",    value: `${withdrawAmt} ${network.token}` },
              { label: "Địa chỉ nhận",value: withdrawAddr },
              ...(network.requiresMemo ? [{ label: "MEMO", value: withdrawMemo }] : []),
              { label: "Phí gas",     value: network.gasFee },
              { label: "Xác nhận",    value: `${network.confirmations} blocks` },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                <Text variant="body2" color="#718096">{r.label}</Text>
                <Text variant="body2" weight="semibold" color="#1A1F36" style={{ maxWidth: "55%", textAlign: "right", wordBreak: "break-all" }}>{r.value}</Text>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="outlined" color="dark" size="lg" fullWidth onClick={() => setWithdrawStep("form")}>Quay lại</Button>
            <Button variant="filled" color="dark" size="lg" fullWidth loading={loading} onClick={handleWithdrawSubmit}>
              Xác nhận rút
            </Button>
          </div>
        </div>
      )}

      {tab === "withdraw" && withdrawStep === "done" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 24px", gap: 16 }}>
          <CheckCircle size={72} color="#00D68F" />
          <Text variant="h5" weight="semibold" color="#1A1F36">Lệnh rút đã gửi!</Text>
          <Text variant="body2" color="#718096">Đang xử lý trên mạng {network.label}. Thời gian xác nhận: {network.confirmations} blocks.</Text>
          <Button variant="filled" color="dark" size="lg" fullWidth onClick={() => { setWithdrawStep("form"); setWithdrawAmt(""); setWithdrawAddr(""); }}>
            Rút tiếp
          </Button>
        </div>
      )}

      {/* QR Code for deposit address */}
      <QRCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        value={network.address}
        label={`Địa chỉ nạp ${network.token} — ${network.label}`}
        subtitle={`Min: ${network.minDepositStr}`}
      />
    </div>
  );
}
