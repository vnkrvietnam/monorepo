import { describe, it, expect } from "vitest";
import { LAUSigner } from "../src/security/lau-signer.js";

// ─── LAUSigner ────────────────────────────────────────────────────────────────

describe("LAUSigner", () => {
  const LAU_KEY_HEX = "0123456789ABCDEF0123456789ABCDEF";
  const LAU_KEY_ASCII = "VNKR_SWIFT_LAU_SECRET_KEY_2026!!";

  it("throws when key is too short", () => {
    expect(() => new LAUSigner("SHORT")).toThrow("LAU key must be at least 32");
  });

  it("sign() returns a non-empty 64-char uppercase hex signature", () => {
    const signer = new LAUSigner(LAU_KEY_HEX);
    const result = signer.sign("TEST_MESSAGE");
    expect(result.signature).toBeTruthy();
    expect(result.signature.length).toBe(64);
    expect(result.signature).toBe(result.signature.toUpperCase());
  });

  it("algorithm is always HMAC-SHA256", () => {
    const signer = new LAUSigner(LAU_KEY_HEX);
    expect(signer.sign("x").algorithm).toBe("HMAC-SHA256");
  });

  it("timestamp is a valid ISO 8601 string", () => {
    const signer = new LAUSigner(LAU_KEY_HEX);
    const result = signer.sign("x");
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it("verify() returns true for a freshly signed message", () => {
    const signer = new LAUSigner(LAU_KEY_HEX);
    const { signature, timestamp } = signer.sign("REAL_MESSAGE");
    expect(signer.verify("REAL_MESSAGE", timestamp, signature)).toBe(true);
  });

  it("verify() returns false when signature is forged", () => {
    const signer = new LAUSigner(LAU_KEY_HEX);
    const { timestamp } = signer.sign("REAL_MESSAGE");
    expect(signer.verify("REAL_MESSAGE", timestamp, "A".repeat(64))).toBe(false);
  });

  it("verify() returns false when message is tampered", () => {
    const signer = new LAUSigner(LAU_KEY_HEX);
    const { signature, timestamp } = signer.sign("ORIGINAL");
    expect(signer.verify("TAMPERED", timestamp, signature)).toBe(false);
  });

  it("ASCII key works equivalently to a hex key", () => {
    const signer = new LAUSigner(LAU_KEY_ASCII);
    const { signature, timestamp } = signer.sign("TEST");
    expect(signer.verify("TEST", timestamp, signature)).toBe(true);
  });

  it("two different keys produce different signatures for the same message", () => {
    const s1 = new LAUSigner(LAU_KEY_HEX);
    const s2 = new LAUSigner("FEDCBA9876543210FEDCBA9876543210");
    const r1 = s1.sign("SAME_MESSAGE");
    const r2 = s2.sign("SAME_MESSAGE");
    // Timestamps will differ, so we test cross-verification
    expect(s1.verify("SAME_MESSAGE", r2.timestamp, r2.signature)).toBe(false);
  });

  it("headerValue() returns '<timestamp>;<signature>'", () => {
    const signer = new LAUSigner(LAU_KEY_HEX);
    const header = signer.headerValue("BODY");
    expect(header).toMatch(/^\d{4}-\d{2}-\d{2}T.+Z;[0-9A-F]{64}$/);
  });
});
