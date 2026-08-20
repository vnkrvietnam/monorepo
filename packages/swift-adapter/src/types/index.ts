/**
 * @vnkrvietnam/swift-adapter — Type Barrel Export
 *
 * Exports all ISO 20022 types, GPI types, security types, and enums.
 * The existing flat types from ../types.ts remain for backwards compatibility.
 */

// ─── Common ISO 20022 shared structures ──────────────────────────────────────
export type {
  ActiveOrHistoricCurrencyAndAmount,
  ActiveCurrencyAndAmount,
  PartyIdentification221,
  PostalAddress24,
  AddressType2Code,
  PartyIdentification135,
  OrganisationIdentification29,
  PersonIdentification13,
  DateAndPlaceOfBirth1,
  GenericOrganisationIdentification1,
  GenericPersonIdentification1,
  CashAccount204,
  AccountIdentification47Choice,
  GenericAccountIdentification1,
  BranchAndFinancialInstitutionIdentification6,
  FinancialInstitutionIdentification18,
  ClearingSystemMemberIdentification2,
  BranchData3,
  CurrencyExchange12,
  RemittanceInformation16,
} from "./common.js";

// ─── Enums / String Literal Unions ────────────────────────────────────────────
export type {
  ChargeBearerType3Code,
  ChargeBearerType1Code,
  TransactionIndividualStatus9Code,
  TransactionIndividualStatus7Code,
  TransactionIndividualStatus4Code,
  GpiTransactionStatus,
  PaymentStatusReasonCode,
  PaymentStatusReason13Code,
  PaymentStatusReason12Code,
  SettlementMethod1Code,
  CreditDebitCode,
  BalanceType10Code,
  EntryStatus1Code,
  Priority2Code,
  Priority3Code,
  Instruction3Code,
  Instruction4Code,
  CancellationReason8Code,
  NotificationChannel,
  SubscriptionStatus,
} from "./enums.js";

// ─── ISO 20022 MX Message Types ───────────────────────────────────────────────
export type {
  // pacs.008 (FIToFI Customer Credit Transfer)
  FIToFICstmrCdtTrf,
  GroupHeader93,
  SettlementInstruction7,
  CreditTransferTransaction39,
  PaymentIdentification7,
  Charges2,
  // pacs.002 (Payment Status Report)
  FIToFIPmtStsRpt,
  GroupHeader91,
  OriginalGroupHeader14,
  PaymentTransaction120,
  StatusReasonInformation12,
  // camt.056 (FIToFI Payment Cancellation Request)
  FIToFIPmtCxlReq,
  CaseAssignment5,
  PaymentTransactionInformation31,
  PaymentCancellationReason5,
  // pain.001 (Customer Credit Transfer Initiation)
  CstmrCdtTrfInitn,
  GroupHeader85,
  PaymentInstruction30,
  CreditTransferTransaction45,
  PaymentIdentification6,
  // Shared
  SupplementaryData1,
  RegulatoryReporting3,
  TaxData1,
  RemittanceLocation7,
} from "./iso20022.js";

// ─── GPI (gpi for Corporates) Types ──────────────────────────────────────────
export type {
  PaymentStatus8,
  PaymentStatus14,
  PaymentEvent11,
  GpiCharge,
  PaymentTransaction116,
  PaymentTransaction115,
  PaymentTransactionV504,
  IncomingCustomerPaymentTransactionsResponse,
  CorporatePaymentTransactionsResponse,
  CancellationRequest,
  TransactionCancellationStatusResponse,
  GpiNotification,
  GpiSubscription,
  GpiSubscriptionUpdate,
  ActivateSubscriptionRequest,
  ActivatedSubscription,
} from "./gpi.js";

// ─── Security / Auth Types ────────────────────────────────────────────────────
export type {
  SWIFTOAuthToken,
  OAuthTokenRequest,
  SWIFTSessionConfig,
  SWIFTSession,
  CertificateHolder,
  PKCSKeystoreConfig,
  DigitalSignatureResult,
  LAUHeader,
  LAURequestInput,
  SWIFTOAuthScope,
  RMAAuthorization,
} from "./security.js";

export {
  SWIFT_OAUTH_SCOPES,
  SWIFT_GATEWAY_ENDPOINTS,
} from "./security.js";
