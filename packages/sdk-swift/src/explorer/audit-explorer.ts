import type { AuditLogEntry } from "../generators/iso20022-dto.js";
import crypto from "node:crypto";

/** Options for constructing the AuditExplorer */
export interface AuditExplorerOptions {
  /**
   * Optional external SIEM/audit endpoint (e.g. Splunk HEC, internal SOC).
   * If provided, audit entries will be forwarded via HTTP POST.
   */
  externalEndpoint?: string;
  /** Bearer token for the external audit endpoint */
  externalEndpointToken?: string;
  /**
   * Maximum number of entries to retain in the in-memory ring buffer.
   * Only applicable when no external store is configured.
   * Default: 10_000
   */
  maxInMemoryEntries?: number;
}

/**
 * AuditExplorer — Immutable Audit Log API for NQ-05 / NĐ-284 Compliance.
 *
 * Provides structured, tamper-evident logging for all SWIFT and on-chain
 * financial events processed by the VNKR ecosystem. Every entry is assigned
 * a deterministic `auditId` (SHA-256 of key fields) to enable deduplication
 * and chain-of-custody verification.
 *
 * Compliance references:
 *   NQ-05/NQ-CP — An toàn thông tin mạng trong hoạt động ngân hàng
 *   NĐ-284/2025/NĐ-CP — Bảo vệ dữ liệu tài chính cá nhân
 *
 * In production, replace the in-memory ring buffer with a time-series
 * database (TimescaleDB, Elasticsearch) and enable tamper-evident
 * signatures (e.g. HMAC-SHA256 chain).
 */
export class AuditExplorer {
  private readonly entries: AuditLogEntry[] = [];
  private readonly maxEntries: number;
  private readonly externalEndpoint?: string;
  private readonly externalToken?: string;

  constructor(options: AuditExplorerOptions = {}) {
    this.maxEntries = options.maxInMemoryEntries ?? 10_000;
    this.externalEndpoint = options.externalEndpoint;
    this.externalToken = options.externalEndpointToken;
  }

  // ─── Logging ────────────────────────────────────────────────────────────────

  /**
   * Record a new audit log entry.
   *
   * Generates a deterministic `auditId` and appends the entry.
   * If an `externalEndpoint` is configured, the entry is also forwarded
   * asynchronously (best-effort — does not block the caller).
   *
   * @returns The created `AuditLogEntry` with its generated `auditId`
   */
  log(
    entry: Omit<AuditLogEntry, "auditId" | "timestamp">
  ): AuditLogEntry {
    const timestamp = new Date().toISOString();
    const auditId = this._generateAuditId(entry, timestamp);

    const full: AuditLogEntry = { ...entry, auditId, timestamp };

    // Ring buffer — evict oldest when full
    if (this.entries.length >= this.maxEntries) {
      this.entries.shift();
    }
    this.entries.push(full);

    // Forward to external endpoint (non-blocking)
    if (this.externalEndpoint) {
      this._forwardExternal(full).catch((err) => {
        console.error(`[AuditExplorer] Failed to forward audit entry ${auditId}:`, err);
      });
    }

    return full;
  }

  // ─── Queries ────────────────────────────────────────────────────────────────

  /**
   * Look up an audit entry by its `auditId`.
   */
  getById(auditId: string): AuditLogEntry | undefined {
    return this.entries.find((e) => e.auditId === auditId);
  }

  /**
   * Query entries by SWIFT UETR.
   */
  getByUETR(uetr: string): AuditLogEntry[] {
    return this.entries.filter((e) => e.uetr === uetr);
  }

  /**
   * Query entries by internal VNKR transaction ID.
   */
  getByVNKRTxId(vnkrTxId: string): AuditLogEntry[] {
    return this.entries.filter((e) => e.vnkrTxId === vnkrTxId);
  }

  /**
   * Query entries by on-chain transaction hash.
   */
  getByOnChainTxHash(txHash: string): AuditLogEntry[] {
    return this.entries.filter((e) => e.onChainTxHash === txHash);
  }

  /**
   * Query entries by actor (BIC or user identifier).
   */
  getByActor(actor: string): AuditLogEntry[] {
    return this.entries.filter((e) => e.actor === actor);
  }

  /**
   * Query entries within a time range.
   *
   * @param from - ISO 8601 start time (inclusive)
   * @param to   - ISO 8601 end time (inclusive)
   */
  getByTimeRange(from: string, to: string): AuditLogEntry[] {
    return this.entries.filter(
      (e) => e.timestamp >= from && e.timestamp <= to
    );
  }

  /**
   * Query entries by outcome.
   */
  getByOutcome(outcome: AuditLogEntry["outcome"]): AuditLogEntry[] {
    return this.entries.filter((e) => e.outcome === outcome);
  }

  /**
   * Return all entries in chronological order.
   * Use `getByTimeRange` for paginated access in production.
   */
  getAll(): AuditLogEntry[] {
    return [...this.entries];
  }

  /**
   * Return the total number of entries in the log.
   */
  count(): number {
    return this.entries.length;
  }

  // ─── Compliance export ───────────────────────────────────────────────────────

  /**
   * Export all entries as a JSON string for regulatory submission.
   * Suitable for NĐ-284 data export requests.
   *
   * @param from - ISO 8601 start time filter (optional)
   * @param to   - ISO 8601 end time filter (optional)
   */
  exportJSON(from?: string, to?: string): string {
    const data = from && to ? this.getByTimeRange(from, to) : this.getAll();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        standard: "NĐ-284/2025/NĐ-CP",
        totalEntries: data.length,
        entries: data,
      },
      null,
      2
    );
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  /**
   * Generate a deterministic audit ID using SHA-256 of the entry's key fields.
   * Ensures deduplication and chain-of-custody traceability.
   */
  private _generateAuditId(
    entry: Omit<AuditLogEntry, "auditId" | "timestamp">,
    timestamp: string
  ): string {
    const input = `${timestamp}:${entry.eventType}:${entry.actor}:${entry.uetr ?? ""}:${entry.vnkrTxId ?? ""}:${entry.onChainTxHash ?? ""}`;
    return crypto.createHash("sha256").update(input, "utf8").digest("hex").substring(0, 32);
  }

  /**
   * Forward an audit entry to the configured external SIEM endpoint.
   */
  private async _forwardExternal(entry: AuditLogEntry): Promise<void> {
    const res = await fetch(this.externalEndpoint!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.externalToken
          ? { Authorization: `Bearer ${this.externalToken}` }
          : {}),
      },
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      throw new Error(`External audit endpoint responded with HTTP ${res.status}`);
    }
  }
}
