import path from "node:path";
import { execSync } from "node:child_process";

/** Path to the encryptor JAR relative to the vendor/swift-sdk directory */
const ENCRYPTOR_JAR_NAME = "file-encryptor-decryptor-2.17.1-3.jar";
const VENDOR_SDK = path.resolve(__dirname, "../../vendor/swift-sdk");

/**
 * Encryptor — synchronous wrapper around the SWIFT vendor file-encryptor JAR.
 *
 * Intended for startup/init flows where synchronous execution is acceptable.
 * Use `JavaBridge` for async variants in request-path code.
 *
 * Vendor reference:
 *   vendor/swift-sdk/file-encryptor-decryptor-2.17.1-3.jar
 *   vendor/swift-sdk/config_encrypt_instructions.txt
 */
export class Encryptor {
  private readonly jar: string;

  constructor(vendorSdkPath?: string) {
    this.jar = path.join(vendorSdkPath ?? VENDOR_SDK, ENCRYPTOR_JAR_NAME);
  }

  /**
   * Encrypt a plain-text SWIFT config YAML to an encrypted file.
   * Delegates to `file-encryptor-decryptor-2.17.1-3.jar encrypt`.
   *
   * @param inputPath  - Absolute path to the source `.yaml` file
   * @param outputPath - Destination path for the encrypted output
   * @param key        - Encryption passphrase
   */
  encrypt(inputPath: string, outputPath: string, key: string): void {
    execSync(
      `java -jar "${this.jar}" encrypt -i "${inputPath}" -o "${outputPath}" -k "${key}"`,
      { stdio: "inherit" }
    );
  }

  /**
   * Decrypt an encrypted SWIFT config file back to plain-text YAML.
   *
   * @param inputPath  - Absolute path to the encrypted config file
   * @param outputPath - Destination path for the plain-text `.yaml` output
   * @param key        - Decryption passphrase
   */
  decrypt(inputPath: string, outputPath: string, key: string): void {
    execSync(
      `java -jar "${this.jar}" decrypt -i "${inputPath}" -o "${outputPath}" -k "${key}"`,
      { stdio: "inherit" }
    );
  }

  /**
   * Verify that the vendor JAR exists on disk.
   * Throws if the JAR cannot be found (e.g. missing `git lfs pull`).
   */
  verifyJar(): void {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    if (!fs.existsSync(this.jar)) {
      throw new Error(
        `[Encryptor] Vendor JAR not found at ${this.jar}.\n` +
          "Run `git lfs pull` to fetch the SWIFT vendor binaries."
      );
    }
  }
}
