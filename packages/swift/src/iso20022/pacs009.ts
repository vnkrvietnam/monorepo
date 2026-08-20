import { XMLBuilder } from "fast-xml-parser";

/**
 * pacs.009.001 — Financial Institution Credit Transfer (ISO 20022 MX)
 *
 * Điện chuyển tiền liên ngân hàng (FI-to-FI), thường dùng làm cover payment
 * cho giao dịch pacs.008. Tương đương MT202 nhưng theo chuẩn MX.
 *
 * Vendor reference: swift-messaging-sdk-1.17.4.jar, message type pacs.009.001.08
 */
export interface Pacs009Payload {
  /** Unique message ID */
  msgId: string;
  /** ISO 8601 creation date-time */
  creDtTm?: string;
  /** Number of transactions */
  nbOfTxs?: number;
  /** Settlement method: CLRG | INDA | INGA */
  sttlmMtd?: string;
  /** Instruction identification */
  instrId: string;
  /** End-to-end identification */
  endToEndId: string;
  /** Transaction identification (UETR in gpi) */
  txId: string;
  /** Interbank settlement amount */
  intrBkSttlmAmt: number;
  /** ISO 4217 currency */
  currency: string;
  /** Settlement date YYYY-MM-DD */
  intrBkSttlmDt?: string;
  /** Instructing agent BIC */
  instgAgtBIC: string;
  /** Instructed agent BIC */
  instdAgtBIC: string;
  /** Debtor agent BIC */
  dbtrAgtBIC: string;
  /** Creditor agent BIC */
  cdtrAgtBIC: string;
  /** Creditor name */
  cdtrName: string;
  /** Creditor IBAN */
  cdtrAcctIBAN: string;
}

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
});

/**
 * Build pacs.009.001.08 Financial Institution Credit Transfer XML.
 */
export function buildPacs009(payload: Pacs009Payload): string {
  const {
    msgId,
    creDtTm = new Date().toISOString(),
    nbOfTxs = 1,
    sttlmMtd = "CLRG",
    instrId,
    endToEndId,
    txId,
    intrBkSttlmAmt,
    currency,
    intrBkSttlmDt = new Date().toISOString().split("T")[0],
    instgAgtBIC,
    instdAgtBIC,
    dbtrAgtBIC,
    cdtrAgtBIC,
    cdtrName,
    cdtrAcctIBAN,
  } = payload;

  const document = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    Document: {
      "@_xmlns": "urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08",
      FICdtTrf: {
        GrpHdr: {
          MsgId: msgId,
          CreDtTm: creDtTm,
          NbOfTxs: nbOfTxs,
          SttlmInf: { SttlmMtd: sttlmMtd },
          InstgAgt: { FinInstnId: { BICFI: instgAgtBIC } },
          InstdAgt: { FinInstnId: { BICFI: instdAgtBIC } },
        },
        CdtTrfTxInf: {
          PmtId: {
            InstrId: instrId,
            EndToEndId: endToEndId,
            TxId: txId,
          },
          IntrBkSttlmAmt: {
            "@_Ccy": currency,
            "#text": intrBkSttlmAmt.toFixed(2),
          },
          IntrBkSttlmDt: intrBkSttlmDt,
          DbtrAgt: { FinInstnId: { BICFI: dbtrAgtBIC } },
          CdtrAgt: { FinInstnId: { BICFI: cdtrAgtBIC } },
          Cdtr: { Nm: cdtrName },
          CdtrAcct: { Id: { IBAN: cdtrAcctIBAN } },
        },
      },
    },
  };

  return builder.build(document) as string;
}

/**
 * Parse inbound pacs.009 XML → plain object (full validation in swift-messaging-sdk JAR).
 */
export function parsePacs009(xml: string): Record<string, unknown> {
  const { XMLParser } = require("fast-xml-parser") as typeof import("fast-xml-parser");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  return parser.parse(xml) as Record<string, unknown>;
}
