/**
 * iso20022.ts — ISO 20022 MX message interfaces
 *
 * Covers: pacs.008, pacs.009, pacs.002, camt.053, camt.056, pain.001
 * Based on ISO 20022 SR 2024 specs and swift-messaging-sdk-1.17.4.jar structures.
 *
 * These are the full rich types for when you need to build or parse complete
 * ISO 20022 XML messages (vs. the lean builder payloads in ../types.ts).
 */

import type {
  ActiveOrHistoricCurrencyAndAmount,
  PartyIdentification221,
  CashAccount204,
  BranchAndFinancialInstitutionIdentification6,
  RemittanceInformation16,
} from "./common.js";

import type {
  SettlementMethod1Code,
  ChargeBearerType1Code,
  Priority2Code,
  Instruction3Code,
} from "./enums.js";

// ─── Group Header (shared across pacs/pain) ────────────────────────────────────

export interface GroupHeader93 {
  msgId: string;
  creDtTm: string;
  nbOfTxs: string | number;
  ctrlSum?: string;
  ttlIntrbkSttlmAmt?: ActiveOrHistoricCurrencyAndAmount;
  intrBkSttlmDt?: string;
  sttlmInf: SettlementInstruction7;
  pmtTpInf?: PaymentTypeInformation28;
  instgAgt?: BranchAndFinancialInstitutionIdentification6;
  instdAgt?: BranchAndFinancialInstitutionIdentification6;
}

export interface SettlementInstruction7 {
  sttlmMtd: SettlementMethod1Code;
  sttlmAcct?: CashAccount204;
  clrSys?: ClearingSystemIdentification3Choice;
  instgRmbrsmntAgt?: BranchAndFinancialInstitutionIdentification6;
  instgRmbrsmntAgtAcct?: CashAccount204;
  instdRmbrsmntAgt?: BranchAndFinancialInstitutionIdentification6;
  instdRmbrsmntAgtAcct?: CashAccount204;
  thrdRmbrsmntAgt?: BranchAndFinancialInstitutionIdentification6;
  thrdRmbrsmntAgtAcct?: CashAccount204;
}

export interface ClearingSystemIdentification3Choice {
  cd?: string;
  prtry?: string;
}

export interface PaymentTypeInformation28 {
  instr_prty?: Priority2Code;
  clrChanl?: ClearingChannel2Code;
  svcLvl?: ServiceLevel8Choice[];
  lclInstrm?: LocalInstrument2Choice;
  seqTp?: SequenceType3Code;
  ctgy_purp?: CategoryPurpose1Choice;
}

export type ClearingChannel2Code = "RTGS" | "RTNS" | "MPNS" | "BOOK";
export type SequenceType3Code = "FRST" | "RCUR" | "FNAL" | "OOFF" | "RPRE";

export interface ServiceLevel8Choice {
  cd?: string;
  prtry?: string;
}

export interface LocalInstrument2Choice {
  cd?: string;
  prtry?: string;
}

export interface CategoryPurpose1Choice {
  cd?: string;
  prtry?: string;
}

// ─── pacs.008.001 — FIToFI Customer Credit Transfer ───────────────────────────

export interface FIToFICstmrCdtTrf {
  grpHdr: GroupHeader93;
  cdtTrfTxInf: CreditTransferTransaction39[];
  splmtryData?: SupplementaryData1[];
}

