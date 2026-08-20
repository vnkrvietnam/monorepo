/**
 * uetr.ts — UETR (Unique End-to-end Transaction Reference) utilities
 *
 * UETR = RFC 4122 UUID v4 per SWIFT gpi specification.
 * Used as the universal transaction correlation ID across all gpi payments.
 */

import { randomUUID } from "node:crypto";

/** Generate a new UETR (RFC 4122 UUID v4) */
export function generateUETR(): string {
  return randomUUID();
}

/**
 * Validate that a string is a valid UETR (UUID v4).
 * Matches the pattern mandated by SWIFT gpi Tracker API.
 */
export function isValidUETR(uetr: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uetr);
}

/**
 * Format a UETR to canonical lowercase hyphenated form.
 * @throws {Error} if the input is not a valid UUID v4
 */
export function formatUETR(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (!isValidUETR(lower)) {
    throw new Error(`Invalid UETR: "${raw}". Must be a valid RFC 4122 UUID v4.`);
  }
  return lower;
}
