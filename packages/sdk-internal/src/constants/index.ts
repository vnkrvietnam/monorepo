// ─── Constants ──────────────────────────────────────────────────────────────

/** SWIFT message category numbers */
export enum MessageCategory {
  CATEGORY_1 = "1", // Customer transfers (MT1xx)
  CATEGORY_2 = "2", // Financial institution transfers (MT2xx)
  CATEGORY_9 = "9", // Special messages (MT9xx)
}

/** ISO 20022 charge bearer codes (ChrgBr) */
export enum ChargeBearerCode {
  /** Shared — each party pays their own charges */
  SHA = "SHA",
  /** Ordering customer bears all charges */
  OUR = "OUR",
  /** Beneficiary bears all charges */
  BEN = "BEN",
}

/** ISO 20022 settlement method codes */
export enum SettlementMethod {
  /** Clearing house */
  CLRG = "CLRG",
  /** Individual debit account */
  INDA = "INDA",
  /** Individual guarantee */
  INGA = "INGA",
}

/** Internal VNKR transaction lifecycle statuses */
export enum TransactionStatus {
  QUEUED = "QUEUED",
  SUBMITTED = "SUBMITTED",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

/** SWIFT field maximum character limits per specification */
export const SWIFT_FIELD_LIMITS = {
  REFERENCE: 16,
  ACCOUNT: 34,
  NAME: 35,
  BIC: 11,
  IBAN: 34,
  AMOUNT: 15,
} as const;

/** Supported ISO 4217 currency codes in the VNKR system */
export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CNY",
  "VND", "SGD", "HKD", "KRW", "THB",
  "AUD", "CAD", "CHF", "MYR", "IDR",
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number];

/** Supported SWIFT MX message types */
export type SWIFTMessageType =
  | "MT103"
  | "MT202"
  | "MT940"
  | "PACS008"
  | "PACS009"
  | "CAMT053"
  | "CAMT056"
  | "PAIN001";
