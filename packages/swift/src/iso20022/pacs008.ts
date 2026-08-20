import { XMLBuilder } from "fast-xml-parser";
import type { Pacs008Payload } from "../types.js";

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
});

/**
 * Builds a pacs.008.001.08 FIToFI Customer Credit Transfer XML message.
 *
 * Used for ISO 20022 MX payment routing through SWIFT gpi / SWIFTNet
 * as mandated by the CBDC / RT1 corridor for VNKR Institutional Banking.
 *
 * Vendor reference: swift-messaging-sdk-1.17.4.jar, message type pacs.008.001.08
 */
export function buildPacs008(payload: Pacs008Payload): string {
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
    dbtrName,
    dbtrAcctIBAN,
    dbtrAgtBIC,
    cdtrAgtBIC,
    cdtrName,
    cdtrAcctIBAN,
  } = payload;

  const document = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    Document: {
      "@_xmlns": "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08",
      FIToFICstmrCdtTrf: {
        GrpHdr: {
          MsgId: msgId,
          CreDtTm: creDtTm,
          NbOfTxs: nbOfTxs,
          SttlmInf: { SttlmMtd: sttlmMtd },
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
          Dbtr: { Nm: dbtrName },
          DbtrAcct: { Id: { IBAN: dbtrAcctIBAN } },
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
 * Parse an inbound pacs.008 XML string into a plain object.
 * Light-weight — delegates full validation to the swift-messaging-sdk JAR.
 */
export function parsePacs008(xml: string): Record<string, unknown> {
  const { XMLParser } = require("fast-xml-parser") as typeof import("fast-xml-parser");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  return parser.parse(xml) as Record<string, unknown>;
}
