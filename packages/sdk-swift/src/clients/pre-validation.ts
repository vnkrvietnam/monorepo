import type { PreValidationRequest, PreValidationResult, BIC } from "../generators/iso20022-dto.js";

/**
 * Options for constructing the PreValidationClient.
 */
export interface PreValidationClientOptions {
  /** Base URL of the SWIFT Pre-Validation API */
  baseUrl?: string;
  /** OAuth2 Bearer token */
  accessToken: string;
  /** Request timeout in milliseconds (default: 15_000) */
  timeoutMs?: number;
}

/**
 * PreValidationClient — SWIFT Account & BIC Pre-Validation.
 *
 * Uses the SWIFT Pre-Validation API to verify BIC codes, IBANs, and
 * beneficiary name matches before committing a payment instruction.
 * This reduces SWIFT rejections and return costs.
 *
 * SWIFT Pre-Validation API docs:
 *   https://developer.swift.com/reference#tag/payment-pre-validation
 */
export class PreValidationClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly timeoutMs: number;

  constructor(options: PreValidationClientOptions) {
    this.baseUrl = options.baseUrl?.replace(/\/$/, "") ?? "https://sandbox.swift.com";
    this.accessToken = options.accessToken;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  // ─── BIC validation ─────────────────────────────────────────────────────────

  /**
   * Validate a BIC code against the SWIFT BIC directory.
   *
   * Performs a lightweight local format check first, then calls the
   * remote SWIFT SWIFTRef API for live connectivity verification.
   *
   * @param bic - BIC8 or BIC11 code
   */
  async validateBIC(bic: string): Promise<{ valid: boolean; connected: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Local format check (no API call needed)
    if (!isBICFormatValid(bic)) {
      errors.push(`Invalid BIC format: "${bic}". Expected 8 or 11 alphanumeric characters.`);
      return { valid: false, connected: false, errors };
    }

    // Remote live check
    try {
      const url = `${this.baseUrl}/swift-preval/v2/bics/${encodeURIComponent(bic)}`;
      const res = await this._fetch(url);

      if (res.status === 404) {
        return { valid: false, connected: false, errors: [`BIC ${bic} not found in SWIFT directory`] };
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const body = (await res.json()) as { connected?: boolean };
      return { valid: true, connected: body.connected ?? false, errors: [] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { valid: false, connected: false, errors: [`BIC validation request failed: ${msg}`] };
    }
  }

  // ─── Full pre-validation ────────────────────────────────────────────────────

  /**
   * Perform full pre-validation: BIC + IBAN + optional name match.
   *
   * Calls the SWIFT Pre-Validation API endpoint
   * `POST /swift-preval/v2/accounts/verification`.
   *
   * @param request - Validation request payload
   */
  async validate(request: PreValidationRequest): Promise<PreValidationResult> {
    const errors: string[] = [];

    // Local BIC format check
    const bicValid = isBICFormatValid(request.bic);
    if (!bicValid) {
      errors.push(`Invalid BIC format: "${request.bic}"`);
    }

    // Local IBAN format check
    let ibanValid: boolean | undefined;
    if (request.iban) {
      ibanValid = isIBANFormatValid(request.iban);
      if (!ibanValid) {
        errors.push(`Invalid IBAN format: "${request.iban}"`);
      }
    }

    // If local checks fail, return without calling the remote API
    if (errors.length > 0) {
      return { valid: false, bicValid, ibanValid, errors };
    }

    // Remote API call
    try {
      const url = `${this.baseUrl}/swift-preval/v2/accounts/verification`;
      const body: Record<string, unknown> = {
        creditor_bic: request.bic,
        ...(request.iban ? { creditor_account: { iban: request.iban } } : {}),
        ...(request.beneficiaryName ? { creditor_name: request.beneficiaryName } : {}),
        ...(request.currency ? { currency: request.currency } : {}),
      };

      const res = await this._fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const respText = await res.text().catch(() => "");
        errors.push(`Pre-validation API error ${res.status}: ${respText}`);
        return { valid: false, bicValid, ibanValid, errors };
      }

      const result = (await res.json()) as {
        account_verification_result?: string;
        name_match_score?: number;
      };

      const remoteValid = result.account_verification_result === "VALI";
      if (!remoteValid) {
        errors.push(
          `Account verification result: ${result.account_verification_result ?? "UNKNOWN"}`
        );
      }

      return {
        valid: remoteValid,
        bicValid: true,
        ibanValid,
        nameMatchScore: result.name_match_score,
        errors,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Pre-validation request failed: ${msg}`);
      return { valid: false, bicValid, ibanValid, errors };
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async _fetch(url: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
          ...(init.headers as Record<string, string> | undefined),
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─── Validation helpers ───────────────────────────────────────────────────────

/** BIC8 or BIC11 format: 6 alpha + 2 alphanumeric + optional 3 alphanumeric */
function isBICFormatValid(bic: BIC): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic);
}

/** IBAN: 2-letter country code + 2 check digits + up to 30 alphanumeric */
function isIBANFormatValid(iban: string): boolean {
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(iban.replace(/\s/g, ""));
}
