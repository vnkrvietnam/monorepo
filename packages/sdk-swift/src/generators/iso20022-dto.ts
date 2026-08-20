// ─── ISO 20022 TypeScript DTOs ───────────────────────────────────────────────
// Full type definitions for SWIFT MX message families used in VNKR Network.
// Covers: pacs.008, pacs.009, camt.053, pain.001

// ─── Shared types ─────────────────────────────────────────────────────────────

/** ISO 4217 three-letter currency code */
export type CurrencyCode = string;

/** BIC8 or BIC11 identifier */
export type BIC = string;

/** IBAN account identifier */
export type IBAN = string;

/** ISO 8601 date-time string */
export type ISODateTime = string;

/** ISO 8601 date string (YYYY-MM-DD) */
export type ISODate = string;

/** SWIFT settlement method codes */
export type SettlementMethod = "CLRG" | "INDA" | "INGA" | "COVE";

/** Credit/Debit indicator */
export type CdtDbtIndicator = "CRDT" | "DBIT";

/** Statement entry booking status */
export type EntryStatus = "BOOK" | "PDNG" | "INFO";

/** SWIFT LAU signature result */
export interface LAUSignatureResult {
  signature: string;
  algorithm: "HMAC-SHA256";
  timestamp: ISODateTime;
}

// ─── pacs.008.001.08 — FIToFI Customer Credit Transfer ───────────────────────

/**
 * Input payload for building a `pacs.008.001.08` XML message.
 *
 * Represents a cross-border customer credit transfer initiated by the debtor
 * financial institution toward the creditor financial institution via SWIFT.
 *
 * Standard: ISO 20022 / pacs.008.001.08
 */
export interface Pacs008Payload {
  /** Unique message identifier */
  msgId: string;
  /** Creation date-time (defaults to now) */
  creDtTm?: ISODateTime;
  /** Number of credit transfer transactions (default: 1) */
  nbOfTxs?: number;
  /** Settlement method (default: "CLRG") */
  sttlmMtd?: SettlementMethod;
  /** Instruction identification */
  instrId: string;
  /** End-to-end identification */
  endToEndId: string;
  /** Transaction identification (use UETR for gpi) */
  txId: string;
  /** Interbank settlement amount */
  intrBkSttlmAmt: number;
  /** ISO 4217 currency */
  currency: CurrencyCode;
  /** Interbank settlement date YYYY-MM-DD */
  intrBkSttlmDt?: ISODate;
  /** Debtor legal name */
  dbtrName: string;
  /** Debtor account IBAN */
  dbtrAcctIBAN: IBAN;
  /** Debtor agent BIC */
  dbtrAgtBIC: BIC;
  /** Creditor agent BIC */
  cdtrAgtBIC: BIC;
  /** Creditor legal name */
  cdtrName: string;
  /** Creditor account IBAN */
  cdtrAcctIBAN: IBAN;
  /** Optional purpose code (ISO external code list) */
  purposeCode?: string;
  /** Optional remittance information (unstructured, max 140 chars) */
  remittanceInfo?: string;
}

// ─── pacs.009.001.08 — FI Credit Transfer (Cover) ────────────────────────────

/**
 * Input payload for building a `pacs.009.001.08` XML message.
 *
 * Used as an interbank cover payment, typically accompanying a pacs.008.
 * Equivalent to SWIFT MT202 in the ISO 15022 world.
 *
 * Standard: ISO 20022 / pacs.009.001.08
 */
export interface Pacs009Payload {
  msgId: string;
  creDtTm?: ISODateTime;
  nbOfTxs?: number;
  sttlmMtd?: SettlementMethod;
  instrId: string;
  endToEndId: string;
  /** Transaction identification / UETR */
  txId: string;
  intrBkSttlmAmt: number;
  currency: CurrencyCode;
  intrBkSttlmDt?: ISODate;
  /** Instructing agent BIC */
  instgAgtBIC: BIC;
  /** Instructed agent BIC */
  instdAgtBIC: BIC;
  /** Debtor agent BIC */
  dbtrAgtBIC: BIC;
  /** Creditor agent BIC */
  cdtrAgtBIC: BIC;
  /** Creditor legal name */
  cdtrName: string;
  /** Creditor account IBAN */
  cdtrAcctIBAN: IBAN;
}

