import { z } from "zod";

/**
 * Environment variable schema for `@vnkrvietnam/sdk-swift`.
 *
 * All SWIFT SDK runtime configuration is sourced from the process environment
 * and validated at startup using Zod.  Call `validateEnv()` once during
 * application initialisation to surface missing/malformed variables early.
 *
 * Vendor reference: swift-sdk-2.17.10-6 — config-swift-sdk.yaml
 */
export const SwiftEnvSchema = z.object({
  // ─── SWIFT Alliance Gateway / Microgateway ────────────────────────────────
  /** Base URL of the SWIFT Microgateway or Alliance Access endpoint */
  SWIFT_MGW_URL: z.string().url("SWIFT_MGW_URL must be a valid URL"),
  /** Client BIC (8 or 11 characters) */
  SWIFT_BIC: z
    .string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid BIC format"),
  /** LAU HMAC-SHA256 signing key (≥32 hex chars) */
  SWIFT_LAU_KEY: z
    .string()
    .min(32, "SWIFT_LAU_KEY must be at least 32 characters"),

  // ─── PKI / TLS ────────────────────────────────────────────────────────────
  /** Path to the client TLS certificate (PEM) */
  SWIFT_TLS_CERT_PATH: z.string().min(1).optional(),
  /** Path to the client TLS private key (PEM) */
  SWIFT_TLS_KEY_PATH: z.string().min(1).optional(),
  /** Path to the CA bundle used to verify the SWIFT gateway TLS cert */
  SWIFT_TLS_CA_PATH: z.string().min(1).optional(),

  // ─── SWIFT gpi / SWIFTRef API ─────────────────────────────────────────────
  /** OAuth2 client_id for SWIFT Developer Portal API access */
  SWIFT_OAUTH_CLIENT_ID: z.string().min(1).optional(),
  /** OAuth2 client_secret */
  SWIFT_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
  /** SWIFT Developer Portal / SWIFTRef base URL */
  SWIFT_API_BASE_URL: z
    .string()
    .url()
    .default("https://sandbox.swift.com"),

  // ─── Blockchain providers ─────────────────────────────────────────────────
  /** JSON-RPC endpoint for EVM chains (Ethereum / BNB Chain) */
  EVM_RPC_URL: z.string().url().optional(),
  /** Tron full-node HTTP endpoint */
  TRON_RPC_URL: z.string().url().optional(),
  /** Solana RPC endpoint */
  SOLANA_RPC_URL: z.string().url().optional(),
  /** TON HTTP API endpoint */
  TON_RPC_URL: z.string().url().optional(),

  // ─── Cross-border escrow ──────────────────────────────────────────────────
  /** EVM address of the deployed CrossBorderEscrow smart contract */
  ESCROW_CONTRACT_ADDRESS: z.string().optional(),
  /** TRON Base58 address of the TRON escrow contract */
  TRON_ESCROW_ADDRESS: z.string().optional(),

  // ─── Audit / Compliance ───────────────────────────────────────────────────
  /** Data retention period for audit logs in days (default: 2555 ≈ 7 years) */
  AUDIT_RETENTION_DAYS: z.coerce.number().int().positive().default(2555),
  /** Optional external audit log API endpoint (e.g. SIEM/Splunk) */
  AUDIT_LOG_ENDPOINT: z.string().url().optional(),
});

export type SwiftEnv = z.infer<typeof SwiftEnvSchema>;

/**
 * Validate and parse SWIFT environment variables from `process.env`.
 *
 * @throws {ZodError} with structured field-level errors if validation fails
 * @returns Strongly-typed `SwiftEnv` object
 */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): SwiftEnv {
  return SwiftEnvSchema.parse(env);
}

/**
 * Safe variant — returns `{ success, data, error }` without throwing.
 */
export function safeValidateEnv(
  env: NodeJS.ProcessEnv = process.env
): { success: true; data: SwiftEnv } | { success: false; error: z.ZodError } {
  const result = SwiftEnvSchema.safeParse(env);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
