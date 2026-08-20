"use client";
/**
 * /api-keys — API Key Manager
 * Cards with reveal/revoke, FormWizard create flow
 */
import React, { useState } from "react";
import {
  Text,
  Button,
  Badge,
  Modal,
  FormWizard,
  Input,
  Toggle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
} from "@vnkrvietnam/ui-kit";
import type { WizardStep } from "@vnkrvietnam/ui-kit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id:        string;
  name:      string;
  keyMasked: string;
  keyFull:   string;
  created:   string;
  lastUsed:  string;
  status:    "active" | "revoked";
  scopes:    string[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_KEYS: ApiKey[] = [
  {
    id:        "key-1",
    name:      "Production Key",
    keyMasked: "sk_live_••••••••••1234",
    keyFull:   "sk_live_axvn_xK9pL2mN3qR7sT4uV5wX6yZ1234",
    created:   "2025-05-01",
    lastUsed:  "2025-06-18 14:30",
    status:    "active",
    scopes:    ["Read", "Write"],
  },
  {
    id:        "key-2",
    name:      "Staging Key",
    keyMasked: "sk_live_••••••••••5678",
    keyFull:   "sk_live_axvn_aB8cD9eF0gH1iJ2kL3mN5678",
    created:   "2025-05-15",
    lastUsed:  "2025-06-17 09:12",
    status:    "active",
    scopes:    ["Read"],
  },
  {
    id:        "key-3",
    name:      "Old Integration",
    keyMasked: "sk_live_••••••••••9012",
    keyFull:   "sk_live_axvn_oP4qR5sT6uV7wX8yZ9aB9012",
    created:   "2025-03-10",
    lastUsed:  "2025-04-02 18:00",
    status:    "revoked",
    scopes:    ["Read", "Write"],
  },
];

// ─── Key Card ─────────────────────────────────────────────────────────────────

function ApiKeyCard({
  apiKey,
  onRevoke,
}: {
  apiKey:    ApiKey;
  onRevoke:  (id: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied,   setCopied]   = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.keyFull).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background:   "#fff",
      borderRadius: 14,
      border:       "1px solid #F3F4F6",
      padding:      "20px 22px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">{apiKey.name}</Text>
          <Badge
            variant="label"
            color={apiKey.status === "active" ? "success" : "error"}
            label={apiKey.status === "active" ? "ACTIVE" : "REVOKED"}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="ghost"
            color="dark"
            size="sm"
            iconLeft={revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            onClick={() => setRevealed(r => !r)}
            disabled={apiKey.status === "revoked"}
          >
            {revealed ? "Hide" : "Reveal"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="sm"
            onClick={() => onRevoke(apiKey.id)}
            disabled={apiKey.status === "revoked"}
          >
            Revoke
          </Button>
        </div>
      </div>

      {/* Key display */}
      <div style={{
        display:      "flex",
        alignItems:   "center",
        gap:          10,
        background:   "#F5F6FA",
        borderRadius: 8,
        padding:      "10px 14px",
        marginBottom: 14,
      }}>
        <code style={{
          flex:       1,
          fontSize:   13,
          fontFamily: "monospace",
          color:      apiKey.status === "revoked" ? "#A0AEC0" : "#1A1F36",
          wordBreak:  "break-all",
        }}>
          {revealed ? apiKey.keyFull : apiKey.keyMasked}
        </code>
        {revealed && apiKey.status === "active" && (
          <button
            onClick={handleCopy}
            aria-label="Copy key"
            style={{
              flexShrink:     0,
              background:     "none",
              border:         "none",
              cursor:         "pointer",
              color:          copied ? "#00D68F" : "#718096",
              padding:        4,
              display:        "flex",
              alignItems:     "center",
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}
      </div>

      {/* Scopes + meta */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {apiKey.scopes.map(scope => (
            <span key={scope} style={{
              background:   "#F5F6FA",
              border:       "1px solid #E5E7EB",
              borderRadius: 6,
              padding:      "2px 8px",
              fontSize:     11,
              fontWeight:   600,
              color:        "#4A5568",
              fontFamily:   "'Work Sans', sans-serif",
            }}>
              {scope}
            </span>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <Text variant="caption" color="#A0AEC0">Created {apiKey.created}</Text>
          <br />
          <Text variant="caption" color="#A0AEC0">Last used {apiKey.lastUsed}</Text>
        </div>
      </div>
    </div>
  );
}

// ─── Create Key Wizard content ────────────────────────────────────────────────

function Step1Content({
  keyName,
  setKeyName,
  canRead,
  setCanRead,
  canWrite,
  setCanWrite,
}: {
  keyName:    string;
  setKeyName: (v: string) => void;
  canRead:    boolean;
  setCanRead: (v: boolean) => void;
  canWrite:   boolean;
  setCanWrite:(v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 4 }}>
      <Input
        label="Key Name"
        placeholder="e.g. Production Integration"
        value={keyName}
        onChange={e => setKeyName(e.target.value)}
      />
      <div>
        <Text variant="body2" weight="medium" color="#2E3A59" style={{ marginBottom: 12 }}>Permissions</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Text variant="body2" weight="medium" color="#1A1F36">Read</Text>
              <Text variant="caption" color="#718096">View orders, transactions, analytics</Text>
            </div>
            <Toggle checked={canRead} onChange={setCanRead} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Text variant="body2" weight="medium" color="#1A1F36">Write</Text>
              <Text variant="caption" color="#718096">Create orders, manage webhooks</Text>
            </div>
            <Toggle checked={canWrite} onChange={setCanWrite} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Content({ generatedKey }: { generatedKey: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 4 }}>
      <div style={{
        background:   "#FFFBEB",
        borderRadius: 8,
        border:       "1px solid #FFAA00",
        padding:      "12px 14px",
        display:      "flex",
        gap:          10,
        alignItems:   "flex-start",
      }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <Text variant="body2" color="#92400E">
          <strong>Save this key now.</strong> For security reasons, it will not be shown again after you close this dialog.
        </Text>
      </div>
      <div style={{
        background:   "#F5F6FA",
        borderRadius: 8,
        padding:      "14px 16px",
        display:      "flex",
        alignItems:   "center",
        gap:          10,
      }}>
        <code style={{
          flex:      1,
          fontSize:  12,
          fontFamily:"monospace",
          color:     "#1A1F36",
          wordBreak: "break-all",
        }}>
          {generatedKey}
        </code>
        <button
          onClick={handleCopy}
          aria-label="Copy generated key"
          style={{
            flexShrink:     0,
            background:     copied ? "#00D68F" : "#000",
            border:         "none",
            borderRadius:   8,
            cursor:         "pointer",
            color:          "#fff",
            padding:        "6px 10px",
            display:        "flex",
            alignItems:     "center",
            gap:            4,
            fontSize:       12,
            fontFamily:     "'Work Sans', sans-serif",
            fontWeight:     600,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys,         setKeys]         = useState<ApiKey[]>(INITIAL_KEYS);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [keyName,      setKeyName]      = useState("");
  const [canRead,      setCanRead]      = useState(true);
  const [canWrite,     setCanWrite]     = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");

  const handleRevoke = (id: string) => {
    setKeys(ks => ks.map(k => k.id === id ? { ...k, status: "revoked" as const } : k));
  };

  const handleCreate = () => {
    const newKey = `sk_live_axvn_${Math.random().toString(36).slice(2, 14).padEnd(12, "0")}${Date.now().toString(36)}`;
    setGeneratedKey(newKey);
  };

  const wizardSteps: WizardStep[] = [
    {
      id:       "step-name",
      title:    "Key Details",
      subtitle: "Name your API key and select permissions",
      nextLabel:"Generate Key",
      onValidate: () => {
        if (!keyName.trim()) return "Please enter a key name";
        if (!canRead && !canWrite) return "Select at least one permission";
        handleCreate();
        return true;
      },
      content: (
        <Step1Content
          keyName={keyName}
          setKeyName={setKeyName}
          canRead={canRead}
          setCanRead={setCanRead}
          canWrite={canWrite}
          setCanWrite={setCanWrite}
        />
      ),
    },
    {
      id:       "step-copy",
      title:    "Your New API Key",
      subtitle: "Copy and store it securely — it won't be shown again",
      hideBack: true,
      nextLabel:"Done",
      content:  <Step2Content generatedKey={generatedKey} />,
    },
  ];

  const handleWizardComplete = () => {
    const scopes: string[] = [];
    if (canRead)  scopes.push("Read");
    if (canWrite) scopes.push("Write");
    const newKey: ApiKey = {
      id:        `key-${Date.now()}`,
      name:      keyName,
      keyMasked: `sk_live_••••••••••${generatedKey.slice(-4)}`,
      keyFull:   generatedKey,
      created:   new Date().toISOString().slice(0, 10),
      lastUsed:  "Never",
      status:    "active",
      scopes,
    };
    setKeys(ks => [newKey, ...ks]);
    setCreateOpen(false);
    setKeyName("");
    setCanRead(true);
    setCanWrite(false);
    setGeneratedKey("");
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>

      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Text variant="h5" weight="bold" color="#1A1F36">API Keys</Text>
          <Text variant="body2" color="#718096">Quản lý API keys tích hợp thanh toán</Text>
        </div>
        <Button
          variant="filled"
          color="dark"
          size="md"
          iconLeft={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          Create New Key
        </Button>
      </div>

      {/* ── Keys list ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {keys.map((k) => (
          <ApiKeyCard key={k.id} apiKey={k} onRevoke={handleRevoke} />
        ))}
      </div>

      {/* ── Create Key Modal ─────────────────────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setKeyName("");
          setCanRead(true);
          setCanWrite(false);
          setGeneratedKey("");
        }}
        variant="center"
        title="Create API Key"
        maxWidth={520}
      >
        <div style={{ paddingBottom: 8 }}>
          <FormWizard
            steps={wizardSteps}
            onComplete={handleWizardComplete}
            submitLabel="Done"
            card={false}
          />
        </div>
      </Modal>

    </div>
  );
}
