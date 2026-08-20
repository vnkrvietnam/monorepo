import type { BICRecord } from "../generators/iso20022-dto.js";

/** Options for constructing the RefDataClient */
export interface RefDataClientOptions {
  /** Base URL for the SWIFT SWIFTRef Open Data API */
  baseUrl?: string;
  /** OAuth2 Bearer token */
  accessToken: string;
  /** Request timeout in milliseconds (default: 30_000) */
  timeoutMs?: number;
}

/**
 * RefDataClient — SWIFT SWIFTRef BIC Directory Synchronisation.
 *
 * Provides access to the SWIFT SWIFTRef Open Data API for BIC lookups,
 * connected-institution directory searches, and delta-sync for offline
 * caching of the global bank directory.
 *
 * SWIFT SWIFTRef API docs:
 *   https://developer.swift.com/reference#tag/swift-ref-open-data
 */
export class RefDataClient {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly timeoutMs: number;

  constructor(options: RefDataClientOptions) {
    this.baseUrl = options.baseUrl?.replace(/\/$/, "") ?? "https://sandbox.swift.com";
    this.accessToken = options.accessToken;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  // ─── BIC lookup ─────────────────────────────────────────────────────────────

  /**
   * Look up a single BIC in the SWIFT BIC directory.
   *
   * @param bic - BIC8 or BIC11 to look up
   * @returns `BICRecord` if found, `null` if the BIC is not in the directory
   */
  async lookupBIC(bic: string): Promise<BICRecord | null> {
    const url = `${this.baseUrl}/swiftref/v3/bics/${encodeURIComponent(bic)}`;
    const res = await this._fetch(url);

    if (res.status === 404) return null;

    if (!res.ok) {
      throw new RefDataClientError(
        `SWIFTRef BIC lookup failed: HTTP ${res.status}`,
        res.status
      );
    }

    const body = (await res.json()) as SWIFTRefBICResponse;
    return mapBICResponse(body);
  }

  // ─── Institution search ─────────────────────────────────────────────────────

  /**
   * Search the BIC directory by institution name or country code.
   *
   * @param query.name        - Partial institution name (case-insensitive)
   * @param query.countryCode - ISO 3166-1 alpha-2 country code (e.g. "VN", "DE")
   * @param query.connected   - Filter to SWIFTNet-connected institutions only
   * @param query.limit       - Max results (default: 50)
   */
  async searchInstitutions(query: {
    name?: string;
    countryCode?: string;
    connected?: boolean;
    limit?: number;
  }): Promise<BICRecord[]> {
    const params = new URLSearchParams();
    if (query.name) params.set("institution_name", query.name);
    if (query.countryCode) params.set("country_code", query.countryCode);
    if (query.connected !== undefined) params.set("connected", String(query.connected));
    params.set("limit", String(query.limit ?? 50));

    const url = `${this.baseUrl}/swiftref/v3/bics?${params.toString()}`;
    const res = await this._fetch(url);

    if (!res.ok) {
      throw new RefDataClientError(
        `SWIFTRef institution search failed: HTTP ${res.status}`,
        res.status
      );
    }

    const body = (await res.json()) as { bics?: SWIFTRefBICResponse[] };
    return (body.bics ?? []).map(mapBICResponse);
  }

  // ─── Delta-sync ─────────────────────────────────────────────────────────────

  /**
   * Fetch BIC records updated since `since` (ISO 8601 date-time).
   *
   * Suitable for incremental local cache synchronisation.
   * Returns at most `limit` records per call; use `nextCursor` for pagination.
   *
   * @param since  - ISO 8601 timestamp of the last sync point
   * @param limit  - Maximum records to return per page (default: 500)
   * @param cursor - Pagination cursor from the previous page response
   */
  async fetchDelta(
    since: string,
    limit = 500,
    cursor?: string
  ): Promise<{ records: BICRecord[]; nextCursor?: string }> {
    const params = new URLSearchParams({
      updated_since: since,
      limit: String(limit),
    });
    if (cursor) params.set("cursor", cursor);

    const url = `${this.baseUrl}/swiftref/v3/bics/delta?${params.toString()}`;
    const res = await this._fetch(url);

    if (!res.ok) {
      throw new RefDataClientError(
        `SWIFTRef delta sync failed: HTTP ${res.status}`,
        res.status
      );
    }

    const body = (await res.json()) as {
      bics?: SWIFTRefBICResponse[];
      next_cursor?: string;
    };

    return {
      records: (body.bics ?? []).map(mapBICResponse),
      nextCursor: body.next_cursor,
    };
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

// ─── Error type ───────────────────────────────────────────────────────────────

export class RefDataClientError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "RefDataClientError";
    this.statusCode = statusCode;
  }
}

// ─── Internal type mapping ────────────────────────────────────────────────────

interface SWIFTRefBICResponse {
  bic?: string;
  institution_name?: string;
  country_code?: string;
  city?: string;
  address?: string;
  last_updated?: string;
  active?: boolean;
  connected?: boolean;
}

function mapBICResponse(raw: SWIFTRefBICResponse): BICRecord {
  return {
    bic: raw.bic ?? "",
    institutionName: raw.institution_name ?? "",
    countryCode: raw.country_code ?? "",
    city: raw.city,
    address: raw.address,
    lastUpdated: raw.last_updated ?? new Date().toISOString(),
    active: raw.active ?? true,
    connected: raw.connected ?? false,
  };
}
