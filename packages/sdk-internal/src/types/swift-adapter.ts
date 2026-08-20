// ─── Re-export swift-adapter public types ────────────────────────────────────
// These are passed through so consumers only need to import from sdk-internal.

export type {
  // ISO 15022 (FIN format)
  SWIFTMT103Payload,
  SWIFTMT202Payload,
  SWIFTMT940Payload,
  MT940Transaction,

  // ISO 20022 (MX/XML format)
  Pacs008Payload,
  Pacs009Payload,
  Camt053Payload,
  Camt053Entry,

  // Security
  LAUSignatureResult,
  RMARecord,

  // Results
  MGWTransmissionResult,
} from "@vnkrvietnam/swift-adapter";
