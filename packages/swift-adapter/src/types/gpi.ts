/**
 * gpi.ts — SWIFT gpi (Global Payments Innovation) types
 *
 * Covers gpi for Corporates (g4C) v3, v4, v5.0.4
 *
 * Converted from Java model classes:
 *   PaymentTransaction116.java  (g4c v3)
 *   PaymentTransaction115.java  (g4c v3)
 *   PaymentTransaction119.java  (g4c v4)
 *   PaymentTransaction120.java  (g4c v4)
 *   PaymentStatus8.java         (g4c v3)
 *   PaymentStatus14.java        (g4c v3)
 *   PaymentEvent10.java         (g4c v3)
 *   PaymentEvent11.java         (g4c v3/v4)
 *   CurrencyExchange12.java     (g4c v3/v4)
 */

import type {
  ActiveOrHistoricCurrencyAndAmount,
  ActiveCurrencyAndAmount,
  PartyIdentification221,
  CashAccount204,
  CurrencyExchange12,
} from "./common.js";

import type {
  GpiTransactionStatus,
  PaymentStatusReasonCode,
  TransactionIndividualStatus4Code,
  ChargeBearerType3Code,
} from "./enums.js";

// ─── GPI Payment Status ───────────────────────────────────────────────────────

/**
 * Payment status with status code + optional reason.
 *
 * Source: PaymentStatus8.java (uses Status4Code + Reason4Code)
 */
export interface PaymentStatus8 {
  status: TransactionIndividualStatus4Code;
  reason?: PaymentStatusReasonCode;
}

/**
 * Payment status with full g4C v3+ status codes.
 *
 * Source: PaymentStatus14.java (uses Status7Code + Reason7Code)
 */
export interface PaymentStatus14 {
  status: GpiTransactionStatus;
  reason?: PaymentStatusReasonCode;
}

// ─── GPI Payment Event ────────────────────────────────────────────────────────

/**
 * A single gpi payment event (hop in the payment chain).
 *
 * Source: PaymentEvent10.java, PaymentEvent11.java (g4c v3/v4)
 */
export interface PaymentEvent11 {
  /** BIC of the institution generating this event */
  fromBic: string;
  /** BIC of the next institution in the chain (optional for last hop) */
  toBic?: string;
  /** ISO 8601 datetime of this event */
  txSts: GpiTransactionStatus;
  /** Reason code for rejection/pending */
  stsRsn?: PaymentStatusReasonCode;
  /**
   * Charges deducted at this hop.
   * Each element: { amount, currency, chargeBearerType }
   */
  chrgs?: GpiCharge[];
  /** Foreign exchange applied at this hop */
  fxInf?: CurrencyExchange12;
  /** ISO 8601 datetime of the event */
  updtdDt?: string;
  /** Any additional event-level information */
  instdAgt?: string;
  /** Instructed agent BIC */
  instgAgt?: string;
}

export interface GpiCharge {
  amt: ActiveOrHistoricCurrencyAndAmount;
  agt?: string; // BIC of the charging agent
  tp?: ChargeBearerType3Code;
}

// ─── GPI Payment Transaction (g4C v3) ─────────────────────────────────────────

/**
 * Inbound payment transaction details — full tracking payload.
 *
 * Source: PaymentTransaction116.java (g4c v3 — InboundPaymentsApi)
 */
export interface PaymentTransaction116 {
  /** UETR — Unique End-to-end Transaction Reference (UUID v4) */
  uetr: string;
  /** Current composite transaction status */
  transaction_status: PaymentStatus14;
  /** ISO 8601 datetime of this status event */
  event_time: string;
  /** BIC of the originating bank */
  originator: string;
  /** Original instructed amount */
  instructed_amount: ActiveOrHistoricCurrencyAndAmount;
  /** Confirmed settled amount */
  confirmed_amount: ActiveOrHistoricCurrencyAndAmount;
  /** Settlement date YYYY-MM-DD */
  interbank_settlement_date: string;
  /** Debtor (payer) party */
  debtor: PartyIdentification221;
  /** Debtor's account details */
  debtor_account?: CashAccount204;
  /** Creditor (payee) party */
  creditor: PartyIdentification221;
  /** Creditor's account details */
  creditor_account?: CashAccount204;
  /** BIC of the creditor agent */
  creditor_agent: string;
  /** Unstructured remittance info (max 140 chars) */
  unstructured_remittance_information?: string;
  /** Ordered list of payment events (each hop in the chain) */
  payment_event: PaymentEvent11[];
}

