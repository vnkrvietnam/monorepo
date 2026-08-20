/**
 * common.ts — Shared ISO 20022 primitive types & common structures
 *
 * Converted from Java model classes:
 *   ActiveOrHistoricCurrencyAndAmount  (g4c v3 + v4)
 *   ActiveCurrencyAndAmount            (g4c v504)
 *   PartyIdentification221
 *   CashAccount204
 *   AccountIdentification47Choice
 *   BranchAndFinancialInstitutionIdentification
 */

// ─── Monetary Amount Types ─────────────────────────────────────────────────────

/**
 * A number of monetary units in an active or historic ISO 4217 currency.
 * `amount` is kept as `string` to prevent floating-point precision loss
 * for large fiat/crypto amounts.
 *
 * Source: ActiveOrHistoricCurrencyAndAmount.java (g4c v3/v4)
 */
export interface ActiveOrHistoricCurrencyAndAmount {
  /** ISO 4217 currency code, e.g. "USD", "VND" */
  currency?: string;
  /** Decimal amount string, e.g. "1500000.00" */
  amount?: string;
}

/**
 * A number of monetary units in an active (non-historic) ISO 4217 currency.
 *
 * Source: ActiveCurrencyAndAmount.java (g4c v504)
 */
export interface ActiveCurrencyAndAmount {
  /** ISO 4217 currency code */
  currency?: string;
  /** Decimal amount string */
  amount?: string;
}

// ─── Party Identification ──────────────────────────────────────────────────────

/**
 * Unique and unambiguous identification of a party.
 *
 * Source: PartyIdentification221.java (g4c v3/v4/v504)
 */
export interface PartyIdentification221 {
  /** Full legal name of the party (max 140 chars) */
  name?: string;
  /** BIC-11 code of the party's financial institution */
  lei?: string;
  /** Postal address */
  postalAddress?: PostalAddress24;
  /** Party identification — private, organisation, or agent */
  id?: PartyIdentification135;
  /** Country of residence (ISO 3166 alpha-2) */
  countryOfResidence?: string;
}

/** Postal address structure per ISO 20022 PostalAddress24 */
export interface PostalAddress24 {
  addressType?: AddressType2Code;
  department?: string;
  subDepartment?: string;
  streetName?: string;
  buildingNumber?: string;
  buildingName?: string;
  floor?: string;
  postBox?: string;
  room?: string;
  postCode?: string;
  townName?: string;
  townLocationName?: string;
  districtName?: string;
  countrySubDivision?: string;
  /** ISO 3166 alpha-2 country code */
  country?: string;
  addressLine?: string[];
}

/** Address type codes per ISO 20022 */
export type AddressType2Code =
  | "ADDR" // Postal
  | "PBOX" // POBox
  | "HOME" // Residential
  | "BIZZ" // Business
  | "MLTO" // MailTo
  | "DLVY"; // DeliveryTo

/** Party identification choice */
export interface PartyIdentification135 {
  orgId?: OrganisationIdentification29;
  prvtId?: PersonIdentification13;
}

/** Organisation identification */
export interface OrganisationIdentification29 {
  anyBIC?: string;
  lei?: string;
  othr?: GenericOrganisationIdentification1[];
}

/** Person identification */
export interface PersonIdentification13 {
  dtAndPlcOfBirth?: DateAndPlaceOfBirth1;
  othr?: GenericPersonIdentification1[];
}

export interface DateAndPlaceOfBirth1 {
  birthDt?: string;
  prvcOfBirth?: string;
  cityOfBirth?: string;
  ctryOfBirth?: string;
}

export interface GenericOrganisationIdentification1 {
  id?: string;
  schmeNm?: OrganisationIdentificationSchemeName1Choice;
  issr?: string;
}

export interface GenericPersonIdentification1 {
  id?: string;
  schmeNm?: PersonIdentificationSchemeName1Choice;
  issr?: string;
}

export interface OrganisationIdentificationSchemeName1Choice {
  cd?: string;
  prtry?: string;
}

export interface PersonIdentificationSchemeName1Choice {
  cd?: string;
  prtry?: string;
}

// ─── Cash Account ──────────────────────────────────────────────────────────────

/**
 * Cash account details.
 *
 * Source: CashAccount204.java (g4c v3/v4)
 */
export interface CashAccount204 {
  id?: AccountIdentification47Choice;
  tp?: CashAccountType2Choice;
  ccy?: string;
  nm?: string;
  prxy?: ProxyAccountIdentification1;
}

