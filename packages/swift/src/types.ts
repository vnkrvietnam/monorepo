// ─── SWIFT Message Types ──────────────────────────────────────────────────────

/**
 * Payload for generating a SWIFT MT103
 * (Single Customer Credit Transfer — ISO 15022)
 */
export interface SWIFTMT103Payload {
  /** BIC8/BIC11 of the sending institution */
  senderBIC: string;
  /** BIC8/BIC11 of the receiving institution */
  receiverBIC: string;
  /** Unique transaction reference (max 16 chars, :20: field) */
  reference: string;
  /** Transfer amount */
  amount: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Ordering customer account */
  orderingAccount: string;
  /** Ordering customer name */
  orderingName: string;
  /** Beneficiary account (IBAN or local) */
  beneficiaryAccount: string;
  /** Beneficiary name */
  beneficiaryName: string;
  /**
   * Charges code: SHA (shared), OUR (sender), BEN (beneficiary).
   * Defaults to SHA.
   */
  chargesCode?: "SHA" | "OUR" | "BEN";
  /**
   * Value date in YYMMDD format (e.g. "260819").
   * Defaults to today.
   */
  valueDate?: string;
}

/**
 * Payload for generating a SWIFT MT202
 * (Financial Institution Credit Transfer — ISO 15022)
 */
export interface SWIFTMT202Payload {
  senderBIC: string;
  receiverBIC: string;
  reference: string;
  relatedReference: string;
  amount: number;
  currency: string;
  valueDate?: string;
  /** Account with Institution BIC */
  accountWithInstitutionBIC: string;
  /** Beneficiary Institution BIC */
  beneficiaryInstitutionBIC: string;
}

/**
 * pacs.008.001 — FIToFI Customer Credit Transfer (ISO 20022 MX)
 */
export interface Pacs008Payload {
  msgId: string;
  creDtTm?: string;
  nbOfTxs?: number;
  sttlmMtd?: string;
  instrId: string;
  endToEndId: string;
  txId: string;
  intrBkSttlmAmt: number;
  currency: string;
  intrBkSttlmDt?: string;
  dbtrName: string;
  dbtrAcctIBAN: string;
  dbtrAgtBIC: string;
  cdtrAgtBIC: string;
  cdtrName: string;
  cdtrAcctIBAN: string;
}

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