/**
 * Outbound (Pay and Trace) payment transaction details.
 *
 * Source: PaymentTransaction115.java (g4c v3 — PayAndTracePaymentsApi)
 */
export interface PaymentTransaction115 {
  uetr: string;
  transaction_status: PaymentStatus14;
  event_time: string;
  originator: string;
  instructed_amount: ActiveOrHistoricCurrencyAndAmount;
  confirmed_amount?: ActiveOrHistoricCurrencyAndAmount;
  interbank_settlement_date: string;
  debtor: PartyIdentification221;
  debtor_account?: CashAccount204;
  creditor: PartyIdentification221;
  creditor_account?: CashAccount204;
  creditor_agent: string;
  unstructured_remittance_information?: string;
  payment_event: PaymentEvent11[];
}

// ─── GPI Payment Transaction (g4C v504 — latest) ──────────────────────────────

/**
 * Latest g4C v5.0.4 payment transaction (ActiveCurrencyAndAmount replaces Active*Or*Historic).
 *
 * Source: derived from v504 model patterns
 */
export interface PaymentTransactionV504 {
  uetr: string;
  transaction_status: PaymentStatus14;
  event_time: string;
  originator: string;
  instructed_amount: ActiveCurrencyAndAmount;
  confirmed_amount?: ActiveCurrencyAndAmount;
  interbank_settlement_date: string;
  debtor: PartyIdentification221;
  debtor_account?: CashAccount204;
  creditor: PartyIdentification221;
  creditor_account?: CashAccount204;
  creditor_agent: string;
  unstructured_remittance_information?: string;
  payment_event: PaymentEvent11[];
}

// ─── GPI API Responses ────────────────────────────────────────────────────────

/**
 * Response from GetChangedPaymentTransactions API.
 *
 * Source: IncomingCustomerPaymentTransactionsResponse.java
 */
export interface IncomingCustomerPaymentTransactionsResponse {
  transactions?: PaymentTransaction116[];
}

/**
 * Response from GetCorporatePaymentTransactions API.
 *
 * Source: CorporatePaymentTransactionsResponse.java
 */
export interface CorporatePaymentTransactionsResponse {
  transactions?: PaymentTransaction115[];
}

// ─── GPI Cancellation ─────────────────────────────────────────────────────────

/**
 * Transaction cancellation request payload.
 *
 * Source: derived from SWIFT gpi Tracker v5 API spec
 */
export interface CancellationRequest {
  uetr: string;
  reason?: PaymentStatusReasonCode;
  additionalInfo?: string;
}

/**
 * Cancellation status response.
 */
export interface TransactionCancellationStatusResponse {
  uetr: string;
  status: "CANC" | "RJCT" | "PDNG";
  reason?: string;
  updatedAt?: string;
}

// ─── GPI Notification / Subscription ─────────────────────────────────────────

/**
 * Notification payload delivered to g4C subscribers (SWIFT Notification API v2.0.5).
 *
 * Source: Notification.java (v205notification)
 */
export interface GpiNotification {
  notificationId?: string;
  /** ISO 8601 datetime */
  creationDateTime?: string;
  /** Message type: "pacs.008" | "camt.054" | etc. */
  messageType?: string;
  /** Raw XML payload as base64 string */
  payload?: string;
}

/**
 * Subscription object for gpi Notification API.
 *
 * Source: Subscription.java, SubscriptionInfo.java
 */
export interface GpiSubscription {
  subscriptionId?: string;
  /** Subscriber BIC */
  bic?: string;
  /** Webhook URL for notification delivery */
  callbackUrl?: string;
  status?: "ACTV" | "INAC" | "PEND";
  /** ISO 8601 creation datetime */
  createdAt?: string;
  /** Message types subscribed to */
  messageTypes?: string[];
}

export interface GpiSubscriptionUpdate {
  callbackUrl?: string;
  status?: "ACTV" | "INAC";
  messageTypes?: string[];
}

export interface ActivateSubscriptionRequest {
  subscriptionId: string;
}

export interface ActivatedSubscription {
  subscriptionId?: string;
  status?: string;
}