/**
 * Account identification — IBAN or Other.
 * Discriminated union pattern (only one field populated at a time).
 *
 * Source: AccountIdentification47Choice.java (g4c v3/v4)
 */
export interface AccountIdentification47Choice {
  /** IBAN (max 34 chars) */
  IBAN?: string;
  /** Other identification */
  othr?: GenericAccountIdentification1;
}

export interface GenericAccountIdentification1 {
  id?: string;
  schmeNm?: AccountSchemeName1Choice;
  issr?: string;
}

export interface AccountSchemeName1Choice {
  cd?: string;
  prtry?: string;
}

export interface CashAccountType2Choice {
  cd?: string;
  prtry?: string;
}

export interface ProxyAccountIdentification1 {
  tp?: ProxyAccountType1Choice;
  id?: string;
}

export interface ProxyAccountType1Choice {
  cd?: string;
  prtry?: string;
}

// ─── Financial Institution Identification ──────────────────────────────────────

/**
 * Branch and financial institution identification.
 */
export interface BranchAndFinancialInstitutionIdentification6 {
  finInstnId?: FinancialInstitutionIdentification18;
  brnchId?: BranchData3;
}

export interface FinancialInstitutionIdentification18 {
  BICFI?: string;
  clrSysMmbId?: ClearingSystemMemberIdentification2;
  LEI?: string;
  nm?: string;
  postalAddress?: PostalAddress24;
  othr?: GenericFinancialIdentification1;
}

export interface ClearingSystemMemberIdentification2 {
  clrSysId?: ClearingSystemIdentification2Choice;
  mmbId?: string;
}

export interface ClearingSystemIdentification2Choice {
  cd?: string;
  prtry?: string;
}

export interface GenericFinancialIdentification1 {
  id?: string;
  schmeNm?: FinancialIdentificationSchemeName1Choice;
  issr?: string;
}

export interface FinancialIdentificationSchemeName1Choice {
  cd?: string;
  prtry?: string;
}

export interface BranchData3 {
  id?: string;
  LEI?: string;
  nm?: string;
  postalAddress?: PostalAddress24;
}

// ─── Currency Exchange ──────────────────────────────────────────────────────────

/**
 * Currency exchange rate details.
 *
 * Source: CurrencyExchange12.java (g4c v3/v4)
 */
export interface CurrencyExchange12 {
  /** Source currency ISO 4217 */
  srcCcy?: string;
  /** Target currency ISO 4217 */
  trgtCcy?: string;
  /** Unit currency ISO 4217 */
  unitCcy?: string;
  /** Exchange rate as string (precision-safe) */
  xchgRate?: string;
  /** Contract identification */
  ctrctId?: string;
  /** Quote date/time ISO 8601 */
  qtnDt?: string;
}

// ─── Remittance Info ──────────────────────────────────────────────────────────

export interface RemittanceInformation16 {
  ustrd?: string[];
  strd?: StructuredRemittanceInformation16[];
}

export interface StructuredRemittanceInformation16 {
  rfrdDocInf?: ReferredDocumentInformation7[];
  rfrdDocAmt?: RemittanceAmount2;
  cdtrRefInf?: CreditorReferenceInformation2;
  invcr?: PartyIdentification221;
  invcee?: PartyIdentification221;
  taxRmt?: TaxInformation7;
  garnteeOfPmt?: Garnishment3;
  addtlRmtInf?: string[];
}

export interface ReferredDocumentInformation7 {
  tp?: ReferredDocumentType4;
  nb?: string;
  rltdDt?: string;
  lineDtls?: DocumentLineInformation1[];
}

export interface ReferredDocumentType4 {
  cdOrPrtry?: ReferredDocumentType3Choice;
  issr?: string;
}

export interface ReferredDocumentType3Choice {
  cd?: string;
  prtry?: string;
}

export interface DocumentLineInformation1 {
  id?: DocumentLineIdentification1[];
  desc?: string;
  amt?: RemittanceAmount3;
}

export interface DocumentLineIdentification1 {
  tp?: DocumentLineType1;
  nb?: string;
  rltdDt?: string;
}

export interface DocumentLineType1 {
  cdOrPrtry?: DocumentLineType1Choice;
  issr?: string;
}

export interface DocumentLineType1Choice {
  cd?: string;
  prtry?: string;
}

