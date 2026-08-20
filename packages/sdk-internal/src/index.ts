/**
 * @vnkrvietnam/sdk-internal
 *
 * Centralised internal SDK for the VNKR ecosystem.
 * Re-exports the full public surface of @vnkrvietnam/swift-adapter and adds
 * internal utilities, validation helpers, error classes, and typed constants
 * that all 10+ apps and services can consume from a single import.
 *
 * @example
 * import {
 *   buildMT103, LAUSigner, VNKRSwiftClient,
 *   loadSWIFTConfig, createSWIFTLogger,
 *   formatBIC, TransactionStatus, ChargeBearerCode,
 * } from "@vnkrvietnam/sdk-internal";
 */

// ─── Types (internal + swift-adapter pass-through) ───────────────────────────
export type {
  BIC,
  IBAN,
  SWIFTMessageEnvelope,
  SWIFTEventMessage,
  SWIFTEventName,
  SWIFTConfig,
  SWIFTMT103Payload,
  SWIFTMT202Payload,
  SWIFTMT940Payload,
  MT940Transaction,
  Pacs008Payload,
  Pacs009Payload,
  Camt053Payload,
  Camt053Entry,
  LAUSignatureResult,
  RMARecord,
  MGWTransmissionResult,
} from "./types/index.js";

// ─── Constants & Enums ────────────────────────────────────────────────────────
export {
  MessageCategory,
  ChargeBearerCode,
  SettlementMethod,
  TransactionStatus,
  SWIFT_FIELD_LIMITS,
  SUPPORTED_CURRENCIES,
} from "./constants/index.js";
export type { CurrencyCode, SWIFTMessageType } from "./constants/index.js";

// ─── Error Classes ────────────────────────────────────────────────────────────
export {
  SWIFTAdapterError,
  ValidationError,
  SigningError,
  ConfigError,
  JavaBridgeError,
  EventBusError,
} from "./errors/index.js";

// ─── Message Builders & Parsers ───────────────────────────────────────────────
export {
  buildMT103,
  buildMT202,
  buildMT940,
  buildPacs008,
  parsePacs008,
  buildPacs009,
  parsePacs009,
  buildCamt053,
  parseCamt053,
} from "./builders/index.js";

// ─── Security (LAU signing, RMA, BIC/IBAN validation) ────────────────────────
export {
  LAUSigner,
  RMARegistry,
  isBIC,
  formatBIC,
  isIBAN,
  formatIBAN,
} from "./security/index.js";
export type { RMARecord as RMARecordAlias } from "./security/index.js";

// ─── Event Bus (Redis Streams) ────────────────────────────────────────────────
export { VNKRSwiftClient } from "./events/index.js";

// ─── Config ───────────────────────────────────────────────────────────────────
export {
  SwiftConfigManager,
  SwiftConfigValidationError,
  SwiftJavaBridge,
  loadSWIFTConfig,
  validateSWIFTConfig,
} from "./config/index.js";

// ─── Logger ───────────────────────────────────────────────────────────────────
export { createSWIFTLogger } from "./logger/index.js";
export type { SWIFTLogger } from "./logger/index.js";

// ─── Utilities ────────────────────────────────────────────────────────────────
export {
  createEnvelope,
  formatSWIFTAmount,
  parseSWIFTAmount,
  toSWIFTDate,
  toISO8601,
} from "./utils/index.js";
