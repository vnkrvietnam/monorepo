import type { CurrencyCode, SWIFTMessageType } from "../constants/index.js";
import type { LAUSignatureResult } from "./swift-adapter.js";

// ─── Branded Primitive Types ─────────────────────────────────────────────────

/** BIC (Business Identifier Code) — 8 or 11 characters */
export type BIC = string & { readonly __brand: "BIC" };

/** IBAN (International Bank Account Number) — up to 34 characters */
export type IBAN = string & { readonly __brand: "IBAN" };

// ─── Envelope ────────────────────────────────────────────────────────────────

/**
 * SWIFTMessageEnvelope — unified wrapper for any SWIFT message payload
 * passed between services via event bus or direct API calls.
 */
export interface SWIFTMessageEnvelope {
  /** Unique trace/correlation ID (UUID or nanoid) */
  id: string;
  /** ISO 8601 UTC timestamp when the envelope was created */
  timestamp: string;
  /** Type of the inner SWIFT message */
  type: SWIFTMessageType;
  /** Raw message payload (type-specific) */
  payload: Record<string, unknown>;
  /** Optional LAU signature attached by the originating service */
  signature?: LAUSignatureResult;
  /** Condensed routing metadata for quick access without parsing payload */
  metadata?: {
    senderBIC?: string;
    receiverBIC?: string;
    reference?: string;
    amount?: number;
    currency?: CurrencyCode;
  };
}

// ─── Event Bus Types ─────────────────────────────────────────────────────────

export type SWIFTEventName =
  | "SWIFT_MT103_REQUESTED"
  | "SWIFT_MT202_REQUESTED"
  | "SWIFT_PACS008_REQUESTED"
  | "SWIFT_PACS009_REQUESTED"
  | "SWIFT_CAMT053_REQUESTED"
  | "SWIFT_MESSAGE_SENT"
  | "SWIFT_MESSAGE_CONFIRMED"
  | "SWIFT_MESSAGE_REJECTED"
  | "SWIFT_MESSAGE_CANCELLED";

/** Event message published to / consumed from Redis Streams */
export interface SWIFTEventMessage {
  event: SWIFTEventName;
  data: Record<string, unknown>;
  traceId: string;
  timestamp: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

/** Unified SWIFT configuration consumed by all services */
export interface SWIFTConfig {
  /** LAU HMAC-SHA256 signing key in hex (from env LAU_KEY_HEX) */
  lauKeyHex: string;
  /** SWIFT Microgateway REST API base URL */
  gatewayUrl?: string;
  /** Redis Stream key prefix — defaults to "vnkr:swift" */
  redisStreamPrefix?: string;
  /** Path to config-swift-sdk.yaml (plain-text) */
  configFilePath?: string;
  /** Path to encrypted config file */
  encryptedConfigPath?: string;
  /** Passphrase for config file encryption/decryption */
  encryptionKey?: string;
  /** Override path to Java binary (defaults to "java" on PATH) */
  javaPath?: string;
  /** Override path to file-encryptor-decryptor JAR */
  encryptorJarPath?: string;
}
