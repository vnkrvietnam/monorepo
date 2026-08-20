import { exec } from "node:child_process";
import path from "node:path";
import util from "node:util";

const execPromise = util.promisify(exec);

/** Resolved base path of the SWIFT SDK vendor bundle */
const VENDOR_SDK = path.resolve(__dirname, "../../vendor/swift-sdk");
/** Resolved base path of the SWIFT Security SDK vendor bundle */
const VENDOR_SECURITY_SDK = path.resolve(__dirname, "../../vendor/swift-security-sdk");

/**
 * JavaBridge — Node.js ↔ Java interop gateway for the SWIFT vendor JARs.
 *
 * Wraps child-process invocation of the SWIFT vendor utilities (SDK & Security
 * SDK) so that TypeScript services never shell out raw commands themselves.
 * The host environment must have a JRE/JDK ≥ 17 available on PATH.
 *
 * Vendor references:
 *   vendor/swift-sdk/file-encryptor-decryptor-2.17.1-3.jar
 *   vendor/swift-security-sdk/OAuthSession (LAU generation CLI)
 *   vendor/swift-sdk/config_encrypt_instructions.txt
 */
export class JavaBridge {
  private readonly encryptorJar: string;
  private readonly securitySdkLib: string;

  constructor(options?: {
    vendorSdkPath?: string;
    vendorSecuritySdkPath?: string;
  }) {
    const sdkBase = options?.vendorSdkPath ?? VENDOR_SDK;
    const secBase = options?.vendorSecuritySdkPath ?? VENDOR_SECURITY_SDK;
    this.encryptorJar = path.join(sdkBase, "file-encryptor-decryptor-2.17.1-3.jar");
    this.securitySdkLib = path.join(secBase, "lib");
  }

  // ─── Config file encryption ─────────────────────────────────────────────────

  /**
   * Encrypt a SWIFT SDK config YAML file using the vendor encryptor JAR.
   *
   * @param inputYaml       - Absolute path to the plain-text `.yaml` config
   * @param outputEncrypted - Destination path for the encrypted output file
   * @param secretKey       - Encryption passphrase
   * @returns stdout from the JAR (trimmed)
   */
  async encryptConfigFile(
    inputYaml: string,
    outputEncrypted: string,
    secretKey: string
  ): Promise<string> {
    const cmd = [
      "java", "-jar", q(this.encryptorJar),
      "encrypt",
      "-i", q(inputYaml),
      "-o", q(outputEncrypted),
      "-k", q(secretKey),
    ].join(" ");

    const { stdout } = await execPromise(cmd).catch((err: Error) => {
      throw new Error(`[JavaBridge] encryptConfigFile failed: ${err.message}`);
    });
    return stdout.trim();
  }

  /**
   * Decrypt a previously encrypted SWIFT SDK config file.
   */
  async decryptConfigFile(
    inputEncrypted: string,
    outputYaml: string,
    secretKey: string
  ): Promise<string> {
    const cmd = [
      "java", "-jar", q(this.encryptorJar),
      "decrypt",
      "-i", q(inputEncrypted),
      "-o", q(outputYaml),
      "-k", q(secretKey),
    ].join(" ");

    const { stdout } = await execPromise(cmd).catch((err: Error) => {
      throw new Error(`[JavaBridge] decryptConfigFile failed: ${err.message}`);
    });
    return stdout.trim();
  }

  // ─── Generic JAR runner ─────────────────────────────────────────────────────

  /**
   * Run any JAR from the SWIFT SDK vendor bundle with arbitrary arguments.
   *
   * @param jarRelativePath - Path relative to `vendor/swift-sdk/`
   * @param args            - CLI arguments forwarded to the JAR
   * @returns stdout (trimmed)
   */
  async runJar(jarRelativePath: string, args: string[]): Promise<string> {
    const jar = path.join(VENDOR_SDK, jarRelativePath);
    const cmd = ["java", "-jar", q(jar), ...args.map(q)].join(" ");

    const { stdout } = await execPromise(cmd).catch((err: Error) => {
      throw new Error(`[JavaBridge] runJar(${jarRelativePath}) failed: ${err.message}`);
    });
    return stdout.trim();
  }

  /**
   * Run a JAR from the SWIFT *Security* SDK vendor bundle.
   *
   * @param jarRelativePath - Path relative to `vendor/swift-security-sdk/`
   * @param args            - CLI arguments forwarded to the JAR
   */
  async runSecurityJar(jarRelativePath: string, args: string[]): Promise<string> {
    const jar = path.join(VENDOR_SECURITY_SDK, jarRelativePath);
    const cmd = ["java", "-jar", q(jar), ...args.map(q)].join(" ");

    const { stdout } = await execPromise(cmd).catch((err: Error) => {
      throw new Error(`[JavaBridge] runSecurityJar(${jarRelativePath}) failed: ${err.message}`);
    });
    return stdout.trim();
  }

  // ─── Static path helpers ────────────────────────────────────────────────────

  /** Resolve an absolute path inside the SWIFT SDK vendor directory */
  static sdkPath(...segments: string[]): string {
    return path.join(VENDOR_SDK, ...segments);
  }

  /** Resolve an absolute path inside the SWIFT Security SDK vendor directory */
  static securitySdkPath(...segments: string[]): string {
    return path.join(VENDOR_SECURITY_SDK, ...segments);
  }
}

/** Wrap a string in double-quotes for safe shell interpolation */
function q(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}
