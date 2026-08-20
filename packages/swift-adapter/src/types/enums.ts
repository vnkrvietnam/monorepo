/**
 * enums.ts — ISO 20022 string literal union types & code constants
 *
 * Converted from Java enum classes in vendor SDKs.
 * Using string literal unions instead of TS enums for optimal tree-shaking.
 *
 * Sources:
 *   ChargeBearerType3Code.java         (g4c v3/v4)
 *   TransactionIndividualStatus7Code.java (g4c v3)
 *   TransactionIndividualStatus9Code.java (g4c v504) — latest, preferred
 *   TransactionIndividualStatus4Code.java (g4c v3)
 *   PaymentStatusReason4Code.java      (g4c v3)
 *   PaymentStatusReason7Code.java      (g4c v3)
 *   PaymentStatusReason12Code.java     (g4c v504)
 *   PaymentStatusReason13Code.java     (g4c v504)
 */

// ─── Charge Bearer ─────────────────────────────────────────────────────────────

/**
 * Specifies which party/parties bears the charges for processing a payment.
 *
 * Source: ChargeBearerType3Code.java
 */
export type ChargeBearerType3Code =
  | "SHAR" // Shared — each party pays their own charges
  | "DEBT" // Debtor (ordering customer) bears all charges
  | "CRED"; // Creditor (beneficiary) bears all charges

/**
 * Extended charge bearer codes for MT103 legacy compliance.
 * SLEV = Service Level — charges as agreed per Service Level.
 */
export type ChargeBearerType1Code = ChargeBearerType3Code | "SLEV";

// ─── Transaction / Payment Status ─────────────────────────────────────────────

/**
 * Specifies the status of a single payment transaction (g4C v5.0.4 — latest).
 *
 * - ACCC: Settlement on creditor account completed
 * - ACCP: Technical validation + customer profile check successful (bilateral only)
 * - ACSC: Settlement on debtor account completed
 * - ACSP: Accepted for execution (all checks passed)
 * - PDNG: Pending — further checks required
 * - RJCT: Rejected
 *
 * Source: TransactionIndividualStatus9Code.java (g4c v504)
 */
export type TransactionIndividualStatus9Code =
  | "ACCC"
  | "ACCP"
  | "ACSC"
  | "ACSP"
  | "PDNG"
  | "RJCT";

/**
 * Specifies the status of a payment transaction (g4C v3).
 * Subset of Status9Code (no ACCP).
 *
 * Source: TransactionIndividualStatus7Code.java (g4c v3)
 */
export type TransactionIndividualStatus7Code =
  | "ACCC"
  | "ACSC"
  | "ACSP"
  | "PDNG"
  | "RJCT";

/**
 * Minimal transaction status for older messages (g4C v2).
 *
 * Source: TransactionIndividualStatus4Code.java (g4c v3)
 */
export type TransactionIndividualStatus4Code =
  | "ACSP"
  | "ACCC"
  | "RJCT"
  | "PDNG";

/** Unified transaction status type — use this in new code */
export type GpiTransactionStatus = TransactionIndividualStatus9Code;

// ─── Payment Status Reason Codes ───────────────────────────────────────────────

/**
 * Payment status rejection/cancellation reason codes.
 * Covers all codes from PaymentStatusReason4Code, 7Code, 13Code.
 *
 * Sources: PaymentStatusReason4Code.java, 7Code.java, 13Code.java
 */
export type PaymentStatusReasonCode =
  // gpi-specific routing codes
  | "G001" // Status Originator transferred to next Agent (service not guaranteed)
  | "G004" // Technical issue
  | "G005" // Delivered to creditor agent, service obligations maintained
  | "G006" // Delivered to creditor agent, service obligations not maintained
  // ISO 20022 standard rejection codes
  | "AC01" // Incorrect account number
  | "AC04" // Closed account number
  | "AC06" // Blocked account
  | "AM06" // Too low amount
  | "BE01" // Inconsistent with end customer
  | "CUST" // Requested by customer
  | "DUPL" // Duplicate sending
  | "FF07" // End customer deceased
  | "FOCR" // Following cancellation request
  | "MS03" // Not specified reason agent generated
  | "NOAS" // No answer from customer
  | "RC01" // BIC invalid
  | "RC08" // BIC invalid
  | "RR03" // Missing creditor name or address
  | "RR05"; // Regulatory reason

