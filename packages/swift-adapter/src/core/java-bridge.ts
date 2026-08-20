import { exec } from "node:child_process";
import path from "node:path";
import util from "node:util";

const execPromise = util.promisify(exec);

/** Resolved path to the SWIFT SDK vendor directory */
const VENDOR_SDK = path.resolve(__dirname, "../../vendor/swift-sdk-2.17.10-6");
/** Resolved path to the SWIFT Security SDK vendor directory */
const VENDOR_SECURITY_SDK = path.resolve(
  __dirname,
  "../../vendor/swift-security-sdk-2.17.5-6"
);

/**
 * SwiftJavaBridge — thin Node.js wrapper around the SWIFT vendor JAR utilities.
 *
 * In production, the `file-encryptor-decryptor-2.17.1-3.jar` from the
 * swift-sdk-2.17.10-6 vendor bundle is invoked via a Java child process.
 * The host environment must have a JRE/JDK ≥ 17 available on PATH.
 *
 * Vendor reference:
 *   vendor/swift-sdk-2.17.10-6/file-encryptor-decryptor-2.17.1-3.jar
 *   vendor/swift-sdk-2.17.10-6/config_encrypt_instructions.txt
 */
export class SwiftJavaBridge {
  private readonly encryptorJar: string;

  constructor(vendorSdkPath?: string) {
    const sdkBase = vendorSdkPath ?? VENDOR_SDK;
    this.encryptorJar = path.join(
      sdkBase,
      "file-encryptor-decryptor-2.17.1-3.jar"
    );
  }

  // ─── Config file encryption ─────────────────────────────────────────────────

  /**
   * Encrypt a SWIFT SDK config YAML file using the vendor JAR utility.
   *
   * @param inputYaml      - Path to the plain-text `.yaml` config file
   * @param outputEncrypted - Destination path for the encrypted output
   * @param secretKey      - Encryption key (consult config_encrypt_instructions.txt)
   * @returns stdout from the JAR on success
   */
  async encryptConfigFile(
    inputYaml: string,
    outputEncrypted: string,
    secretKey: string
  ): Promise<string> {
    const cmd = [
      "java",
      "-jar",
      shellQuote(this.encryptorJar),
      "encrypt",
      "-i",
      shellQuote(inputYaml),
      "-o",
      shellQuote(outputEncrypted),
      "-k",
      shellQuote(secretKey),
    ].join(" ");

    const { stdout } = await execPromise(cmd).catch((err: Error) => {
      throw new Error(`[SwiftJavaBridge] encryptConfigFile failed: ${err.message}`);
    });

    return stdout.trim();
  }

  /**
   * Decrypt a previously encrypted SWIFT SDK config file.
   *
   * @param inputEncrypted - Path to the encrypted config file
   * @param outputYaml     - Destination path for the plain-text output
   * @param secretKey      - Decryption key
   */
  async decryptConfigFile(
    inputEncrypted: string,
    outputYaml: string,
    secretKey: string
  ): Promise<string> {
    const cmd = [
      "java",
      "-jar",
      shellQuote(this.encryptorJar),
      "decrypt",
      "-i",
      shellQuote(inputEncrypted),
      "-o",
      shellQuote(outputYaml),
      "-k",
      shellQuote(secretKey),
    ].join(" ");

    const { stdout } = await execPromise(cmd).catch((err: Error) => {
      throw new Error(`[SwiftJavaBridge] decryptConfigFile failed: ${err.message}`);
    });

    return stdout.trim();
  }

  // ─── Generic JAR runner ─────────────────────────────────────────────────────

  /**
   * Run any JAR from the vendor bundle with arbitrary arguments.
   * Used internally and in integration scripts.
   *
   * @param jarRelativePath - Path relative to the SDK vendor root
   * @param args            - CLI arguments to pass to the JAR
   */
  async runJar(jarRelativePath: string, args: string[]): Promise<string> {
    const jar = path.join(VENDOR_SDK, jarRelativePath);
    const cmd = ["java", "-jar", shellQuote(jar), ...args.map(shellQuote)].join(
      " "
    );

    const { stdout } = await execPromise(cmd).catch((err: Error) => {
      throw new Error(`[SwiftJavaBridge] runJar(${jarRelativePath}) failed: ${err.message}`);
    });

    return stdout.trim();
  }

  /** Resolve an absolute path inside the SWIFT SDK vendor directory */
  static sdkPath(...segments: string[]): string {
    return path.join(VENDOR_SDK, ...segments);
  }

  /** Resolve an absolute path inside the SWIFT Security SDK vendor directory */
  static securitySdkPath(...segments: string[]): string {
    return path.join(VENDOR_SECURITY_SDK, ...segments);
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Wrap a string in double-quotes for safe shell interpolation */
function shellQuote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}
