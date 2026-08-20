import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

/**
 * OAuthTokenResponse — result returned by the SWIFT API Gateway token endpoint.
 *
 * Reference: SWIFT Developer Portal → API Gateway → OAuth 2.0 Client Credentials
 */
export interface OAuthTokenResponse {
  /** Bearer access token for SWIFT API calls */
  access_token: string;
  /** Token type — always "Bearer" */
  token_type: "Bearer";
  /** Lifetime in seconds (typically 1800 = 30 min) */
  expires_in: number;
  /** Absolute UTC epoch (ms) when this token expires — computed on receipt */
  expires_at: number;
  /** OAuth scope granted */
  scope?: string;
}

/**
 * OAuthClientConfig — configuration for the SWIFT OAuth2 client.
 * All values MUST come from environment variables — never hardcode.
 */
export interface OAuthClientConfig {
  /** SWIFT API Gateway token URL
   *  Sandbox: https://sandbox.swift.com/oauth2/v1/token
   *  Production: https://api.swift.com/oauth2/v1/token
   */
  tokenUrl: string;
  /** OAuth2 client_id (issued by SWIFT) */
  clientId: string;
  /** OAuth2 client_secret (issued by SWIFT — treat as a secret) */
  clientSecret: string;
  /** Space-separated list of OAuth scopes, e.g. "swift.preval!p swift.gpi.tracker!p" */
  scope?: string;
  /**
   * Optional: mutual TLS certificate for SWIFT mTLS endpoints.
   * Must be a PEM-encoded certificate + private key bundle.
   */
  tlsCert?: string;
  tlsKey?: string;
}

/**
 * SwiftOAuthClient — OAuth 2.0 Client Credentials flow for the SWIFT API Gateway.
 *
 * Handles token acquisition and transparent refresh so callers never need to
 * manage token lifecycle manually.
 *
 * Usage:
 * ```ts
 * const oauth = new SwiftOAuthClient({
 *   tokenUrl:     process.env.SWIFT_OAUTH_TOKEN_URL!,
 *   clientId:     process.env.SWIFT_CLIENT_ID!,
 *   clientSecret: process.env.SWIFT_CLIENT_SECRET!,
 *   scope:        process.env.SWIFT_OAUTH_SCOPE,
 * });
 *
 * const token = await oauth.getAccessToken();
 * // Use token in Authorization: Bearer <token> header
 * ```
 *
 * Vendor reference: SWIFT API Marketplace → OAuth 2.0 → Client Credentials Grant
 */
export class SwiftOAuthClient {
  private readonly config: OAuthClientConfig;
  /** Cached token — refreshed automatically before expiry */
  private cachedToken: OAuthTokenResponse | null = null;
  /** Seconds before expiry at which we proactively refresh (default: 60 s) */
  private readonly refreshBufferSecs: number;

  constructor(config: OAuthClientConfig, refreshBufferSecs = 60) {
    if (!config.tokenUrl)     throw new Error("[SwiftOAuth] tokenUrl is required");
    if (!config.clientId)     throw new Error("[SwiftOAuth] clientId is required");
    if (!config.clientSecret) throw new Error("[SwiftOAuth] clientSecret is required");
    this.config = config;
    this.refreshBufferSecs = refreshBufferSecs;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Return a valid Bearer access token, fetching a new one if none is cached
   * or the cached one is about to expire.
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.cachedToken!.access_token;
    }
    this.cachedToken = await this.fetchToken();
    return this.cachedToken.access_token;
  }

  /**
   * Force refresh the token regardless of expiry.
   * Useful after receiving an HTTP 401 from the SWIFT API.
   */
  async forceRefresh(): Promise<string> {
    this.cachedToken = await this.fetchToken();
    return this.cachedToken.access_token;
  }

  /** Return the full cached token object or null if not yet fetched */
  getCachedToken(): OAuthTokenResponse | null {
    return this.cachedToken;
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  private isTokenValid(): boolean {
    if (!this.cachedToken) return false;
    const nowMs  = Date.now();
    const bufMs  = this.refreshBufferSecs * 1000;
    return nowMs < this.cachedToken.expires_at - bufMs;
  }

  /**
   * Request a new access token from the SWIFT OAuth2 token endpoint.
   * Uses the `client_credentials` grant as mandated by SWIFT API Gateway.
   */
  private async fetchToken(): Promise<OAuthTokenResponse> {
    const urlObj   = new URL(this.config.tokenUrl);
    const isHttps  = urlObj.protocol === "https:";
    const transport = isHttps ? https : http;

    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const body = new URLSearchParams({ grant_type: "client_credentials" });
    if (this.config.scope) body.set("scope", this.config.scope);
    const bodyStr = body.toString();

    const tlsOptions: https.RequestOptions = {};
    if (isHttps && this.config.tlsCert && this.config.tlsKey) {
      tlsOptions.cert = this.config.tlsCert;
      tlsOptions.key  = this.config.tlsKey;
    }

    const options: https.RequestOptions = {
      ...tlsOptions,
      hostname: urlObj.hostname,
      port:     urlObj.port || (isHttps ? 443 : 80),
      path:     urlObj.pathname + urlObj.search,
      method:   "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Accept":        "application/json",
        "Authorization": `Basic ${credentials}`,
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    };

    return new Promise((resolve, reject) => {
      const req = transport.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          if ((res.statusCode ?? 0) >= 400) {
            reject(new Error(
              `[SwiftOAuth] Token endpoint returned HTTP ${res.statusCode}: ${raw}`
            ));
            return;
          }
          try {
            const json = JSON.parse(raw) as Omit<OAuthTokenResponse, "expires_at">;
            const tokenWithExpiry: OAuthTokenResponse = {
              ...json,
              expires_at: Date.now() + (json.expires_in ?? 1800) * 1000,
            };
            resolve(tokenWithExpiry);
          } catch {
            reject(new Error(`[SwiftOAuth] Failed to parse token response: ${raw}`));
          }
        });
      });

      req.on("error", reject);
      req.write(bodyStr);
      req.end();
    });
  }
}