export interface CreditTransferTransaction39 {
  pmtId: PaymentIdentification7;
  pmtTpInf?: PaymentTypeInformation28;
  intrBkSttlmAmt: ActiveOrHistoricCurrencyAndAmount;
  intrBkSttlmDt?: string;
  sttlmPrty?: Priority3Code;
  sttlmTmIndctn?: SettlementDateTimeIndication1;
  sttlmTmReq?: SettlementTimeRequest2;
  accptncDtTm?: string;
  poolgAdjstmntDt?: string;
  instdAmt?: ActiveOrHistoricCurrencyAndAmount;
  xchgRate?: string;
  chrgBr: ChargeBearerType1Code;
  chrgsInf?: Charges2[];
  dbtr: PartyIdentification221;
  dbtrAcct?: CashAccount204;
  dbtrAgt: BranchAndFinancialInstitutionIdentification6;
  dbtrAgtAcct?: CashAccount204;
  prvsInstgAgt1?: BranchAndFinancialInstitutionIdentification6;
  prvsInstgAgt1Acct?: CashAccount204;
  prvsInstgAgt2?: BranchAndFinancialInstitutionIdentification6;
  prvsInstgAgt2Acct?: CashAccount204;
  prvsInstgAgt3?: BranchAndFinancialInstitutionIdentification6;
  prvsInstgAgt3Acct?: CashAccount204;
  intrmyAgt1?: BranchAndFinancialInstitutionIdentification6;
  intrmyAgt1Acct?: CashAccount204;
  intrmyAgt2?: BranchAndFinancialInstitutionIdentification6;
  intrmyAgt2Acct?: CashAccount204;
  intrmyAgt3?: BranchAndFinancialInstitutionIdentification6;
  intrmyAgt3Acct?: CashAccount204;
  cdtrAgt: BranchAndFinancialInstitutionIdentification6;
  cdtrAgtAcct?: CashAccount204;
  cdtr: PartyIdentification221;
  cdtrAcct?: CashAccount204;
  ultmtCdtr?: PartyIdentification221;
  instrForCdtrAgt?: InstructionForCreditorAgent1[];
  instrForNxtAgt?: InstructionForNextAgent1[];
  purp?: Purpose2Choice;
  rgltryRptg?: RegulatoryReporting3[];
  tax?: TaxData1;
  rltdRmtInf?: RemittanceLocation7[];
  rmtInf?: RemittanceInformation16;
  splmtryData?: SupplementaryData1[];
}

export type Priority3Code = "HIGH" | "NORM" | "URGT";

export interface PaymentIdentification7 {
  instrId?: string;
  endToEndId: string;
  txId: string;
  uetr?: string;
  clrSysRef?: string;
}

export interface SettlementDateTimeIndication1 {
  cdtDtTm?: string;
  dbtDtTm?: string;
}

export interface SettlementTimeRequest2 {
  clsTm?: string;
  tilTm?: string;
  frTm?: string;
  rjctTm?: string;
}

export interface Charges2 {
  amt: ActiveOrHistoricCurrencyAndAmount;
  agt: BranchAndFinancialInstitutionIdentification6;
}

export interface InstructionForCreditorAgent1 {
  cd?: Instruction3Code;
  instrInf?: string;
}

export interface InstructionForNextAgent1 {
  cd?: Instruction3Code;
  instrInf?: string;
}

export interface Purpose2Choice {
  cd?: string;
  prtry?: string;
}

export interface RegulatoryReporting3 {
  dbtCdtRptgInd?: string;
  authrty?: RegulatoryAuthority2;
  dtls?: StructuredRegulatoryReporting3[];
}

export interface RegulatoryAuthority2 {
  nm?: string;
  ctry?: string;
}

export interface StructuredRegulatoryReporting3 {
  tp?: string;
  dt?: string;
  ctry?: string;
  cd?: string;
  amt?: ActiveOrHistoricCurrencyAndAmount;
  inf?: string[];
}

export interface TaxData1 {
  cdtr?: TaxParty1Iso;
  dbtr?: TaxParty2Iso;
  ultmtDbtr?: TaxParty2Iso;
  admstnZone?: string;
  refNb?: string;
  mtd?: string;
  ttlTaxblBaseAmt?: ActiveOrHistoricCurrencyAndAmount;
  ttlTaxAmt?: ActiveOrHistoricCurrencyAndAmount;
  dt?: string;
  seqNb?: string;
  rcrd?: TaxRecord3[];
}

export interface TaxParty1Iso {
  taxId?: string;
  regnId?: string;
  taxTp?: string;
}

export interface TaxParty2Iso {
  taxId?: string;
  regnId?: string;
  taxTp?: string;
}

export interface TaxRecord3 {
  tp?: string;
  ctgy?: string;
  ctgyDtls?: string;
  dbtrSts?: string;
  certId?: string;
  frmsCd?: string;
  prd?: TaxPeriod3;
  taxAmt?: TaxAmount3;
  addtlInf?: string;
}

export interface TaxPeriod3 {
  yr?: string;
  tp?: string;
  frToDt?: DatePeriod3;
}

export interface DatePeriod3 {
  frDt?: string;
  toDt?: string;
}

