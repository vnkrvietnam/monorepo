import { describe, it, expect } from "vitest";
import { buildMT103 } from "../src/mt/mt103.js";
import { buildMT202 } from "../src/mt/mt202.js";
import { buildMT940 } from "../src/mt/mt940.js";

// ─── MT103 ────────────────────────────────────────────────────────────────────

describe("buildMT103", () => {
  const basePayload = {
    senderBIC: "VNKRVNVNXXX",
    receiverBIC: "BNPAFRPPXXX",
    reference: "VNKR20260819001",
    amount: 1_500_000.0,
    currency: "USD",
    orderingAccount: "1029384756",
    orderingName: "VNKR TECH HOLDING JSC",
    beneficiaryAccount: "9876543210",
    beneficiaryName: "GLOBAL TECH SUPPLIER INC",
    chargesCode: "OUR" as const,
    valueDate: "260819",
  };

  it("bắt đầu với block {1:F01...}", () => {
    const msg = buildMT103(basePayload);
    expect(msg).toMatch(/^\{1:F01VNKRVNVNXXX/);
  });

  it("chứa block {2:I103...}", () => {
    const msg = buildMT103(basePayload);
    expect(msg).toContain("{2:I103BNPAFRPPXXX");
  });

  it("trường :20: reference đúng (tối đa 16 ký tự)", () => {
    const msg = buildMT103(basePayload);
    expect(msg).toContain(":20:VNKR20260819001");
  });

  it("trường :32A: chứa ngày, currency, số tiền đúng định dạng SWIFT", () => {
    const msg = buildMT103(basePayload);
    // SWIFT dùng dấu phẩy (,) thay dấu chấm thập phân
    expect(msg).toContain(":32A:260819USD1500000,00");
  });

  it("trường :23B: là CRED", () => {
    const msg = buildMT103(basePayload);
    expect(msg).toContain(":23B:CRED");
  });

  it("trường :71A: chứa charges code OUR", () => {
    const msg = buildMT103(basePayload);
    expect(msg).toContain(":71A:OUR");
  });

  it("kết thúc bằng -}", () => {
    const msg = buildMT103(basePayload);
    expect(msg.trimEnd()).toMatch(/-\}$/);
  });

  it("SHA là default charges code khi không truyền", () => {
    const { chargesCode: _, ...noCharges } = basePayload;
    const msg = buildMT103(noCharges);
    expect(msg).toContain(":71A:SHA");
  });

  it("reference bị cắt xuống tối đa 16 ký tự", () => {
    const msg = buildMT103({ ...basePayload, reference: "123456789012345678" });
    expect(msg).toContain(":20:1234567890123456");
  });
});

// ─── MT202 ────────────────────────────────────────────────────────────────────

describe("buildMT202", () => {
  const payload = {
    senderBIC: "VNKRVNVNXXX",
    receiverBIC: "CHASUS33XXX",
    reference: "VNKR20260819002",
    relatedReference: "VNKR20260819001",
    amount: 500_000.0,
    currency: "EUR",
    valueDate: "260819",
    accountWithInstitutionBIC: "CITIUS33XXX",
    beneficiaryInstitutionBIC: "CHASUS33XXX",
  };

  it("chứa block {2:I202...}", () => {
    const msg = buildMT202(payload);
    expect(msg).toContain("{2:I202CHASUS33XXX");
  });

  it("trường :32A: đúng", () => {
    const msg = buildMT202(payload);
    expect(msg).toContain(":32A:260819EUR500000,00");
  });

  it("trường :21: relatedReference đúng", () => {
    const msg = buildMT202(payload);
    expect(msg).toContain(":21:VNKR20260819001");
  });

  it("trường :57A: accountWithInstitution đúng", () => {
    const msg = buildMT202(payload);
    expect(msg).toContain(":57A:CITIUS33XXX");
  });

  it("trường :58A: beneficiaryInstitution đúng", () => {
    const msg = buildMT202(payload);
    expect(msg).toContain(":58A:CHASUS33XXX");
  });
});

// ─── MT940 ────────────────────────────────────────────────────────────────────

describe("buildMT940", () => {
  const payload = {
    senderBIC: "VNKRVNVNXXX",
    receiverBIC: "CITIUS33XXX",
    reference: "STMT-2026-001",
    accountId: "VN1234567890",
    statementSeqNo: "00001/001",
    openingBalanceMark: "F" as const,
    openingBalanceDC: "C" as const,
    openingBalanceDate: "260819",
    openingBalanceCurrency: "USD",
    openingBalanceAmount: 1_000_000.0,
    transactions: [
      {
        valueDate: "260819",
        entryDate: "0819",
        creditDebitMark: "D" as const,
        amount: 500_000.0,
        transactionTypeCode: "NTRF",
        customerReference: "VNKR20260819001",
        supplementaryDetails: "Payment for services",
      },
    ],
    closingBalanceMark: "F" as const,
    closingBalanceDC: "C" as const,
    closingBalanceDate: "260819",
    closingBalanceCurrency: "USD",
    closingBalanceAmount: 500_000.0,
  };

  it("chứa trường :25: account ID", () => {
    const msg = buildMT940(payload);
    expect(msg).toContain(":25:VN1234567890");
  });

  it("chứa trường :28C: statement sequence", () => {
    const msg = buildMT940(payload);
    expect(msg).toContain(":28C:00001/001");
  });

  it("trường :60F: opening balance đúng", () => {
    const msg = buildMT940(payload);
    expect(msg).toContain(":60F:C260819USD1000000,00");
  });

  it("trường :61: giao dịch được render đúng", () => {
    const msg = buildMT940(payload);
    // SWIFT MT940 :61: format: valueDate+entryDate+D/C+[fundsCode]+amount+transactionTypeCode+customerRef
    expect(msg).toContain(":61:2608190819D500000,00NTRFVNKR20260819001");
    expect(msg).toContain("VNKR20260819001");
  });

  it("trường :62F: closing balance đúng", () => {
    const msg = buildMT940(payload);
    expect(msg).toContain(":62F:C260819USD500000,00");
  });
});
