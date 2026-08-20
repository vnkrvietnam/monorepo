// ─── @vnkrvietnam/swift-adapter ──────────────────────────────────────────────
// SWIFT SDK wrapper for VNKR Institutional Banking
// Covers: MT103, MT202, MT940 (ISO 15022)
//         pacs.008, pacs.009, pacs.002, camt.053, camt.056, pain.001 (ISO 20022 MX)
//         GPI Tracker v5 types · LAU signing · RMA
//         Java bridge (config encryption via vendor JAR)
//         Config validation (AJV + config-swift-sdk-schema.json)

// Legacy flat types (backwards compatible)
export * from "./types.js";

// ─── Structured ISO 20022 types (new) ────────────────────────────────────────
export * from "./types/index.js";

// ─── MT (ISO 15022) message builders ─────────────────────────────────────────
export { buildMT103 } from "./mt/mt103.js";
export { buildMT202 } from "./mt/mt202.js";
export { buildMT940 } from "./mt/mt940.js";
export type { SWIFTMT940Payload, MT940Transaction } from "./mt/mt940.js";

// ─── ISO 20022 MX message builders / parsers ─────────────────────────────────
export { buildPacs008, parsePacs008 } from "./iso20022/pacs008.js";
export { buildPacs009, parsePacs009 } from "./iso20022/pacs009.js";
export type { Pacs009Payload } from "./iso20022/pacs009.js";
export { buildCamt053, parseCamt053 } from "./iso20022/camt053.js";
export type { Camt053Payload, Camt053Entry } from "./iso20022/camt053.js";

// ─── Security layer ───────────────────────────────────────────────────────────
export { LAUSigner } from "./security/lau.js";
export { RMARegistry } from "./security/rma.js";
export type { RMARecord } from "./security/rma.js";

// ─── Event Bus client (Redis Streams producer) ────────────────────────────────
export { VNKRSwiftClient } from "./client.js";

// ─── Java bridge — vendor JAR utilities ──────────────────────────────────────
export { SwiftJavaBridge } from "./core/java-bridge.js";

// ─── Config management — validation + encryption ──────────────────────────────
export {
  SwiftConfigManager,
  SwiftConfigValidationError,
} from "./config/config-encryptor.js";

// ─── Utilities ────────────────────────────────────────────────────────────────
export {
  isBIC,
  normaliseBIC,
  isIBAN,
  normaliseIBAN,
  isCurrencyCode,
  isValidAmount,
  generateUETR,
  isValidUETR,
  formatUETR,
  parseISO20022XML,
  buildISO20022XML,
  extractDocument,
  extractNamespace,
  extractMessageType,
} from "./utils/index.js";