export interface RemittanceAmount2 {
  duePyblAmt?: ActiveOrHistoricCurrencyAndAmount;
  dscntApldAmt?: DiscountAmountAndType1[];
  credtNoteAmt?: ActiveOrHistoricCurrencyAndAmount;
  taxAmt?: TaxAmountAndType1[];
  adjstmntAmtAndRsn?: DocumentAdjustment1[];
  rmtdAmt?: ActiveOrHistoricCurrencyAndAmount;
}

export interface RemittanceAmount3 {
  duePyblAmt?: ActiveOrHistoricCurrencyAndAmount;
  dscntApldAmt?: DiscountAmountAndType1[];
  credtNoteAmt?: ActiveOrHistoricCurrencyAndAmount;
  taxAmt?: TaxAmountAndType1[];
  adjstmntAmtAndRsn?: DocumentAdjustment1[];
  rmtdAmt?: ActiveOrHistoricCurrencyAndAmount;
}

export interface DiscountAmountAndType1 {
  tp?: DiscountAmountType1Choice;
  amt?: ActiveOrHistoricCurrencyAndAmount;
}

export interface DiscountAmountType1Choice {
  cd?: string;
  prtry?: string;
}

export interface TaxAmountAndType1 {
  tp?: TaxAmountType1Choice;
  amt?: ActiveOrHistoricCurrencyAndAmount;
}

export interface TaxAmountType1Choice {
  cd?: string;
  prtry?: string;
}

export interface DocumentAdjustment1 {
  amt?: ActiveOrHistoricCurrencyAndAmount;
  crdtDbtInd?: string;
  rsn?: string;
  addtlInf?: string;
}

export interface CreditorReferenceInformation2 {
  tp?: CreditorReferenceType2;
  ref?: string;
}

export interface CreditorReferenceType2 {
  cdOrPrtry?: CreditorReferenceType1Choice;
  issr?: string;
}

export interface CreditorReferenceType1Choice {
  cd?: string;
  prtry?: string;
}

export interface TaxInformation7 {
  cdtr?: TaxParty1;
  dbtr?: TaxParty2;
  ultmtDbtr?: TaxParty2;
  admstnZone?: string;
  refNb?: string;
  mtd?: string;
  ttlTaxblBaseAmt?: ActiveOrHistoricCurrencyAndAmount;
  ttlTaxAmt?: ActiveOrHistoricCurrencyAndAmount;
  dt?: string;
  seqNb?: string;
  rcrd?: TaxRecord2[];
}

export interface TaxParty1 {
  taxId?: string;
  regnId?: string;
  taxTp?: string;
}

export interface TaxParty2 {
  taxId?: string;
  regnId?: string;
  taxTp?: string;
  authstn?: TaxAuthorisation1;
}

export interface TaxAuthorisation1 {
  titl?: string;
  nm?: string;
}

export interface TaxRecord2 {
  tp?: string;
  ctgy?: string;
  ctgyDtls?: string;
  dbtrSts?: string;
  certId?: string;
  frmsCd?: string;
  prd?: TaxPeriod2;
  taxAmt?: TaxAmount2;
  addtlInf?: string;
}

export interface TaxPeriod2 {
  yr?: string;
  tp?: string;
  frToDt?: DatePeriod2;
}

export interface DatePeriod2 {
  frDt?: string;
  toDt?: string;
}

export interface TaxAmount2 {
  rate?: string;
  taxblBaseAmt?: ActiveOrHistoricCurrencyAndAmount;
  ttlAmt?: ActiveOrHistoricCurrencyAndAmount;
  dtls?: TaxRecordDetails2[];
}

export interface TaxRecordDetails2 {
  prd?: TaxPeriod2;
  amt?: ActiveOrHistoricCurrencyAndAmount;
}

export interface Garnishment3 {
  tp?: GarnishmentType1;
  grnshee?: PartyIdentification221;
  grnshmt?: PartyIdentification221;
  grnshee2?: PartyIdentification221;
  dt?: string;
  rmtd?: ActiveOrHistoricCurrencyAndAmount;
  fmlyMdclInsrncInd?: boolean;
  mplyeeTermntnInd?: boolean;
}

export interface GarnishmentType1 {
  cdOrPrtry?: GarnishmentType1Choice;
  issr?: string;
}

export interface GarnishmentType1Choice {
  cd?: string;
  prtry?: string;
}
