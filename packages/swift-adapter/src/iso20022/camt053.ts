import { XMLBuilder } from "fast-xml-parser";

/**
 * camt.053.001 — Bank-to-Customer Statement (ISO 20022 MX)
 *
 * Tương đương ISO 20022 của MT940 — ngân hàng gửi thông báo sao kê tài khoản
 * cho khách hàng/correspondent. Sử dụng trong SEPA, TARGET2, SWIFTNet.
 *
 * Vendor reference: swift-messaging-sdk-1.17.4.jar, message type camt.053.001.08
 */

export interface Camt053Entry {
  /** Số tiền giao dịch */
  amount: number;
  /** ISO 4217 currency */
  currency: string;
  /** CRDT = Credit, DBIT = Debit */
  creditDebitIndicator: "CRDT" | "DBIT";
  /** Trạng thái: BOOK = đã đặt bút, PDNG = pending */
  status: "BOOK" | "PDNG";
  /** Ngày đặt bút ISO 8601 */
  bookingDate: string;
  /** Ngày valeur ISO 8601 */
  valueDate: string;
  /** Account Servicer Reference */
  accountServicerRef?: string;
  /** End-to-end reference */
  endToEndId?: string;
  /** Mã loại giao dịch ISO (VD: ESCT, DMCT, SWEP) */
  bankTransactionCode?: string;
  /** Thông tin bổ sung */
  additionalEntryInfo?: string;
}

export interface Camt053Payload {
  /** Message ID */
  msgId: string;
  /** Thời điểm tạo */
  creDtTm?: string;
  /** Message pagination, VD: "1/1" */
  msgPgntn?: string;
  /** Statement ID */
  stmtId: string;
  /** Số thứ tự statement (số nguyên) */
  seqNb?: number;
  /** Ngày bắt đầu kỳ sao kê YYYY-MM-DD */
  frDt: string;
  /** Ngày kết thúc kỳ sao kê YYYY-MM-DD */
  toDt: string;
  /** IBAN tài khoản */
  accountIBAN: string;
  /** BIC ngân hàng nắm giữ tài khoản */
  servicerBIC: string;
  /** Số dư đầu kỳ */
  openingBalanceAmt: number;
  openingBalanceCurrency: string;
  openingBalanceDC: "CRDT" | "DBIT";
  openingBalanceDate: string;
  /** Số dư cuối kỳ */
  closingBalanceAmt: number;
  closingBalanceCurrency: string;
  closingBalanceDC: "CRDT" | "DBIT";
  closingBalanceDate: string;
  /** Danh sách giao dịch */
  entries: Camt053Entry[];
}

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
});

/**
 * Build camt.053.001.08 Bank-to-Customer Statement XML.
 */
export function buildCamt053(payload: Camt053Payload): string {
  const {
    msgId,
    creDtTm = new Date().toISOString(),
    msgPgntn = "1/1",
    stmtId,
    seqNb = 1,
    frDt,
    toDt,
    accountIBAN,
    servicerBIC,
    openingBalanceAmt,
    openingBalanceCurrency,
    openingBalanceDC,
    openingBalanceDate,
    closingBalanceAmt,
    closingBalanceCurrency,
    closingBalanceDC,
    closingBalanceDate,
    entries,
  } = payload;

  const entryNodes = entries.map((e) => ({
    Amt: { "@_Ccy": e.currency, "#text": e.amount.toFixed(2) },
    CdtDbtInd: e.creditDebitIndicator,
    Sts: { Cd: e.status },
    BookgDt: { Dt: e.bookingDate },
    ValDt: { Dt: e.valueDate },
    ...(e.accountServicerRef ? { AcctSvcrRef: e.accountServicerRef } : {}),
    BkTxCd: e.bankTransactionCode
      ? { Domn: { Cd: "PMNT", Fmly: { Cd: e.bankTransactionCode, SubFmlyCd: "OTHR" } } }
      : { Domn: { Cd: "PMNT", Fmly: { Cd: "MCOP", SubFmlyCd: "OTHR" } } },
    NtryDtls: {
      TxDtls: {
        Refs: { EndToEndId: e.endToEndId ?? "NOTPROVIDED" },
        ...(e.additionalEntryInfo ? { AddtlTxInf: e.additionalEntryInfo } : {}),
      },
    },
  }));

  const document = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    Document: {
      "@_xmlns": "urn:iso:std:iso:20022:tech:xsd:camt.053.001.08",
      BkToCstmrStmt: {
        GrpHdr: {
          MsgId: msgId,
          CreDtTm: creDtTm,
          MsgPgntn: { PgNb: msgPgntn, LastPgInd: true },
        },
        Stmt: {
          Id: stmtId,
          SeqNb: seqNb,
          Acct: {
            Id: { IBAN: accountIBAN },
            Svcr: { FinInstnId: { BICFI: servicerBIC } },
          },
          Bal: [
            {
              // OPBD = Opening Booked
              Tp: { CdOrPrtry: { Cd: "OPBD" } },
              Amt: { "@_Ccy": openingBalanceCurrency, "#text": openingBalanceAmt.toFixed(2) },
              CdtDbtInd: openingBalanceDC,
              Dt: { Dt: openingBalanceDate },
            },
            {
              // CLBD = Closing Booked
              Tp: { CdOrPrtry: { Cd: "CLBD" } },
              Amt: { "@_Ccy": closingBalanceCurrency, "#text": closingBalanceAmt.toFixed(2) },
              CdtDbtInd: closingBalanceDC,
              Dt: { Dt: closingBalanceDate },
            },
          ],
          TxsSummry: {
            TtlDbtNtries: { NbOfNtries: entries.filter((e) => e.creditDebitIndicator === "DBIT").length },
            TtlCdtNtries: { NbOfNtries: entries.filter((e) => e.creditDebitIndicator === "CRDT").length },
          },
          Ntry: entryNodes,
          FrToDt: { FrDtTm: `${frDt}T00:00:00Z`, ToDtTm: `${toDt}T23:59:59Z` },
        },
      },
    },
  };

  return builder.build(document) as string;
}

/**
 * Parse inbound camt.053 XML → plain object.
 */
export function parseCamt053(xml: string): Record<string, unknown> {
  const { XMLParser } = require("fast-xml-parser") as typeof import("fast-xml-parser");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  return parser.parse(xml) as Record<string, unknown>;
}
