import { ValidationError } from "../errors/index.js";
import type { BIC, IBAN } from "../types/index.js";

// ─── BIC Validation ──────────────────────────────────────────────────────────

/** BIC regex: 4 alpha (bank) + 2 alpha (country) + 2 alphanumeric (location) + optional 3 alphanumeric (branch) */
const BIC_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

/** Returns true if the string is a valid BIC-8 or BIC-11 */
export function isBIC(s: string): s is BIC {
  return BIC_REGEX.test(s.toUpperCase().trim());
}

/**
 * Normalise and brand a BIC string.
 * @throws {ValidationError} if the string is not a valid BIC
 */
export function formatBIC(bic: string): BIC {
  const normalised = bic.toUpperCase().trim();
  if (!isBIC(normalised)) {
    throw new ValidationError(`Invalid BIC: "${bic}"`, { bic });
  }
  return normalised as BIC;
}

// ─── IBAN Validation ──────────────────────────────────────────────────────────

/** Strip spaces and uppercase */
function normaliseIBAN(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/**
 * MOD-97 check per ISO 13616.
 * Move first 4 chars to end, replace letters with digits (A=10…Z=35), mod 97 = 1.
 */
function mod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder === 1;
}

/** Returns true if the string passes IBAN format and MOD-97 check */
export function isIBAN(s: string): s is IBAN {
  const n = normaliseIBAN(s);
  if (n.length < 15 || n.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(n)) return false;
  return mod97(n);
}

/**
 * Normalise and brand an IBAN string.
 * @throws {ValidationError} if the string is not a valid IBAN
 */
export function formatIBAN(iban: string): IBAN {
  const normalised = normaliseIBAN(iban);
  if (!isIBAN(normalised)) {
    throw new ValidationError(`Invalid IBAN: "${iban}"`, { iban });
  }
  return normalised as IBAN;
}
