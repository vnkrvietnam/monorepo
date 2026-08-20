import { describe, it, expect } from "vitest";
import {
  buildPacs008,
  parsePacs008,
  buildPacs009,
  parsePacs009,
  buildCamt053,
  parseCamt053,
  buildPain001,
  parsePain001,
} from "../src/generators/mx-parser.js";
import type {
  Pacs008Payload,
  Pacs009Payload,
  Camt053Payload,
  Pain001Payload,
} from "../src/generators/iso20022-dto.js";

// ─── pacs.008.001.08 ─────────────────────────────────────────────────────────

describe("buildPacs008 / parsePacs008", () => {
  const payload: Pacs008Payload = {
    msgId: "VNKR/20260819/PACS008/001",
    creDtTm: "2026-08-19T04:24:00Z",
    nbOfTxs: 1,
    sttlmMtd: "CLRG",
    instrId: "INSTR-001",
    endToEndId: "E2E-VNKR-20260819",
    txId: "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    intrBkSttlmAmt: 750_000.5,
    currency: "EUR",
    intrBkSttlmDt: "2026-08-19",
    dbtrName: "VNKR TECH HOLDING JSC",
    dbtrAcctIBAN: "VN1234567890",
    dbtrAgtBIC: "VNKRVNVNXXX",
    cdtrAgtBIC: "DEUTDEFFXXX",
    cdtrName: "DEUTSCHE INDUSTRIAL GMBH",
    cdtrAcctIBAN: "DE89370400440532013000",
    purposeCode: "SUPP",
    remittanceInfo: "Invoice INV-2026-0819",
  };

  it("produces valid XML with <?xml?> declaration", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it("contains pacs.008.001.08 namespace", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain("urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08");
  });

  it("contains correct MsgId", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain("<MsgId>VNKR/20260819/PACS008/001</MsgId>");
  });

  it("contains amount with 2 decimal places and currency", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain('Ccy="EUR"');
    expect(xml).toContain("750000.50");
  });

  it("contains creditor IBAN", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain("<IBAN>DE89370400440532013000</IBAN>");
  });

  it("contains purpose code and remittance info", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain("<Cd>SUPP</Cd>");
    expect(xml).toContain("Invoice INV-2026-0819");
  });

  it("parsePacs008 round-trip returns object with Document key", () => {
    const xml = buildPacs008(payload);
    const parsed = parsePacs008(xml);
    expect(parsed).toHaveProperty("Document");
  });
});

// ─── pacs.009.001.08 ─────────────────────────────────────────────────────────

describe("buildPacs009 / parsePacs009", () => {
  const payload: Pacs009Payload = {
    msgId: "VNKR/20260819/PACS009/001",
    creDtTm: "2026-08-19T05:00:00Z",
    instrId: "COV-001",
    endToEndId: "E2E-COV-20260819",
    txId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    intrBkSttlmAmt: 500_000.0,
    currency: "USD",
    intrBkSttlmDt: "2026-08-19",
    instgAgtBIC: "VNKRVNVNXXX",
    instdAgtBIC: "CHASUS33XXX",
    dbtrAgtBIC: "VNKRVNVNXXX",
    cdtrAgtBIC: "CHASUS33XXX",
    cdtrName: "JP MORGAN CHASE BANK",
    cdtrAcctIBAN: "US12345678901234567890",
  };

  it("contains pacs.009.001.08 namespace", () => {
    expect(buildPacs009(payload)).toContain("urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08");
  });

  it("contains FICdtTrf root element", () => {
    expect(buildPacs009(payload)).toContain("<FICdtTrf>");
  });

  it("contains InstgAgt BIC", () => {
    expect(buildPacs009(payload)).toContain("<BICFI>VNKRVNVNXXX</BICFI>");
  });

  it("contains correct settlement amount", () => {
    expect(buildPacs009(payload)).toContain("500000.00");
  });

  it("parsePacs009 round-trip returns object with Document key", () => {
    const parsed = parsePacs009(buildPacs009(payload));
    expect(parsed).toHaveProperty("Document");
  });
});

// ─── camt.053.001.08 ─────────────────────────────────────────────────────────

