import type { SWIFTMT202Payload } from "../types.js";

/**
 * Generates a SWIFT MT202 message (General Financial Institution Transfer).
 *
 * Used for interbank cover payments and nostro/vostro settlement between
 * VNKR MENA correspondent banks.
 *
 * Reference: SWIFT SR 2025 MT202 field specification.
 */
export function buildMT202(payload: SWIFTMT202Payload): string {
  const {
    senderBIC,
    receiverBIC,
    reference,
    relatedReference,
    amount,
    currency,
    valueDate = formatToday(),
    accountWithInstitutionBIC,
    beneficiaryInstitutionBIC,
  } = payload;

  const amountField = amount.toFixed(2).replace(".", ",");

  const lines = [
    `{1:F01${padBIC(senderBIC)}0000000000}`,
    `{2:I202${padBIC(receiverBIC)}N}`,
    `{4:`,
    `:20:${reference.slice(0, 16)}`,
    `:21:${relatedReference.slice(0, 16)}`,
    `:32A:${valueDate}${currency}${amountField}`,
    `:57A:${accountWithInstitutionBIC}`,
    `:58A:${beneficiaryInstitutionBIC}`,
    `-}`,
  ];

  return lines.join("\r\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function padBIC(bic: string): string {
  return bic.padEnd(12, "X").slice(0, 12);
}

function formatToday(): string {
  const d = new Date();
  const yy = String(d.getUTCFullYear()).slice(2);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}
