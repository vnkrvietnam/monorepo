import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

/** Certificate and private key pair loaded from disk. */
export interface CertificateBundle {
  /** PEM-encoded X.509 certificate. */
  cert: string;
  /** PEM-encoded private key. */
  key: string;
}

/**
 * Manages SWIFT PKI certificates: loading them from disk and computing
 * their SHA-256 fingerprints for identity verification and audit logging.
 */
export class PkiCertificateService {
  private readonly certPath: string;
  private readonly keyPath: string;

  /**
   * @param certPath Path to the PEM-encoded X.509 certificate file.
   * @param keyPath  Path to the PEM-encoded private key file.
   */
  constructor(certPath: string, keyPath: string) {
    this.certPath = certPath;
    this.keyPath = keyPath;
  }

  /**
   * Reads the certificate and private key from disk and returns them as
   * UTF-8 strings suitable for use with Node.js TLS APIs.
   *
   * @returns `CertificateBundle` containing `cert` and `key` strings.
   * @throws  `Error` if either file cannot be read.
   */
  async loadCertificate(): Promise<CertificateBundle> {
    const [cert, key] = await Promise.all([
      readFile(this.certPath, 'utf8'),
      readFile(this.keyPath, 'utf8'),
    ]);
    return { cert, key };
  }

  /**
   * Computes the SHA-256 fingerprint of the certificate in colon-separated
   * uppercase hex format (e.g. `"AB:CD:EF:…"`), matching the output of
   * `openssl x509 -fingerprint -sha256`.
   *
   * @returns SHA-256 fingerprint string.
   * @throws  `Error` if the certificate file cannot be read.
   */
  async getFingerprint(): Promise<string> {
    const certPem = await readFile(this.certPath, 'utf8');

    // Strip PEM header/footer and decode the DER payload before hashing.
    const derBase64 = certPem
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\s+/g, '');
    const der = Buffer.from(derBase64, 'base64');

    const hash = createHash('sha256').update(der).digest('hex').toUpperCase();
    // Format as XX:XX:XX:… (colon-separated pairs)
    return hash.match(/.{2}/g)!.join(':');
  }
}
