import type { SWIFTMessageEnvelope } from "../types/index.js";
import type { SWIFTMessageType, CurrencyCode } from "../constants/index.js";
import type { LAUSignatureResult } from "../types/index.js";
import { randomUUID } from "node:crypto";

// ─── Envelope helpers ─────────────────────────────────────────────────────────

/**
 * Create a new SWIFTMessageEnvelope with a generated ID and current timestamp.
 */
export function createEnvelope(
  type: SWIFTMessageType,
  payload: Record<string, unknown>,
  options?: {
    id?: string;
    signature?: LAUSignatureResult;
    metadata?: {
      senderBIC?: string;
      receiverBIC?: string;
      reference?: string;
      amount?: number;
      currency?: CurrencyCode;
    };
  },
): SWIFTMessageEnvelope {
  return {
    id: options?.id ?? randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    payload,
    signature: options?.signature,
    metadata: options?.metadata,
  };
}

// ─── Amount formatting ────────────────────────────────────────────────────────

/**
 * Format a number as a SWIFT-compatible amount string.
 * SWIFT uses comma as decimal separator in FIN messages (MT format).
 * Example: 1500000.50 → "1500000,50"
 */
export function formatSWIFTAmount(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

/**
 * Parse a SWIFT FIN amount string (comma decimal) to a JavaScript number.
 * Example: "1500000,50" → 1500000.5
 */
export function parseSWIFTAmount(amount: string): number {
  return parseFloat(amount.replace(",", "."));
}

// ─── Date/time utilities ──────────────────────────────────────────────────────

/**
 * Format a Date as SWIFT YYMMDD (used in MT message fields).
 */
export function toSWIFTDate(date: Date = new Date()): string {
  return date.toISOString().slice(2, 10).replace(/-/g, "");
}

/**
 * Format a Date as ISO 8601 UTC string (used in MX/pacs messages).
 */
export function toISO8601(date: Date = new Date()): string {
  return date.toISOString();
}
