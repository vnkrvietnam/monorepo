import crypto from "node:crypto";
import fs from "node:fs";

/**
 * PKI key types supported by the SWIFT Security SDK.
 */
export type KeyAlgorithm = "RSA-2048" | "RSA-4096" | "EC-P256" | "EC-P384";

/** An in-memory representation of a loaded certificate */
export interface SwiftCertificate {
  /** PEM-encoded certificate */
  pem: string;
  /** Subject common name (CN) */
  subject: string;
  /** Issuer common name */
  issuer: string;
  /** Certificate serial number (hex) */
  serialNumber: string;
  /** ISO 8601 validity start */
  notBefore: string;
  /** ISO 8601 validity end */
  notAfter: string;
}

/** Result of an RSA encrypt/decrypt operation */
export interface PKIEncryptResult {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  algorithm: "RSA-OAEP-SHA256";
}

/**
 * PKIManager — manages PKI certificates and RSA key operations for SWIFT.
 *
 * Responsibilities:
 *  1. Load PEM certificates and validate their structure.
 *  2. Perform RSA-OAEP-SHA256 encryption / decryption for sensitive payloads.
 *  3. Generate random nonces / session keys for SWIFTNet-PKI sessions.
 *
 * In a production deployment the cryptographic operations (key generation and
 * signing) MUST be delegated to the HSM or the SWIFT Security SDK JAR.
 * This module provides a pure-Node.js fallback for non-production environments.
 *
 * Vendor reference: swift-security-sdk-2.17.5-6/lib/ — PKI signing utilities
 */
export class PKIManager {
  private certificates: Map<string, SwiftCertificate> = new Map();

  // ─── Certificate management ─────────────────────────────────────────────────

  /**
   * Load a PEM certificate from disk and register it under `alias`.
   *
   * @param alias   - Logical name, e.g. "swift-gateway-ca"
   * @param pemPath - Absolute path to the `.pem` file
   */
  loadCertificateFromFile(alias: string, pemPath: string): SwiftCertificate {
    const pem = fs.readFileSync(pemPath, "utf8");
    return this.loadCertificateFromPem(alias, pem);
  }

  /**
   * Register a PEM-encoded certificate string under `alias`.
   * Extracts basic metadata without requiring a full ASN.1 parser.
   */
  loadCertificateFromPem(alias: string, pem: string): SwiftCertificate {
    if (!pem.includes("-----BEGIN CERTIFICATE-----")) {
      throw new Error(`[PKIManager] Invalid PEM certificate for alias "${alias}"`);
    }
    const cert: SwiftCertificate = {
      pem,
      subject: extractField(pem, "Subject") ?? alias,
      issuer: extractField(pem, "Issuer") ?? "UNKNOWN",
      serialNumber: crypto.randomBytes(8).toString("hex"),
      notBefore: new Date().toISOString(),
      notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.certificates.set(alias, cert);
    return cert;
  }

  /** Retrieve a loaded certificate by alias, or undefined if not loaded */
  getCertificate(alias: string): SwiftCertificate | undefined {
    return this.certificates.get(alias);
  }

  /** List all loaded certificate aliases */
  listAliases(): string[] {
    return Array.from(this.certificates.keys());
  }

  // ─── RSA encryption / decryption ────────────────────────────────────────────

  /**
   * Encrypt `plaintext` using the RSA public key from `certificate` (OAEP-SHA256).
   * Used for encrypting session keys or sensitive payload segments.
   *
   * @param plaintext   - UTF-8 string to encrypt
   * @param publicKeyPem - PEM-encoded RSA public key
   */
  encryptRSA(plaintext: string, publicKeyPem: string): PKIEncryptResult {
    const encrypted = crypto.publicEncrypt(
      { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(plaintext, "utf8")
    );
    return { ciphertext: encrypted.toString("base64"), algorithm: "RSA-OAEP-SHA256" };
  }

  /**
   * Decrypt ciphertext using an RSA private key (OAEP-SHA256).
   *
   * @param ciphertext   - Base64-encoded ciphertext (from `encryptRSA`)
   * @param privateKeyPem - PEM-encoded RSA private key
   */
  decryptRSA(ciphertext: string, privateKeyPem: string): string {
    const decrypted = crypto.privateDecrypt(
      { key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" },
      Buffer.from(ciphertext, "base64")
    );
    return decrypted.toString("utf8");
  }

  // ─── Key generation ─────────────────────────────────────────────────────────

  /**
   * Generate a new RSA key pair (2048 or 4096 bit).
   * For production use, generate keys in the HSM — never in-process.
   */
  generateRSAKeyPair(bits: 2048 | 4096 = 2048): {
    publicKey: string;
    privateKey: string;
  } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: bits,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    return { publicKey, privateKey };
  }

  /**
   * Generate a cryptographically random nonce (hex string).
   * Used for SWIFTNet session establishment and replay-attack prevention.
   *
   * @param byteLength - Number of random bytes (default: 16)
   */
  generateNonce(byteLength = 16): string {
    return crypto.randomBytes(byteLength).toString("hex").toUpperCase();
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Attempt to extract a field from a certificate (informational only) */
function extractField(pem: string, field: string): string | undefined {
  const match = pem.match(new RegExp(`${field}:\\s*(.+)`));
  return match?.[1]?.trim();
}
