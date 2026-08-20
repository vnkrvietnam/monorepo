import crypto from "node:crypto";
import type { LAUSignatureResult } from "../types.js";

/**
 * LAUSigner — SWIFT Local Authentication (LAU) Header Engine.
 *
 * The LAU mechanism is a HMAC-SHA256 based authentication scheme mandated by
 * SWIFT for Alliance Access / SWIFTNet FileAct and Microgateway channels.
 * Every outbound HTTP request to the SWIFT Microgateway must include the
 * computed `X-SWIFT-LAU` header produced by this class.
 *
 * Algorithm (LAU v2):
 *   signing_input = <body_bytes><timestamp_iso>
 *   signature     = HMAC-SHA256(signing_key, signing_input).toUpperCase()
 *
 * In production this class MUST be backed by
 * `swift-security-sdk-2.17.5-6.jar — OAuthSession.java` via `JavaBridge`.
 * This TypeScript implementation is a structurally compatible fallback for
 * environments where the JVM is unavailable (CI, unit tests).
 *
 * Vendor reference: swift-security-sdk-2.17.5-6.jar — OAuthSession.java
 */
export class LAUSigner {
  private readonly lauKey: Buffer;

  constructor(lauKeyHex: string) {
    if (!lauKeyHex || lauKeyHex.length < 32) {
      throw new Error("LAU key must be at least 32 hex characters (16 bytes)");
    }
    this.lauKey = /^[0-9a-fA-F]+$/.test(lauKeyHex)
      ? Buffer.from(lauKeyHex, "hex")
      : Buffer.from(lauKeyHex, "utf8");
  }

  // ─── Signing ────────────────────────────────────────────────────────────────

  /**
   * Compute the LAU signature for a FIN/MX message body.
   *
   * @param message - Raw message body string (XML or FIN text)
   * @returns `{ signature, algorithm, timestamp }` — ready to inject as header
   */
  public sign(message: string): LAUSignatureResult {
    const timestamp = new Date().toISOString();
    const signingInput = `${message}${timestamp}`;
    const hmac = crypto.createHmac("sha256", this.lauKey);
    hmac.update(signingInput, "utf8");
    const signature = hmac.digest("hex").toUpperCase();
    return { signature, algorithm: "HMAC-SHA256", timestamp };
  }

  /**
   * Produce the `X-SWIFT-LAU` header value string for direct HTTP injection.
   * Format: `"<timestamp>;<signature>"`
   */
  public headerValue(message: string): string {
    const { signature, timestamp } = this.sign(message);
    return `${timestamp};${signature}`;
  }

  // ─── Verification ───────────────────────────────────────────────────────────

  /**
   * Verify a previously computed LAU signature using constant-time comparison.
   *
   * @param message   - Original message body
   * @param timestamp - ISO timestamp used when the signature was created
   * @param signature - Hex-encoded (upper or lower) HMAC-SHA256 value to check
   */
  public verify(message: string, timestamp: string, signature: string): boolean {
    const signingInput = `${message}${timestamp}`;
    const hmac = crypto.createHmac("sha256", this.lauKey);
    hmac.update(signingInput, "utf8");
    const expected = hmac.digest("hex").toUpperCase();
    const received = signature.toUpperCase();

    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  }
}
