import Ajv, { type ValidateFunction } from "ajv";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/** Default path to the JSON schema bundled with the SWIFT vendor SDK */
const DEFAULT_SCHEMA_PATH = path.resolve(
  __dirname,
  "../../vendor/swift-sdk-2.17.10-6/config-swift-sdk-schema.json"
);

/** Default path to the encrypted-ready config template */
const DEFAULT_PROPERTIES_TEMPLATE = path.resolve(
  __dirname,
  "../../vendor/swift-sdk-2.17.10-6/config-swift-sdk-properties.yaml"
);

/**
 * SwiftConfigManager — validates and manages SWIFT SDK configuration files.
 *
 * Responsibilities:
 *  1. Validate a plain-text `config-swift-sdk.yaml` against the vendor JSON schema.
 *  2. Delegate encryption to the `file-encryptor-decryptor-2.17.1-3.jar` via
 *     a synchronous child process (suitable for startup/init flows).
 *
 * Vendor references:
 *   vendor/swift-sdk-2.17.10-6/config-swift-sdk-schema.json
 *   vendor/swift-sdk-2.17.10-6/config-swift-sdk.yaml
 *   vendor/swift-sdk-2.17.10-6/file-encryptor-decryptor-2.17.1-3.jar
 *   vendor/swift-sdk-2.17.10-6/config_encrypt_instructions.txt
 */
export class SwiftConfigManager {
  private readonly ajv: Ajv;
  private readonly schemaPath: string;
  private validate: ValidateFunction | null = null;

  constructor(options?: { schemaPath?: string }) {
    this.schemaPath = options?.schemaPath ?? DEFAULT_SCHEMA_PATH;
    this.ajv = new Ajv({ allErrors: true, strict: false });
  }

  // ─── Schema validation ──────────────────────────────────────────────────────

  /**
   * Validate a parsed config object against config-swift-sdk-schema.json.
   *
   * @param configObject - The already-parsed YAML/JSON config as a plain object
   * @returns `true` on success, throws `SwiftConfigValidationError` on failure
   */
  validateObject(configObject: unknown): true {
    if (!this.validate) {
      const schema = JSON.parse(fs.readFileSync(this.schemaPath, "utf8")) as object;
      this.validate = this.ajv.compile(schema);
    }

    const valid = this.validate(configObject);
    if (!valid) {
      const errors = this.ajv.errorsText(this.validate.errors);
      throw new SwiftConfigValidationError(
        `SWIFT configuration validation failed:\n${errors}`,
        this.validate.errors ?? []
      );
    }
    return true;
  }

  /**
   * Read and validate a YAML config file.
   * Requires `js-yaml` to be installed by the caller's package if used.
   *
   * @param configFilePath - Absolute or relative path to the `.yaml` config file
   */
  validateFile(configFilePath: string): true {
    // Dynamic require so the dependency is optional at the package level
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yaml = require("js-yaml") as typeof import("js-yaml");
    const content = yaml.load(fs.readFileSync(configFilePath, "utf8"));
    return this.validateObject(content);
  }

  // ─── Config encryption ──────────────────────────────────────────────────────

  /**
   * Encrypt a SWIFT SDK YAML config file using the vendor JAR.
   * Runs synchronously — call this during application startup, not on hot paths.
   *
   * @param inputYaml       - Path to plain-text config YAML
   * @param outputEncrypted - Destination path for the encrypted file
   * @param secretKey       - Encryption passphrase
   * @param options.jarPath - Override path to the encryptor JAR
   */
  encryptConfig(
    inputYaml: string,
    outputEncrypted: string,
    secretKey: string,
    options?: { jarPath?: string }
  ): void {
    const jar =
      options?.jarPath ??
      path.join(path.dirname(this.schemaPath), "file-encryptor-decryptor-2.17.1-3.jar");

    execSync(
      `java -jar "${jar}" encrypt -i "${inputYaml}" -o "${outputEncrypted}" -k "${secretKey}"`,
      { stdio: "inherit" }
    );
  }

  /**
   * Decrypt a SWIFT SDK config file using the vendor JAR.
   */
  decryptConfig(
    inputEncrypted: string,
    outputYaml: string,
    secretKey: string,
    options?: { jarPath?: string }
  ): void {
    const jar =
      options?.jarPath ??
      path.join(path.dirname(this.schemaPath), "file-encryptor-decryptor-2.17.1-3.jar");

    execSync(
      `java -jar "${jar}" decrypt -i "${inputEncrypted}" -o "${outputYaml}" -k "${secretKey}"`,
      { stdio: "inherit" }
    );
  }

  // ─── Template helpers ───────────────────────────────────────────────────────

  /**
   * Returns the content of the default SWIFT SDK properties template.
   * Useful for scaffolding a new config file.
   */
  getPropertiesTemplate(): string {
    return fs.readFileSync(DEFAULT_PROPERTIES_TEMPLATE, "utf8");
  }
}

// ─── Error types ──────────────────────────────────────────────────────────────

export class SwiftConfigValidationError extends Error {
  public readonly validationErrors: unknown[];

  constructor(message: string, errors: unknown[]) {
    super(message);
    this.name = "SwiftConfigValidationError";
    this.validationErrors = errors;
  }
}
