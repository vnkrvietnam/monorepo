/**
 * ISO 20022 pacs.008.001 — FIToFICustomerCreditTransfer
 *
 * Represents the data structure for a Financial Institution to Financial
 * Institution Customer Credit Transfer message used in cross-border payments
 * over the SWIFT network.
 *
 * @see https://www.iso20022.org/catalogue-messages/iso-20022-messages-archive?search=pacs.008
 */

/** Monetary amount with currency code (ISO 4217). */
export interface ActiveCurrencyAndAmount {
  /** ISO 4217 three-letter currency code (e.g. "USD", "VND"). */
  currency: string;
  /** Decimal monetary amount. */
  amount: number;
}

/** Party identification containing a name and IBAN. */
export interface PartyIdentification {
  /** Legal name of the debtor or creditor institution / individual. */
  name: string;
  /** International Bank Account Number (ISO 13616). */
  iban: string;
}

/** Remittance information accompanying the credit transfer. */
export interface RemittanceInformation {
  /** Unstructured remittance information (free-text reference). */
  unstructured?: string;
}

/** A single credit transfer transaction within a pacs.008 message. */
export interface CreditTransferTransaction {
  /**
   * Unique End-to-End Transaction Reference (UUID v4) assigned by SWIFT GPI.
   * Used to track the payment across the entire correspondent banking chain.
   */
  uetr: string;
  /** Instruction identification assigned by the instructing agent. */
  instrId: string;
  /** End-to-end identification assigned by the initiating party. */
  endToEndId: string;
  /** Interbank settlement amount and currency. */
  intrBkSttlmAmt: ActiveCurrencyAndAmount;
  /** Debtor (originator) party details. */
  dbtr: PartyIdentification;
  /** Creditor (beneficiary) party details. */
  cdtr: PartyIdentification;
  /** Remittance information attached to this transfer. */
  rmtInf?: RemittanceInformation;
}

/**
 * Root message structure for pacs.008 FIToFICustomerCreditTransfer.
 * A single message may batch multiple credit transfer transactions.
 */
export interface Pacs008Message {
  /** Message identification — unique per sender per day. */
  msgId: string;
  /** Message creation date and time in ISO 8601 format. */
  creDtTm: string;
  /** Number of individual transactions contained in the message. */
  nbOfTxs: number;
  /** Total sum of all interbank settlement amounts in the message. */
  ctrlSum: number;
  /** Array of credit transfer transaction information blocks. */
  cdtTrfTxInf: CreditTransferTransaction[];
}