describe("buildCamt053 / parseCamt053", () => {
  const payload: Camt053Payload = {
    msgId: "VNKR/20260819/CAMT053/001",
    creDtTm: "2026-08-19T08:00:00Z",
    stmtId: "STMT-2026-08-19-001",
    seqNb: 1,
    frDt: "2026-08-19",
    toDt: "2026-08-19",
    accountIBAN: "VN123456789012345",
    servicerBIC: "VNKRVNVNXXX",
    openingBalanceAmt: 1_000_000.0,
    openingBalanceCurrency: "USD",
    openingBalanceDC: "CRDT",
    openingBalanceDate: "2026-08-19",
    closingBalanceAmt: 500_000.0,
    closingBalanceCurrency: "USD",
    closingBalanceDC: "CRDT",
    closingBalanceDate: "2026-08-19",
    entries: [
      {
        amount: 500_000.0,
        currency: "USD",
        creditDebitIndicator: "DBIT",
        status: "BOOK",
        bookingDate: "2026-08-19",
        valueDate: "2026-08-19",
        accountServicerRef: "ASR-001",
        endToEndId: "E2E-VNKR-20260819",
        bankTransactionCode: "ESCT",
        additionalEntryInfo: "Payment for IT services",
      },
    ],
  };

  it("contains camt.053.001.08 namespace", () => {
    expect(buildCamt053(payload)).toContain("urn:iso:std:iso:20022:tech:xsd:camt.053.001.08");
  });

  it("contains BkToCstmrStmt root element", () => {
    expect(buildCamt053(payload)).toContain("<BkToCstmrStmt>");
  });

  it("contains correct IBAN", () => {
    expect(buildCamt053(payload)).toContain("<IBAN>VN123456789012345</IBAN>");
  });

  it("contains OPBD opening balance", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("<Cd>OPBD</Cd>");
    expect(xml).toContain("1000000.00");
  });

  it("contains CLBD closing balance", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("<Cd>CLBD</Cd>");
    expect(xml).toContain("500000.00");
  });

  it("contains DBIT entry indicator", () => {
    expect(buildCamt053(payload)).toContain("<CdtDbtInd>DBIT</CdtDbtInd>");
  });

  it("parseCamt053 round-trip returns object with Document key", () => {
    expect(parseCamt053(buildCamt053(payload))).toHaveProperty("Document");
  });
});

// ─── pain.001.001.09 ─────────────────────────────────────────────────────────

describe("buildPain001 / parsePain001", () => {
  const payload: Pain001Payload = {
    msgId: "VNKR/20260819/PAIN001/001",
    creDtTm: "2026-08-19T09:00:00Z",
    initiatingPartyName: "VNKR TECH HOLDING JSC",
    dbtrName: "VNKR OPERATING ACCOUNT",
    dbtrAcctIBAN: "VN123456789000000",
    dbtrAgtBIC: "VNKRVNVNXXX",
    transactions: [
      {
        endToEndId: "E2E-PAIN-001",
        amount: 10_000.0,
        currency: "EUR",
        reqExctnDt: "2026-08-19",
        cdtrAgtBIC: "DEUTDEFFXXX",
        cdtrName: "ACME GMBH",
        cdtrAcctIBAN: "DE89370400440532013000",
        remittanceInfo: "Invoice #2026-08-001",
      },
      {
        endToEndId: "E2E-PAIN-002",
        amount: 5_000.0,
        currency: "EUR",
        cdtrAgtBIC: "BNPAFRPPXXX",
        cdtrName: "PARIS PARTNER SA",
        cdtrAcctIBAN: "FR7630006000011234567890189",
      },
    ],
  };

  it("produces valid XML with pain.001.001.09 namespace", () => {
    const xml = buildPain001(payload);
    expect(xml).toContain("urn:iso:std:iso:20022:tech:xsd:pain.001.001.09");
  });

  it("contains CstmrCdtTrfInitn root element", () => {
    expect(buildPain001(payload)).toContain("<CstmrCdtTrfInitn>");
  });

  it("NbOfTxs matches number of transactions (2)", () => {
    expect(buildPain001(payload)).toContain("<NbOfTxs>2</NbOfTxs>");
  });

  it("CtrlSum is sum of all transaction amounts", () => {
    expect(buildPain001(payload)).toContain("<CtrlSum>15000.00</CtrlSum>");
  });

  it("contains debtor IBAN", () => {
    expect(buildPain001(payload)).toContain("<IBAN>VN123456789000000</IBAN>");
  });

  it("parsePain001 round-trip returns object with Document key", () => {
    expect(parsePain001(buildPain001(payload))).toHaveProperty("Document");
  });
});
