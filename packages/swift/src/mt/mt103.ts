import type { SWIFTMT103Payload } from "../types.js";

/**
 * Generates a SWIFT MT103 message (Single Customer Credit Transfer).
 *
 * The output conforms to SWIFT FIN message format as used by SWIFT Alliance
 * Access and processed by swift-sdk / swift-messaging-sdk-1.17.4.jar.
 *
 * Reference: SWIFT SR 2025 MT103 field specification.
 */
export function buildMT103(payload: SWIFTMT103Payload): string {
  const {
    senderBIC,
    receiverBIC,
    reference,
    amount,
    currency,
    orderingAccount,
    orderingName,
    beneficiaryAccount,
    beneficiaryName,
    chargesCode = "SHA",
    valueDate = formatToday(),
  } = payload;

  const amountField = formatAmount(amount);

  const lines = [
    `{1:F01${padBIC(senderBIC)}0000000000}`,
    `{2:I103${padBIC(receiverBIC)}N}`,
    `{4:`,
    `:20:${reference.slice(0, 16)}`,
    `:23B:CRED`,
    `:32A:${valueDate}${currency}${amountField}`,
    `:50K:/${orderingAccount}`,
    orderingName.slice(0, 35),
    `:59:/${beneficiaryAccount}`,
    beneficiaryName.slice(0, 35),
    `:71A:${chargesCode}`,
    `-}`,
  ];

  return lines.join("\r\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pad a BIC to 12 chars (BIC8 → BIC8XXXX, BIC11 → BIC11X) */
function padBIC(bic: string): string {
  return bic.padEnd(12, "X").slice(0, 12);
}

/** Format amount: integral part + comma-separated decimals (SWIFT convention) */
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

/** Returns today as YYMMDD */
function formatToday(): string {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}
