import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { readFile, writeFile } from 'fs/promises';

/** AES-256-CBC IV length (bytes). */
const IV_LENGTH = 16;
/** Key derivation salt — static per-package; override via subclassing if needed. */
const SALT = Buffer.from('vnkrvietnam-swift-sdk-salt-2024!');

/**
 * Encrypts and decrypts files for secure JAR / credential storage using
 * AES-256-CBC with a password-derived key (scrypt).
 */
export class FileEncryptorAdapter {
  /**
   * Derives a 32-byte AES key from the given password string using scrypt.
   */
  private deriveKey(password: string): Buffer {
    // scryptSync is synchronous but only called once per operation — acceptable overhead.
    return scryptSync(password, SALT, 32) as Buffer;
  }

  /**
   * Encrypts the file at `inputPath` and writes the ciphertext (IV + ciphertext)
   * to `outputPath` using AES-256-CBC.
   *
   * @param inputPath  Path to the plaintext source file.
   * @param outputPath Path where the encrypted file will be written.
   * @param key        Passphrase used for key derivation.
   */
  async encrypt(inputPath: string, outputPath: string, key: string): Promise<void> {
    const plaintext = await readFile(inputPath);
    const derivedKey = this.deriveKey(key);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv('aes-256-cbc', derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

    // Prepend the IV to the ciphertext so it is available at decryption time.
    await writeFile(outputPath, Buffer.concat([iv, encrypted]));
  }

  /**
   * Decrypts an AES-256-CBC encrypted file (written by `encrypt`) and writes
   * the recovered plaintext to `outputPath`.
   *
   * @param inputPath  Path to the encrypted source file (IV prepended).
   * @param outputPath Path where the decrypted file will be written.
   * @param key        Passphrase used for key derivation (must match encryption key).
   */
  async decrypt(inputPath: string, outputPath: string, key: string): Promise<void> {
    const ciphertext = await readFile(inputPath);
    const derivedKey = this.deriveKey(key);

    // First 16 bytes are the IV stored during encryption.
    const iv = ciphertext.subarray(0, IV_LENGTH);
    const encrypted = ciphertext.subarray(IV_LENGTH);

    const decipher = createDecipheriv('aes-256-cbc', derivedKey, iv);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    await writeFile(outputPath, plaintext);
  }
}
