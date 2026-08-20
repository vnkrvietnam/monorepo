import { ConfigError } from "../errors/index.js";
import type { SWIFTConfig } from "../types/index.js";

// Re-export SwiftConfigManager and SwiftJavaBridge from swift-adapter
export { SwiftConfigManager, SwiftConfigValidationError } from "@vnkrvietnam/swift-adapter";
export { SwiftJavaBridge } from "@vnkrvietnam/swift-adapter";

/**
 * Load SWIFT configuration from environment variables.
 * @throws {ConfigError} if LAU_KEY_HEX is missing
 */
export function loadSWIFTConfig(): SWIFTConfig {
  const lauKeyHex = process.env["LAU_KEY_HEX"] ?? process.env["LAU_KEY"] ?? "";

  if (!lauKeyHex) {
    throw new ConfigError(
      "LAU_KEY_HEX environment variable is required for SWIFT LAU signing.",
      { env: "LAU_KEY_HEX" },
    );
  }

  return {
    lauKeyHex,
    gatewayUrl: process.env["SWIFT_GATEWAY_URL"],
    redisStreamPrefix: process.env["SWIFT_REDIS_STREAM_PREFIX"] ?? "vnkr:swift",
    configFilePath: process.env["SWIFT_CONFIG_FILE_PATH"],
    encryptedConfigPath: process.env["SWIFT_ENCRYPTED_CONFIG_PATH"],
    encryptionKey: process.env["SWIFT_CONFIG_ENCRYPTION_KEY"],
    javaPath: process.env["JAVA_PATH"] ?? "java",
    encryptorJarPath: process.env["SWIFT_ENCRYPTOR_JAR_PATH"],
  };
}

/**
 * Validate a SWIFTConfig object — throws ConfigError on first violation.
 */
export function validateSWIFTConfig(config: SWIFTConfig): true {
  if (!config.lauKeyHex || config.lauKeyHex.length < 32) {
    throw new ConfigError("lauKeyHex must be at least 32 hex characters.", {
      length: config.lauKeyHex?.length ?? 0,
    });
  }
  if (config.gatewayUrl && !config.gatewayUrl.startsWith("http")) {
    throw new ConfigError("gatewayUrl must start with http:// or https://", {
      gatewayUrl: config.gatewayUrl,
    });
  }
  return true;
}