// ─── camt.053.001.08 — Bank-to-Customer Statement ────────────────────────────

/**
 * A single transaction entry within a `camt.053` statement.
 *
 * Standard: ISO 20022 / camt.053.001.08
 */
export interface Camt053Entry {
  /** Transaction amount */
  amount: number;
  currency: CurrencyCode;
  /** CRDT = Credit, DBIT = Debit */
  creditDebitIndicator: CdtDbtIndicator;
  /** BOOK = booked, PDNG = pending */
  status: EntryStatus;
  /** Booking date (YYYY-MM-DD) */
  bookingDate: ISODate;
  /** Value date (YYYY-MM-DD) */
  valueDate: ISODate;
  /** Account Servicer Reference */
  accountServicerRef?: string;
  /** End-to-end identification */
  endToEndId?: string;
  /** ISO bank transaction code (e.g. ESCT, DMCT) */
  bankTransactionCode?: string;
  /** Free-text additional information */
  additionalEntryInfo?: string;
}

/**
 * Input payload for building a `camt.053.001.08` Bank-to-Customer Statement.
 *
 * ISO 20022 equivalent of the SWIFT MT940 message.
 *
 * Standard: ISO 20022 / camt.053.001.08
 */
export interface Camt053Payload {
  msgId: string;
  creDtTm?: ISODateTime;
  /** Message pagination, e.g. "1/1" */
  msgPgntn?: string;
  stmtId: string;
  seqNb?: number;
  /** Statement period from date (YYYY-MM-DD) */
  frDt: ISODate;
  /** Statement period to date (YYYY-MM-DD) */
  toDt: ISODate;
  accountIBAN: IBAN;
  servicerBIC: BIC;
  openingBalanceAmt: number;
  openingBalanceCurrency: CurrencyCode;
  openingBalanceDC: CdtDbtIndicator;
  openingBalanceDate: ISODate;
  closingBalanceAmt: number;
  closingBalanceCurrency: CurrencyCode;
  closingBalanceDC: CdtDbtIndicator;
  closingBalanceDate: ISODate;
  entries: Camt053Entry[];
}

// ─── pain.001.001.09 — Customer Credit Transfer Initiation ───────────────────

/**
 * A single credit transfer transaction within a `pain.001` initiation message.
 *
 * Standard: ISO 20022 / pain.001.001.09
 */
export interface Pain001Transaction {
  /** Payment identification end-to-end ID */
  endToEndId: string;
  /** Instructed amount */
  amount: number;
  currency: CurrencyCode;
  /** Requested execution date (YYYY-MM-DD) */
  reqExctnDt?: ISODate;
  /** Creditor BIC */
  cdtrAgtBIC: BIC;
  cdtrName: string;
  cdtrAcctIBAN: IBAN;
  /** Remittance reference (e.g. invoice number) */
  remittanceRef?: string;
  /** Unstructured remittance info */
  remittanceInfo?: string;
  /** Charge bearer: SLEV, SHAR, DEBT, CRED */
  chargeBearer?: "SLEV" | "SHAR" | "DEBT" | "CRED";
}

/**
 * Input payload for building a `pain.001.001.09` Customer Credit Transfer
 * Initiation message (e.g. bulk payment file from corporate ERP).
 *
 * Standard: ISO 20022 / pain.001.001.09
 */
export interface Pain001Payload {
  msgId: string;
  creDtTm?: ISODateTime;
  /** Initiating party name (corporate or bank) */
  initiatingPartyName: string;
  /** Payment method: TRF (credit transfer), CHK (cheque) */
  paymentMethod?: "TRF" | "CHK";
  /** Batch booking flag */
  batchBooking?: boolean;
  /** Debtor name */
  dbtrName: string;
  /** Debtor IBAN */
  dbtrAcctIBAN: IBAN;
  /** Debtor agent BIC */
  dbtrAgtBIC: BIC;
  /** List of individual credit transfer transactions */
  transactions: Pain001Transaction[];
}

// ─── SWIFT GPI ────────────────────────────────────────────────────────────────

/**
 * SWIFT gpi transaction tracker status record.
 * Returned by the SWIFT gpi API for a given UETR.
 */
