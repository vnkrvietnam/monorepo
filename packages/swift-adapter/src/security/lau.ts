import crypto from "node:crypto";
import type { LAUSignatureResult } from "../types.js";

/**
 * Local Authentication Algorithm (LAU) signer.
 *
 * The LAU is a HMAC-SHA256 based authentication mechanism mandated by SWIFT
 * for Alliance Access / SWIFTNet FileAct channels.
 *
 * In production this wrapper MUST delegate to swift-security-sdk-2.17.5-6.jar
 * via a Java child process or JNI bridge.  This TypeScript implementation
 * provides a structurally compatible Node.js fallback for environments where
 * the JVM is not available (e.g. CI, unit tests).
 *
 * Vendor reference: swift-security-sdk-2.17.5-6.jar — OAuthSession.java
 */
export class LAUSigner {
  private readonly lauKey: Buffer;

  constructor(lauKeyHex: string) {
    if (!lauKeyHex || lauKeyHex.length < 32) {
      throw new Error("LAU key must be at least 32 hex characters (16 bytes)");
    }
    // Accept either hex-encoded key or raw ASCII key
    this.lauKey = /^[0-9a-fA-F]+$/.test(lauKeyHex)
      ? Buffer.from(lauKeyHex, "hex")
      : Buffer.from(lauKeyHex, "utf8");
  }

  /**
   * Signs the given FIN/MX message body and returns the LAU signature.
   *
   * The signed material is: <message><timestamp_iso>
   * matching the SWIFT LAU v2 signing convention.
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
   * Verify a previously computed LAU signature.
   */
  public verify(message: string, timestamp: string, signature: string): boolean {
    const signingInput = `${message}${timestamp}`;
    const hmac = crypto.createHmac("sha256", this.lauKey);
    hmac.update(signingInput, "utf8");
    const expected = hmac.digest("hex").toUpperCase();
    // Constant-time comparison
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature.toUpperCase()));
  }
}
