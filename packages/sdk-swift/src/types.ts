// ─── SWIFT Message Types ──────────────────────────────────────────────────────

/** LAU signature output */
export interface LAUSignatureResult {
  signature: string;
  algorithm: "HMAC-SHA256";
  timestamp: string;
}

/** MGW transmission result */
export interface MGWTransmissionResult {
  success: boolean;
  messageId: string;
  lauSignature: string;
  status: "QUEUED" | "TRANSMITTED_TO_SWIFT_MGW" | "REJECTED";
  rawMessage: string;
  timestamp: string;
}