export interface GPITransactionStatus {
  /** Unique End-to-End Transaction Reference (UUID v4) */
  uetr: string;
  /** Overall transaction status: ACSC, RJCT, PDNG, ACSP */
  transactionStatus: "ACSC" | "RJCT" | "PDNG" | "ACSP" | "ACWP";
  /** Human-readable status description */
  statusDescription?: string;
  /** ISO 8601 last updated timestamp */
  lastUpdateTime: ISODateTime;
  /** Ordered list of status events across the payment chain */
  events: GPIStatusEvent[];
}

export interface GPIStatusEvent {
  /** BIC of the agent reporting this event */
  agentBIC: BIC;
  /** Status at this agent */
  status: string;
  /** ISO 8601 timestamp */
  eventTime: ISODateTime;
  /** Reason code if the transaction was rejected or put on hold */
  reasonCode?: string;
}

// ─── Pre-validation ───────────────────────────────────────────────────────────

/** Input for BIC/account pre-validation */
export interface PreValidationRequest {
  /** BIC to validate */
  bic: BIC;
  /** IBAN to validate (optional) */
  iban?: IBAN;
  /** Beneficiary name to verify against directory (optional) */
  beneficiaryName?: string;
  /** ISO 4217 currency */
  currency?: CurrencyCode;
}

/** Result of BIC/account pre-validation */
export interface PreValidationResult {
  valid: boolean;
  bicValid: boolean;
  ibanValid?: boolean;
  nameMatchScore?: number;
  errors: string[];
}

// ─── Reference Data ───────────────────────────────────────────────────────────

/** A single BIC directory entry from SWIFT SWIFTRef */
export interface BICRecord {
  bic: BIC;
  institutionName: string;
  countryCode: string;
  city?: string;
  address?: string;
  /** ISO 8601 last updated */
  lastUpdated: ISODateTime;
  /** Whether the BIC is active */
  active: boolean;
  /** Connected vs non-connected to SWIFTNet */
  connected: boolean;
}

// ─── Audit log ────────────────────────────────────────────────────────────────

/**
 * Audit log entry — structured record for NQ-05/NĐ-284 compliance.
 */
export interface AuditLogEntry {
  /** Unique audit record identifier */
  auditId: string;
  /** ISO 8601 timestamp */
  timestamp: ISODateTime;
  /** Type of event (e.g. PAYMENT_INITIATED, VALIDATION_FAILED) */
  eventType: string;
  /** SWIFT UETR if applicable */
  uetr?: string;
  /** Internal VNKR transaction ID */
  vnkrTxId?: string;
  /** On-chain transaction hash if applicable */
  onChainTxHash?: string;
  /** Actor BIC or user identifier */
  actor: string;
  /** Outcome: SUCCESS, FAILURE, WARNING */
  outcome: "SUCCESS" | "FAILURE" | "WARNING";
  /** JSON-serialisable metadata */
  metadata?: Record<string, unknown>;
}

// ─── Blockchain bridge ────────────────────────────────────────────────────────

/** Supported blockchain networks */
export type BlockchainNetwork = "EVM" | "TRON" | "SOLANA" | "TON";

/** Escrow state on-chain */
export type EscrowStatus =
  | "CREATED"
  | "FUNDED"
  | "RELEASED"
  | "REFUNDED"
  | "EXPIRED";

/** Cross-border escrow record linking SWIFT and on-chain settlement */
export interface CrossBorderEscrow {
  /** Internal escrow ID */
  escrowId: string;
  /** SWIFT UETR of the associated pacs.008 */
  uetr: string;
  /** On-chain network */
  network: BlockchainNetwork;
  /** On-chain contract address or program ID */
  contractAddress: string;
  /** On-chain escrow identifier (slot / nonce / seed) */
  onChainEscrowId: string;
  /** Fiat amount (in the payment currency) */
  fiatAmount: number;
  fiatCurrency: CurrencyCode;
  /** Crypto amount locked in escrow */
  cryptoAmount: string;
  /** Crypto asset symbol (USDT, USDC, etc.) */
  cryptoAsset: string;
  escrowStatus: EscrowStatus;
  /** ISO 8601 creation time */
  createdAt: ISODateTime;
  /** ISO 8601 expiry time */
  expiresAt: ISODateTime;
}
