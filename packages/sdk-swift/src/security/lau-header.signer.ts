import { createHmac } from 'crypto';

/** Structure of a SWIFT Local Authentication Header. */
export interface LauHeader {
  /** ISO 8601 timestamp at the time the request was signed. */
  timestamp: string;
  /** HMAC-SHA256 hex digest of the canonical request body + timestamp. */
  signature: string;
  /** Application identifier embedded in the header. */
  appId: string;
}

/** Application identifier included in every LAU header. */
const APP_ID = 'vnkrvietnam-swift-sdk';

/**
 * Signs outbound SWIFT messages by computing a Local Authentication (LAU)
 * header using HMAC-SHA256. The LAU header prevents message tampering in
 * transit between the institution and the SWIFT Alliance Gateway.
 *
 * @see https://www.swift.com/standards/data-standards/lau
 */
export class LauHeaderSigner {
  private readonly lauKey: string;

  /**
   * @param lauKey  Shared HMAC secret (minimum 32 characters, as validated by env schema).
   */
  constructor(lauKey: string) {
    this.lauKey = lauKey;
  }

  /**
   * Computes an HMAC-SHA256 hex signature over the canonical string
   * `timestamp + ":" + requestBody`.
   *
   * @param requestBody Serialised request payload (JSON or XML string).
   * @param timestamp   ISO 8601 timestamp string to bind the signature to a point in time.
   * @returns           64-character lowercase hex digest.
   */
  sign(requestBody: string, timestamp: string): string {
    const canonical = `${timestamp}:${requestBody}`;
    return createHmac('sha256', this.lauKey).update(canonical, 'utf8').digest('hex');
  }

  /**
   * Builds a complete `LauHeader` object ready to be serialised as an HTTP
   * header or embedded in a SWIFT MX envelope.
   *
   * The timestamp is derived from `Date.now()` at call time, ensuring that
   * each header is unique even for identical payloads.
   *
   * @param requestBody Serialised request payload (JSON or XML string).
   * @returns           `LauHeader` containing timestamp, signature, and appId.
   */
  buildHeader(requestBody: string): LauHeader {
    const timestamp = new Date().toISOString();
    const signature = this.sign(requestBody, timestamp);
    return { timestamp, signature, appId: APP_ID };
  }
}
