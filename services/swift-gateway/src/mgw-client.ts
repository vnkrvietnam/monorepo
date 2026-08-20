import axios, { type AxiosInstance } from "axios";

/**
 * HTTP client for the SWIFT Microgateway 2.0.17 internal APIs.
 *
 * The MGW daemon runs as a separate JVM process (swift-mgw-2.0.17-1.jar)
 * and exposes three REST APIs on its configured port (default: 9003):
 *   - Management  API  →  /sag/active, /oas-repository, /local-sign
 *   - Configuration API →  /profile, /certificate, /business-application
 *   - Monitoring  API  →  /health, /info, /metrics/:name
 *
 * Vendor reference: oas/internal/SWIFT-API-mgw-*.json (swift-mgw-2.0.17-1)
 */
export class MGWClient {
  private readonly http: AxiosInstance;

  constructor(
    baseURL: string = process.env["SWIFT_MGW_URL"] ?? "http://localhost:9003",
    apiKey: string = process.env["SWIFT_MGW_APIKEY"] ?? ""
  ) {
    this.http = axios.create({
      baseURL,
      timeout: 10_000,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
    });
  }

  // ─── Monitoring ─────────────────────────────────────────────────────────────

  /** GET /health — check MGW daemon liveness */
  async health(): Promise<{ status: string }> {
    const r = await this.http.get<{ status: string }>("/health");
    return r.data;
  }

  /** GET /info — retrieve build metadata */
  async info(): Promise<Record<string, unknown>> {
    const r = await this.http.get<Record<string, unknown>>("/info");
    return r.data;
  }

  // ─── Management ─────────────────────────────────────────────────────────────

  /** GET /sag/active — retrieve active SAG configuration */
  async getActiveSAG(): Promise<Record<string, unknown>> {
    const r = await this.http.get<Record<string, unknown>>("/sag/active");
    return r.data;
  }

  /**
   * POST /local-sign — request MGW to apply a local LAU signature.
   *
   * The MGW delegates the HMAC operation to the bundled
   * swift-security-sdk-2.0.11.jar internally.
   */
  async localSign(payload: { message: string }): Promise<{ signature: string }> {
    const r = await this.http.post<{ signature: string }>("/local-sign", payload);
    return r.data;
  }

  // ─── Business Application ────────────────────────────────────────────────────

  /**
   * Forward a signed SWIFT FIN/MX message to the MGW for onward delivery
   * to the SWIFT Alliance Access / SWIFTNet bus.
   *
   * The MGW proxies the request to the upstream SWIFT API Gateway
   * (api.swiftnet.sipn.swift.com) using the configured certificate and OAuth2
   * credentials from config-swift-mgw.yaml.
   */
  async forwardMessage(params: {
    businessApplication: string;
    rawMessage: string;
    lauSignature: string;
    lauTimestamp: string;
    messageType: "MT103" | "MT202" | "pacs.008" | "pacs.009" | "camt.053";
  }): Promise<{
    uetr?: string;
    status: string;
    mgwRef: string;
  }> {
    const r = await this.http.post<{ uetr?: string; status: string; mgwRef: string }>(
      `/api/v1/messages`,
      {
        businessApplication: params.businessApplication,
        message: params.rawMessage,
        lau: {
          signature: params.lauSignature,
          timestamp: params.lauTimestamp,
        },
        messageType: params.messageType,
      }
    );
    return r.data;
  }

  // ─── Management ─────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/rma/check — check RMA authorisation between two BICs.
   */
  async rmaCheck(params: {
    senderBic?: string;
    receiverBic?: string;
    service?: string;
  }): Promise<{
    authorized: boolean;
    senderBic: string;
    receiverBic: string;
    service: string;
    validUntil?: string;
    source?: string;
  }> {
    const r = await this.http.get<{
      authorized: boolean;
      senderBic: string;
      receiverBic: string;
      service: string;
      validUntil?: string;
      source?: string;
    }>("/api/v1/rma/check", { params });
    return r.data;
  }
}
