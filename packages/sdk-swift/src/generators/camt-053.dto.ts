/**
 * ISO 20022 camt.053.001 — BankToCustomerStatement
 *
 * Represents the data structure for a Bank-to-Customer Account Statement
 * message, used to deliver account statement information to customers
 * or back-office systems.
 *
 * @see https://www.iso20022.org/catalogue-messages/iso-20022-messages-archive?search=camt.053
 */

/** Monetary amount with currency code (ISO 4217). */
export interface StatementAmount {
  /** ISO 4217 three-letter currency code (e.g. "USD", "VND"). */
  currency: string;
  /** Decimal monetary amount (always positive; direction given by crdDbtInd). */
  value: number;
}

/** Account identification using IBAN and currency. */
export interface AccountIdentification {
  /** International Bank Account Number (ISO 13616). */
  iban: string;
  /** ISO 4217 currency code for the account. */
  ccy: string;
}

/** Balance entry on the account statement. */
export interface Balance {
  /**
   * Balance type code.
   * Common values: "OPBD" (Opening Booked), "CLBD" (Closing Booked),
   * "ITBD" (Interim Booked), "CLAV" (Closing Available).
   */
  type: string;
  /** Balance amount and currency. */
  amt: StatementAmount;
  /**
   * Credit/Debit indicator.
   * "CRDT" indicates a credit balance; "DBIT" indicates a debit balance.
   */
  crdDbtInd: 'CRDT' | 'DBIT';
  /** Date of the balance in ISO 8601 format (YYYY-MM-DD). */
  dt: string;
}

/** A single transaction entry on the account statement. */
export interface StatementEntry {
  /** Transaction amount and currency. */
  amt: StatementAmount;
  /** Credit/Debit indicator for this entry. */
  crdDbtInd: 'CRDT' | 'DBIT';
  /** Booking date of the entry (ISO 8601 YYYY-MM-DD). */
  bookgDt: string;
  /** Account servicer reference (bank's own transaction reference). */
  acctSvcrRef: string;
  /** Unstructured remittance information. */
  rmtInf?: string;
}

/** A single account statement block within a camt.053 message. */
export interface Statement {
  /** Statement identification. */
  id: string;
  /** Account to which the statement relates. */
  acct: AccountIdentification;
  /** One or more balance figures for the account. */
  bal: Balance[];
  /** Array of transaction entries on the statement. */
  ntry: StatementEntry[];
}

/**
 * Root message structure for camt.053 BankToCustomerStatement.
 * A single message may contain statements for multiple accounts.
 */
export interface Camt053Message {
  /** Message identification — unique per sender per day. */
  msgId: string;
  /** Message creation date and time in ISO 8601 format. */
  creDtTm: string;
  /** Array of account statements. */
  stmt: Statement[];
}
