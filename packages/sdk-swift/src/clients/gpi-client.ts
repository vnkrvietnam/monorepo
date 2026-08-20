import type { GPITransactionStatus } from "../generators/iso20022-dto.js";

/**
 * Options for constructing the GPIClient.
 */
export interface GPIClientOptions {
  /**
   * Base URL of the SWIFT Developer Portal / Sandbox API.
   * Defaults to `https://sandbox.swift.com`
   */
  baseUrl?: string;
  /** OAuth2 Bearer token (pre-fetched) */
  accessToken: string;
  /** Optional fetch timeout in milliseconds (default: 30_000) */
  timeoutMs?: number;
}

/**
 * GPIClient — SWIFT gpi UETR realtime transaction lookup.
 *
 * Wraps the SWIFT Tracker API (`/swift-apitracker/v5/payments/{uetr}/transactions`)
 * to query the live status of a cross-border payment identified by its UETR.
 *
 * Documentation:
 *   https://developer.swift.com/swift-apitracker
 *
 * Authentication:
 *   OAuth2 Bearer token obtained via SWIFT Developer Portal credentials.
 *   In production, obtain the token using `swift-security-sdk OAuthSession`.
 */
export class GPIClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly timeoutMs: number;

  constructor(options: GPIClientOptions) {
    this.baseUrl = options.baseUrl?.replace(/\/$/, "") ?? "https://sandbox.swift.com";
    this.accessToken = options.accessToken;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  // ─── UETR Status Lookup ─────────────────────────────────────────────────────

  /**
   * Fetch the real-time status of a SWIFT payment by UETR.
   *
   * @param uetr - The UUID v4 Unique End-to-End Transaction Reference
   * @returns Parsed `GPITransactionStatus` object
   * @throws On HTTP error or network failure
   */
  async getTransactionStatus(uetr: string): Promise<GPITransactionStatus> {
    const url = `${this.baseUrl}/swift-apitracker/v5/payments/${encodeURIComponent(uetr)}/transactions`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new GPIClientError(
          `SWIFT GPI API error ${res.status}: ${res.statusText}`,
          res.status,
          body
        );
      }

      const json = (await res.json()) as SWIFTTrackerAPIResponse;
      return mapAPIResponseToStatus(uetr, json);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Confirm delivery of a SWIFT gpi payment (tracker confirmation endpoint).
   * Updates payment status to `ACSC` (Accepted Settlement Completed).
   *
   * @param uetr          - UETR of the payment to confirm
   * @param confirmingBIC - BIC of the final agent confirming delivery
   */
  async confirmDelivery(uetr: string, confirmingBIC: string): Promise<void> {
    const url = `${this.baseUrl}/swift-apitracker/v5/payments/${encodeURIComponent(uetr)}/status`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_status: "ACSC",
          confirming_agent_bic: confirmingBIC,
          confirmation_time: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new GPIClientError(
          `SWIFT GPI confirm failed ${res.status}: ${res.statusText}`,
          res.status,
          body
        );
      }
    } finally {
      clearTimeout(timer);
    }
  }
}

// ─── Error type ───────────────────────────────────────────────────────────────

export class GPIClientError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: string;

  constructor(message: string, statusCode: number, responseBody: string) {
    super(message);
    this.name = "GPIClientError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

// ─── Internal API response mapping ───────────────────────────────────────────

/** Raw shape returned by the SWIFT Tracker API v5 */
interface SWIFTTrackerAPIResponse {
  uetr?: string;
  transaction_status?: string;
  payment_events?: Array<{
    agent_bic?: string;
    transaction_status?: string;
    date?: string;
    reason_code?: string;
  }>;
  last_update_time?: string;
}

function mapAPIResponseToStatus(
  uetr: string,
  raw: SWIFTTrackerAPIResponse
): GPITransactionStatus {
  const events = (raw.payment_events ?? []).map((e) => ({
    agentBIC: e.agent_bic ?? "UNKNOWN",
    status: e.transaction_status ?? "UNKNOWN",
    eventTime: e.date ?? new Date().toISOString(),
    reasonCode: e.reason_code,
  }));

  const status = raw.transaction_status as GPITransactionStatus["transactionStatus"] ?? "PDNG";

  return {
    uetr: raw.uetr ?? uetr,
    transactionStatus: status,
    lastUpdateTime: raw.last_update_time ?? new Date().toISOString(),
    events,
  };
}
