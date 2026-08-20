/**
 * SWIFT MT940 — Customer Statement Message (ISO 15022)
 *
 * Gửi từ ngân hàng đến khách hàng/correspondent để cung cấp thông tin
 * số dư và lịch sử giao dịch trên tài khoản nostro/vostro.
 *
 * Vendor reference: swift-messaging-sdk-1.17.4.jar, message type MT940
 */

export interface MT940Transaction {
  /** Ngày valeur YYMMDD */
  valueDate: string;
  /** Ngày đặt bút YYMMDD (tuỳ chọn) */
  entryDate?: string;
  /** D = Debit, C = Credit, RD = Reverse Debit, RC = Reverse Credit */
  creditDebitMark: "D" | "C" | "RD" | "RC";
  /** Funds code (currency 3rd char), để trống nếu là đồng tệ tài khoản */
  fundsCode?: string;
  /** Số tiền, VD: 1500,00 (dấu phẩy phân cách thập phân theo SWIFT) */
  amount: number;
  /**
   * Transaction type identification code
   * VD: NTRF (No type), NCHK (Cheque), NMSC (Miscellaneous)
   */
  transactionTypeCode: string;
  /** Customer reference */
  customerReference: string;
  /** Bank reference (tuỳ chọn, phân cách bằng //) */
  bankReference?: string;
  /** Supplementary details (field :86:) */
  supplementaryDetails?: string;
}

export interface SWIFTMT940Payload {
  /** BIC của ngân hàng gửi statement */
  senderBIC: string;
  /** BIC của ngân hàng nhận statement */
  receiverBIC: string;
  /** Transaction Reference Number (field :20:) */
  reference: string;
  /** Account Identification (field :25:) */
  accountId: string;
  /** Statement / Sequence Number (field :28C:) VD: "00001/001" */
  statementSeqNo: string;
  /** Opening Balance: F=Final, I=Interim */
  openingBalanceMark: "F" | "I";
  /** D = Debit balance, C = Credit balance */
  openingBalanceDC: "D" | "C";
  openingBalanceDate: string;
  openingBalanceCurrency: string;
  openingBalanceAmount: number;
  /** Danh sách giao dịch */
  transactions: MT940Transaction[];
  /** Closing Balance */
  closingBalanceMark: "F" | "I";
  closingBalanceDC: "D" | "C";
  closingBalanceDate: string;
  closingBalanceCurrency: string;
  closingBalanceAmount: number;
}

/**
 * Build một MT940 Customer Statement Message theo chuẩn SWIFT FIN.
 */
export function buildMT940(payload: SWIFTMT940Payload): string {
  const lines: string[] = [];

  // Block 1 & 2
  lines.push(`{1:F01${padBIC(payload.senderBIC)}0000000000}`);
  lines.push(`{2:I940${padBIC(payload.receiverBIC)}N}`);
  lines.push(`{4:`);

  // :20: Transaction Reference Number
  lines.push(`:20:${payload.reference.slice(0, 16)}`);

  // :25: Account Identification
  lines.push(`:25:${payload.accountId.slice(0, 35)}`);

  // :28C: Statement / Sequence Number
  lines.push(`:28C:${payload.statementSeqNo}`);

  // :60F/:60M: Opening Balance
  const obMark = payload.openingBalanceMark === "F" ? "60F" : "60M";
  lines.push(
    `:${obMark}:${payload.openingBalanceDC}${payload.openingBalanceDate}${payload.openingBalanceCurrency}${formatAmount(payload.openingBalanceAmount)}`
  );

  // :61: Statement Lines + :86: Supplementary Details
  for (const tx of payload.transactions) {
    const entry = tx.entryDate ?? tx.valueDate.slice(2); // MMDD
    const bankRef = tx.bankReference ? `//` + tx.bankReference : "";
    lines.push(
      `:61:${tx.valueDate}${entry}${tx.creditDebitMark}${tx.fundsCode ?? ""}${formatAmount(tx.amount)}${tx.transactionTypeCode}${tx.customerReference}${bankRef}`
    );
    if (tx.supplementaryDetails) {
      lines.push(`:86:${tx.supplementaryDetails.slice(0, 390)}`);
    }
  }

  // :62F/:62M: Closing Balance
  const cbMark = payload.closingBalanceMark === "F" ? "62F" : "62M";
  lines.push(
    `:${cbMark}:${payload.closingBalanceDC}${payload.closingBalanceDate}${payload.closingBalanceCurrency}${formatAmount(payload.closingBalanceAmount)}`
  );

  lines.push(`-}`);
  return lines.join("\r\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function padBIC(bic: string): string {
  return bic.padEnd(12, "X").slice(0, 12);
}

function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}