export interface TaxAmount3 {
  rate?: string;
  taxblBaseAmt?: ActiveOrHistoricCurrencyAndAmount;
  ttlAmt?: ActiveOrHistoricCurrencyAndAmount;
  dtls?: TaxRecordDetails3[];
}

export interface TaxRecordDetails3 {
  prd?: TaxPeriod3;
  amt?: ActiveOrHistoricCurrencyAndAmount;
}

export interface RemittanceLocation7 {
  rmtId?: string;
  rmtLctnDtls?: RemittanceLocationData1[];
}

export interface RemittanceLocationData1 {
  mtd?: string;
  elctrncAdr?: string;
  pstlAdr?: NameAndAddress16;
}

export interface NameAndAddress16 {
  nm?: string;
  adr?: PostalAddress24Iso;
}

export interface PostalAddress24Iso {
  adrTp?: string;
  dept?: string;
  subDept?: string;
  strtNm?: string;
  bldgNb?: string;
  bldgNm?: string;
  flr?: string;
  pstBx?: string;
  room?: string;
  pstCd?: string;
  twnNm?: string;
  twnLctnNm?: string;
  dstrctNm?: string;
  ctrySubDvsn?: string;
  ctry?: string;
  adrLine?: string[];
}

export interface SupplementaryData1 {
  plcAndNm?: string;
  envlp?: SupplementaryDataEnvelope1;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SupplementaryDataEnvelope1 extends Record<string, unknown> {}

// ─── pacs.002.001 — FIToFI Payment Status Report ──────────────────────────────

export interface FIToFIPmtStsRpt {
  grpHdr: GroupHeader91;
  orgnlGrpInfAndSts?: OriginalGroupHeader14;
  txInfAndSts?: PaymentTransaction120[];
}

export interface GroupHeader91 {
  msgId: string;
  creDtTm: string;
  instgAgt?: BranchAndFinancialInstitutionIdentification6;
  instdAgt?: BranchAndFinancialInstitutionIdentification6;
}

export interface OriginalGroupHeader14 {
  orgnlMsgId: string;
  orgnlMsgNmId: string;
  orgnlCreDtTm?: string;
  orgnlNbOfTxs?: string;
  orgnlCtrlSum?: string;
  grpSts?: string;
  stsRsnInf?: StatusReasonInformation12[];
}

export interface PaymentTransaction120 {
  stsId?: string;
  orgnlInstrId?: string;
  orgnlEndToEndId?: string;
  orgnlTxId?: string;
  orgnlUETR?: string;
  txSts?: string;
  stsRsnInf?: StatusReasonInformation12[];
  chrgsInf?: Charges2[];
  accptncDtTm?: string;
  accdWithInstrn?: string;
  orgnlTxRef?: OriginalTransactionReference27;
}

export interface StatusReasonInformation12 {
  orgtr?: PartyIdentification221;
  rsn?: StatusReason6Choice;
  addtlInf?: string[];
}

export interface StatusReason6Choice {
  cd?: string;
  prtry?: string;
}

export interface OriginalTransactionReference27 {
  intrBkSttlmAmt?: ActiveOrHistoricCurrencyAndAmount;
  amt?: AmountType4Choice;
  intrBkSttlmDt?: string;
  reqExctnDt?: DateAndDateTime2Choice;
  dbtr?: PartyIdentification221;
  dbtrAcct?: CashAccount204;
  dbtrAgt?: BranchAndFinancialInstitutionIdentification6;
  cdtrAgt?: BranchAndFinancialInstitutionIdentification6;
  cdtr?: PartyIdentification221;
  cdtrAcct?: CashAccount204;
  ultmtDbtr?: PartyIdentification221;
  ultmtCdtr?: PartyIdentification221;
  purp?: Purpose2Choice;
  undrlygCstmrCdtTrf?: CreditTransferTransaction39;
}

export interface AmountType4Choice {
  instdAmt?: ActiveOrHistoricCurrencyAndAmount;
  eqvtAmt?: EquivalentAmount2;
}

export interface EquivalentAmount2 {
  amt: ActiveOrHistoricCurrencyAndAmount;
  ccy: string;
}

export interface DateAndDateTime2Choice {
  dt?: string;
  dtTm?: string;
}

// ─── camt.056 — FIToFI Payment Cancellation Request ───────────────────────────

export interface FIToFIPmtCxlReq {
  assgnmt: CaseAssignment5;
  case?: Case5;
  undrlygGrpInf?: UnderlyingGroupInformation1;
  orgnlGrpInfAndCxl?: OriginalGroupHeader15;
  txInf?: PaymentTransactionInformation31[];
}

export interface CaseAssignment5 {
  id: string;
  assgnr: Party40Choice;
  assgne: Party40Choice;
  creDtTm: string;
}

export interface Party40Choice {
  pty?: PartyIdentification221;
  agt?: BranchAndFinancialInstitutionIdentification6;
}

export interface Case5 {
  id: string;
  cretr: Party40Choice;
  reopCaseIndctn?: boolean;
}

export interface UnderlyingGroupInformation1 {
  orgnlMsgId: string;
  orgnlMsgNmId: string;
  orgnlCreDtTm?: string;
}

export interface OriginalGroupHeader15 {
  grpCxlId?: string;
  case?: Case5;
  orgnlMsgId: string;
  orgnlMsgNmId: string;
  orgnlCreDtTm?: string;
  nbOfTxs?: string;
  cxlRsnInf?: PaymentCancellationReason5[];
}

export interface PaymentTransactionInformation31 {
  cxlId?: string;
  case?: Case5;
  orgnlGrpInf?: OriginalGroupInformation29;
  orgnlInstrId?: string;
  orgnlEndToEndId?: string;
  orgnlTxId?: string;
  orgnlUETR?: string;
  orgnlClrSysRef?: string;
  orgnlIntrBkSttlmAmt?: ActiveOrHistoricCurrencyAndAmount;
  orgnlIntrBkSttlmDt?: string;
  assgnrTx?: TransactionParties7;
  assgneeTx?: TransactionParties7;
  cxlRsnInf?: PaymentCancellationReason5[];
  orgnlTxRef?: OriginalTransactionReference27;
  splmtryData?: SupplementaryData1[];
}

export interface OriginalGroupInformation29 {
  orgnlMsgId: string;
  orgnlMsgNmId: string;
}

export interface TransactionParties7 {
  ultmtDbtr?: PartyIdentification221;
  dbtr?: Party40Choice;
  dbtrAcct?: CashAccount204;
  dbtrAgt?: BranchAndFinancialInstitutionIdentification6;
  dbtrAgtAcct?: CashAccount204;
  prvsInstgAgt1?: BranchAndFinancialInstitutionIdentification6;
  prvsInstgAgt1Acct?: CashAccount204;
  intrmyAgt1?: BranchAndFinancialInstitutionIdentification6;
  intrmyAgt1Acct?: CashAccount204;
  cdtrAgt?: BranchAndFinancialInstitutionIdentification6;
  cdtrAgtAcct?: CashAccount204;
  cdtr?: Party40Choice;
  cdtrAcct?: CashAccount204;
  ultmtCdtr?: PartyIdentification221;
}

export interface PaymentCancellationReason5 {
  orgtr?: PartyIdentification221;
  rsn?: CancellationReason33Choice;
  addtlInf?: string[];
}

export interface CancellationReason33Choice {
  cd?: string;
  prtry?: string;
}

// ─── pain.001 — Customer Credit Transfer Initiation ───────────────────────────

export interface CstmrCdtTrfInitn {
  grpHdr: GroupHeader85;
  pmtInf: PaymentInstruction30[];
  splmtryData?: SupplementaryData1[];
}

export interface GroupHeader85 {
  msgId: string;
  creDtTm: string;
  authstn?: Authorisation1Choice[];
  nbOfTxs: string | number;
  ctrlSum?: string;
  initgPty: PartyIdentification221;
  fwdgAgt?: BranchAndFinancialInstitutionIdentification6;
}

export interface Authorisation1Choice {
  cd?: string;
  prtry?: string;
}

export interface PaymentInstruction30 {
  pmtInfId: string;
  pmtMtd: string;
  batchBookg?: boolean;
  nbOfTxs?: string;
  ctrlSum?: string;
  pmtTpInf?: PaymentTypeInformation26;
  reqExctnDt?: DateAndDateTime2Choice;
  poolgAdjstmntDt?: string;
  dbtr: PartyIdentification221;
  dbtrAcct: CashAccount204;
  dbtrAgt: BranchAndFinancialInstitutionIdentification6;
  dbtrAgtAcct?: CashAccount204;
  instrForDbtrAgt?: string;
  ultmtDbtr?: PartyIdentification221;
  chrgBr?: ChargeBearerType1Code;
  chrgsAcct?: CashAccount204;
  chrgsAcctAgt?: BranchAndFinancialInstitutionIdentification6;
  cdtTrfTxInf: CreditTransferTransaction45[];
}

export interface PaymentTypeInformation26 {
  instrPrty?: Priority2Code;
  svcLvl?: ServiceLevel8Choice[];
  lclInstrm?: LocalInstrument2Choice;
  seqTp?: string;
  ctgyPurp?: CategoryPurpose1Choice;
}

export interface CreditTransferTransaction45 {
  pmtId: PaymentIdentification6;
  pmtTpInf?: PaymentTypeInformation26;
  amt: AmountType4Choice;
  xchgRateInf?: ExchangeRate1;
  chrgBr?: ChargeBearerType1Code;
  mndt?: CreditTransferMandateData1;
  chqInstr?: Cheque11;
  ultmtDbtr?: PartyIdentification221;
  intrmyAgt1?: BranchAndFinancialInstitutionIdentification6;
  intrmyAgt1Acct?: CashAccount204;
  intrmyAgt2?: BranchAndFinancialInstitutionIdentification6;
  intrmyAgt2Acct?: CashAccount204;
  intrmyAgt3?: BranchAndFinancialInstitutionIdentification6;
  intrmyAgt3Acct?: CashAccount204;
  cdtrAgt?: BranchAndFinancialInstitutionIdentification6;
  cdtrAgtAcct?: CashAccount204;
  cdtr?: PartyIdentification221;
  cdtrAcct?: CashAccount204;
  ultmtCdtr?: PartyIdentification221;
  instrForCdtrAgt?: InstructionForCreditorAgent1[];
  instrForDbtrAgt?: string;
  purp?: Purpose2Choice;
  rgltryRptg?: RegulatoryReporting3[];
  tax?: TaxData1;
  rltdRmtInf?: RemittanceLocation7[];
  rmtInf?: RemittanceInformation16;
  splmtryData?: SupplementaryData1[];
}

export interface PaymentIdentification6 {
  instrId?: string;
  endToEndId: string;
  uetr?: string;
}

export interface ExchangeRate1 {
  unitCcy?: string;
  xchgRate?: string;
  rateTp?: string;
  ctrctId?: string;
}

export interface CreditTransferMandateData1 {
  mndtId?: string;
  tp?: MandateTypeInformation2;
  dtOfSgntr?: string;
  dtOfVrfctn?: string;
  elctrncSgntr?: string;
  frDt?: string;
  toDt?: string;
  adjustmentIndicator?: boolean;
  adjstmntDscnt?: DiscountAmountAndType1Iso;
  elctrncSgntrTp?: string;
  frst_pmt_dt?: string;
  fnl_pmt_dt?: string;
  fncy?: boolean;
  rsn?: MandateSetupReason1Choice;
  trckg?: boolean;
}

export interface MandateTypeInformation2 {
  svcLvl?: ServiceLevel8Choice;
  lclInstrm?: LocalInstrument2Choice;
  ctgyPurp?: CategoryPurpose1Choice;
  clssfctn?: MandateClassification1Choice;
}

export interface MandateClassification1Choice {
  cd?: string;
  prtry?: string;
}

export interface DiscountAmountAndType1Iso {
  tp?: string;
  amt?: ActiveOrHistoricCurrencyAndAmount;
}

export interface MandateSetupReason1Choice {
  cd?: string;
  prtry?: string;
}

export interface Cheque11 {
  chqTp?: string;
  chqNb?: string;
  chqFr?: NameAndAddress16;
  dlvryMtd?: ChequeDeliveryMethod1Choice;
  dlvrTo?: NameAndAddress16;
  instrPrty?: Priority2Code;
  chqMtrtyDt?: string;
  frmsCd?: string;
  mmoCd?: string;
  rgnlClrZone?: string;
  prtLctn?: string;
  sgntr?: string[];
}

export interface ChequeDeliveryMethod1Choice {
  cd?: string;
  prtry?: string;
}
