/**
 * Relationship Management Application (RMA) authorisation check.
 *
 * RMA controls whether a SWIFT member may send specific message categories
 * to another member.  The production implementation queries the SWIFT
 * swift-security-sdk (OAuthSession.java) and the SWIFTRef RMA database.
 *
 * This module provides a typed wrapper / stub that MUST be backed by the
 * swift-security-sdk-2.17.5-6.jar in production deployments.
 */
export interface RMARecord {
  /** The BIC that granted authorisation */
  grantor: string;
  /** The BIC authorised to send */
  grantee: string;
  /** Message categories authorised, e.g. ["1", "2", "9"] */
  categories: string[];
  /** Expiry date ISO 8601 */
  expiresAt: string;
  active: boolean;
}

/**
 * In-memory RMA registry.  Replace with a live call to the swift-security-sdk
 * HTTP endpoint or the SWIFT SWIFTRef API in production.
 */
export class RMARegistry {
  private readonly records: RMARecord[];

  constructor(records: RMARecord[] = []) {
    this.records = records;
  }

  /**
   * Check whether `sender` is authorised to send category-1 messages to `receiver`.
   */
  public isAuthorised(sender: string, receiver: string, category = "1"): boolean {
    const now = new Date().toISOString();
    return this.records.some(
      (r) =>
        r.grantee === sender &&
        r.grantor === receiver &&
        r.categories.includes(category) &&
        r.active &&
        r.expiresAt > now
    );
  }
}
