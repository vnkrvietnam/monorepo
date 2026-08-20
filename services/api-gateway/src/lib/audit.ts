/**
 * Audit logging — NĐ 284/2025/NĐ-CP compliance
 * Records IP, User-Agent, timestamp and optional delta for every
 * data-modifying operation.
 */
import type { Request } from "express";

export interface AuditEvent {
  userId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  changes?: Record<string, unknown>;
}

/**
 * Extract requester context from an Express request.
 */
export function buildAuditContext(req: Request): Pick<AuditEvent, "ipAddress" | "userAgent"> {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ??
    req.socket.remoteAddress ??
    "unknown";

  return {
    ipAddress: ip.trim(),
    userAgent: req.headers["user-agent"] ?? "unknown",
  };
}

/**
 * Write an audit event.
 * In production this should persist to a tamper-evident audit log store
 * (e.g. append-only DB table, WORM object storage, SIEM).
 * Here we emit to stdout and the caller can pipe to a log aggregator.
 */
export async function auditLog(event: AuditEvent): Promise<void> {
  const entry = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
  // Structured JSON log — pick up by Fluentd / Loki / CloudWatch
  process.stdout.write(JSON.stringify({ audit: true, ...entry }) + "\n");
  // TODO: INSERT INTO compliance.audit_log (...)
}
