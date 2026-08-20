/**
 * validators.ts — BIC, IBAN, UETR, currency validators
 *
 * Node.js implementations of validation logic from:
 *   swift-security-sdk-2.17.5-6 (pre-validation concepts)
 *   clients/pre-validation.ts (BIC/IBAN checks before sending to SWIFT Gateway)
 */

// ─── BIC Validation ──────────────────────────────────────────────────────────

/** BIC-8 or BIC-11: 4 alpha (bank) + 2 alpha (country) + 2 alnum (location) + optional 3 alnum (branch) */
const BIC_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

/** Returns true if the string is a valid BIC-8 or BIC-11 */
export function isBIC(bic: string): boolean {
  return BIC_REGEX.test(bic.toUpperCase().trim());
}

/**
 * Normalise a BIC to uppercase and pad BIC-8 to BIC-11 with "XXX".
 * @throws {Error} if the input is not a valid BIC
 */
export function normaliseBIC(bic: string): string {
  const upper = bic.toUpperCase().trim();
  if (!isBIC(upper)) throw new Error(`Invalid BIC: "${bic}"`);
  return upper.length === 8 ? `${upper}XXX` : upper;
}

// ─── IBAN Validation ──────────────────────────────────────────────────────────

function _mod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder === 1;
}

/** Returns true if the string passes IBAN format and MOD-97 check */
export function isIBAN(iban: string): boolean {
  const n = iban.replace(/\s+/g, "").toUpperCase();
  if (n.length < 15 || n.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(n)) return false;
  return _mod97(n);
}

/**
 * Normalise an IBAN — strip spaces and uppercase.
 * @throws {Error} if the IBAN is invalid
 */
export function normaliseIBAN(iban: string): string {
  const n = iban.replace(/\s+/g, "").toUpperCase();
  if (!isIBAN(n)) throw new Error(`Invalid IBAN: "${iban}"`);
  return n;
}

// ─── UETR Validation ──────────────────────────────────────────────────────────

/** RFC 4122 UUID v4 regex */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Returns true if the string is a valid RFC 4122 UUID v4 (UETR format) */
export function isUETR(uetr: string): boolean {
  return UUID_V4_REGEX.test(uetr);
}

// ─── Currency Validation ──────────────────────────────────────────────────────

/** ISO 4217 alpha-3 currency code pattern */
const CURRENCY_REGEX = /^[A-Z]{3}$/;

/** Returns true if the string looks like a valid ISO 4217 currency code */
export function isCurrencyCode(code: string): boolean {
  return CURRENCY_REGEX.test(code);
}

// ─── Amount Validation ────────────────────────────────────────────────────────

/**
 * Returns true if the amount string is a valid positive decimal number.
 * Accepts both period "." and comma "," as decimal separators.
 */
export function isValidAmount(amount: string): boolean {
  return /^\d{1,15}([.,]\d{1,5})?$/.test(amount.trim()) && parseFloat(amount.replace(",", ".")) > 0;
}
