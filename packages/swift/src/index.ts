// ─── @vnkrvietnam/swift-adapter ─────────────────────────────────────────────────────
// SWIFT SDK wrapper for VNKR Institutional Banking (GVI Labs MENA / VNKR FinTech)
// Covers: MT103, MT202, MT940 (ISO 15022)
//         pacs.008, pacs.009, camt.053 (ISO 20022 MX)
//         LAU signing · RMA

export * from "./types.js";

// MT (ISO 15022) message builders
export { buildMT103 } from "./mt/mt103.js";
export { buildMT202 } from "./mt/mt202.js";
export { buildMT940 } from "./mt/mt940.js";
export type { SWIFTMT940Payload, MT940Transaction } from "./mt/mt940.js";

// ISO 20022 MX message builders / parsers
export { buildPacs008, parsePacs008 } from "./iso20022/pacs008.js";
export { buildPacs009, parsePacs009 } from "./iso20022/pacs009.js";
export type { Pacs009Payload } from "./iso20022/pacs009.js";
export { buildCamt053, parseCamt053 } from "./iso20022/camt053.js";
export type { Camt053Payload, Camt053Entry } from "./iso20022/camt053.js";

// Security layer
export { LAUSigner } from "./security/lau.js";
export { RMARegistry } from "./security/rma.js";
export type { RMARecord } from "./security/rma.js";

// Event Bus client (Redis Streams producer)
export { VNKRSwiftClient } from "./client.js";
