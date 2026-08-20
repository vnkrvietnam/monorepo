import { describe, it, expect } from "vitest";
import { buildPacs008, parsePacs008 } from "../src/iso20022/pacs008.js";
import { buildPacs009, parsePacs009 } from "../src/iso20022/pacs009.js";
import { buildCamt053, parseCamt053 } from "../src/iso20022/camt053.js";

// ─── pacs.008 ─────────────────────────────────────────────────────────────────

describe("buildPacs008", () => {
  const payload = {
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
  };

  it("là XML hợp lệ với khai báo <?xml?>", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it("chứa namespace pacs.008.001.08", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain("urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08");
  });

  it("chứa MsgId đúng", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain("<MsgId>VNKR/20260819/PACS008/001</MsgId>");
  });

  it("chứa số tiền và currency đúng", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain('Ccy="EUR"');
    expect(xml).toContain("750000.50");
  });

  it("chứa IBAN creditor đúng", () => {
    const xml = buildPacs008(payload);
    expect(xml).toContain("<IBAN>DE89370400440532013000</IBAN>");
  });

  it("parsePacs008 round-trip trả về object có Document", () => {
    const xml = buildPacs008(payload);
    const parsed = parsePacs008(xml);
    expect(parsed).toHaveProperty("Document");
  });
});

// ─── pacs.009 ─────────────────────────────────────────────────────────────────

describe("buildPacs009", () => {
  const payload = {
    msgId: "VNKR/20260819/PACS009/001",
    creDtTm: "2026-08-19T05:00:00Z",
    nbOfTxs: 1,
    sttlmMtd: "CLRG",
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

  it("chứa namespace pacs.009.001.08", () => {
    const xml = buildPacs009(payload);
    expect(xml).toContain("urn:iso:std:iso:20022:tech:xsd:pacs.009.001.08");
  });

  it("chứa FICdtTrf (FI Credit Transfer root element)", () => {
    const xml = buildPacs009(payload);
    expect(xml).toContain("<FICdtTrf>");
  });

  it("chứa InstgAgt BIC đúng", () => {
    const xml = buildPacs009(payload);
    expect(xml).toContain("<BICFI>VNKRVNVNXXX</BICFI>");
  });

  it("chứa settlement amount đúng", () => {
    const xml = buildPacs009(payload);
    expect(xml).toContain("500000.00");
  });

  it("parsePacs009 round-trip trả về object có Document", () => {
    const xml = buildPacs009(payload);
    const parsed = parsePacs009(xml);
    expect(parsed).toHaveProperty("Document");
  });
});

// ─── camt.053 ─────────────────────────────────────────────────────────────────

describe("buildCamt053", () => {
  const payload = {
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
    openingBalanceDC: "CRDT" as const,
    openingBalanceDate: "2026-08-19",
    closingBalanceAmt: 500_000.0,
    closingBalanceCurrency: "USD",
    closingBalanceDC: "CRDT" as const,
    closingBalanceDate: "2026-08-19",
    entries: [
      {
        amount: 500_000.0,
        currency: "USD",
        creditDebitIndicator: "DBIT" as const,
        status: "BOOK" as const,
        bookingDate: "2026-08-19",
        valueDate: "2026-08-19",
        accountServicerRef: "ASR-001",
        endToEndId: "E2E-VNKR-20260819",
        bankTransactionCode: "ESCT",
        additionalEntryInfo: "Payment for IT services",
      },
    ],
  };

  it("chứa namespace camt.053.001.08", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("urn:iso:std:iso:20022:tech:xsd:camt.053.001.08");
  });

  it("chứa BkToCstmrStmt root element", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("<BkToCstmrStmt>");
  });

  it("chứa IBAN tài khoản đúng", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("<IBAN>VN123456789012345</IBAN>");
  });

  it("chứa OPBD (opening booked balance) đúng", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("<Cd>OPBD</Cd>");
    expect(xml).toContain("1000000.00");
  });

  it("chứa CLBD (closing booked balance) đúng", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("<Cd>CLBD</Cd>");
    expect(xml).toContain("500000.00");
  });

  it("chứa entry với CdtDbtInd = DBIT", () => {
    const xml = buildCamt053(payload);
    expect(xml).toContain("<CdtDbtInd>DBIT</CdtDbtInd>");
  });

  it("parseCamt053 round-trip trả về object có Document", () => {
    const xml = buildCamt053(payload);
    const parsed = parseCamt053(xml);
    expect(parsed).toHaveProperty("Document");
  });
});