/** Reason codes for ACSP (in-progress) status updates */
export type PaymentStatusReason13Code = "G001" | "G005" | "G006";

/** Reason codes for completed status (ACCC) */
export type PaymentStatusReason12Code = "G005";

// ─── Settlement Method ────────────────────────────────────────────────────────

/**
 * Method used to settle the interbank payment.
 */
export type SettlementMethod1Code =
  | "CLRG" // Clearing house
  | "INDA" // Individual debit account
  | "INGA"; // Individual guarantee

// ─── Credit Debit Indicator ───────────────────────────────────────────────────

/** Credit or debit indicator */
export type CreditDebitCode = "CRDT" | "DBIT";

/** Balance type codes for camt.053 */
export type BalanceType10Code =
  | "OPBD" // Opening Booked
  | "CLBD" // Closing Booked
  | "OPAV" // Opening Available
  | "CLAV" // Closing Available
  | "ITBD" // Interim Booked
  | "ITAV" // Interim Available
  | "PRCD" // PrecedingClose
  | "INFO"; // Information

/** Entry status codes */
export type EntryStatus1Code = "BOOK" | "PDNG" | "INFO";

// ─── Payment Priority ─────────────────────────────────────────────────────────

export type Priority2Code = "HIGH" | "NORM";
export type Priority3Code = "HIGH" | "NORM" | "URGT";

// ─── Instruction Codes ────────────────────────────────────────────────────────

export type Instruction3Code =
  | "CHQB" // Pay by cheque
  | "HOLD" // Hold cash
  | "PHOB" // Phone beneficiary
  | "TELB"; // Telephone

export type Instruction4Code =
  | "CHQB"
  | "HOLD"
  | "PHOB"
  | "TELB"
  | "REPA"; // Reinstate prior payment

// ─── Document & Remittance Codes ─────────────────────────────────────────────

export type DocumentType3Code =
  | "RADM" // Remittance Advice Message
  | "RPIN" // Related Payment Instruction
  | "FXDR" // Foreign Exchange Deal Reference
  | "DISP" // Dispatch Advice
  | "PUOR" // Purchase Order
  | "SCOR"; // Structured Communication Reference

export type DocumentType6Code =
  | DocumentType3Code
  | "MSIN" // Metered Service Invoice
  | "CNFA" // Credit Note Related Financial Adjustment
  | "DNFA" // Debit Note Related Financial Adjustment
  | "CINV" // Commercial Invoice
  | "CREN" // Credit Note
  | "DEBN" // Debit Note
  | "HIRI" // Hire Invoice
  | "SBIN" // Self Billed Invoice
  | "CMCN" // Commercial Contract
  | "SOAC" // Statement of Account
  | "DISP" // Dispatch Advice
  | "BOLD" // Bill of Lading Shipping Notice
  | "VCHR" // Voucher
  | "AROI" // Account Receivable Open Item
  | "TSUT" // Trade Services Utility Transaction
  | "PUOR"; // Purchase Order

// ─── Address Type ──────────────────────────────────────────────────────────────

export type AddressType3Code =
  | "ADDR" // Postal address
  | "PBOX" // POBox address
  | "HOME" // Residential address
  | "BIZZ" // Business address
  | "MLTO" // MailTo address
  | "DLVY"; // Delivery address

// ─── Cancellation Reason Codes ────────────────────────────────────────────────

export type CancellationReason8Code =
  | "DUPL" // Duplicate sending
  | "TECH" // Technical problem
  | "FRAD" // Fraudulent origin
  | "CUST" // Requested by customer
  | "UPAY" // Undue payment
  | "COVE" // Covered
  | "AGNT" // Agent decision
  | "CURR" // Incorrect currency
  | "MERI"; // Valid reason not specified

// ─── Notification Channel ─────────────────────────────────────────────────────

export type NotificationChannel =
  | "URID" // URI / Redirect
  | "EMAL" // Email
  | "POST" // Postal
  | "SMSM"; // SMS

// ─── Subscription Status ──────────────────────────────────────────────────────

export type SubscriptionStatus = "ACTV" | "INAC" | "PEND";
