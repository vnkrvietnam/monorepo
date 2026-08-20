import { z } from 'zod';

/**
 * Zod schema that validates all environment variables required by the
 * SWIFT SDK at runtime. Call `envSchema.parse(process.env)` during
 * application bootstrap to fail fast on misconfiguration.
 */
export const envSchema = z.object({
  /** HTTPS endpoint of the SWIFT Alliance Gateway or Alliance Lite2. */
  SWIFT_GATEWAY_URL: z.string().url({
    message: 'SWIFT_GATEWAY_URL must be a valid HTTPS URL',
  }),

  /**
   * 8- or 11-character BIC of the connecting institution (ISO 9362).
   * Validated against a regex; exact length enforced via refine.
   */
  SWIFT_INSTITUTION_BIC: z
    .string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
      message: 'SWIFT_INSTITUTION_BIC must be a valid 8 or 11-character BIC',
    })
    .refine((val) => val.length === 8 || val.length === 11, {
      message: 'SWIFT_INSTITUTION_BIC must be exactly 8 or 11 characters',
    }),

  /** HMAC-SHA256 secret for LAU header signing. Must be ≥ 32 characters. */
  SWIFT_LAU_KEY: z.string().min(32, {
    message: 'SWIFT_LAU_KEY must be at least 32 characters long',
  }),

  /** File-system path to the SWIFT PKI client certificate (PEM). */
  SWIFT_CERT_PATH: z.string().min(1, {
    message: 'SWIFT_CERT_PATH must not be empty',
  }),

  /** File-system path to the private key matching the PKI certificate. */
  SWIFT_KEY_PATH: z.string().min(1, {
    message: 'SWIFT_KEY_PATH must not be empty',
  }),

  /** Deployment environment — controls logging level and base URL resolution. */
  NODE_ENV: z.enum(['development', 'sandbox', 'production']),
});

/** Inferred TypeScript type from the environment variable schema. */
export type Env = z.infer<typeof envSchema>;
