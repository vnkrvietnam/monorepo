import axios from 'axios';
import { LauHeaderSigner } from '../security/lau-header.signer';

/** Tracking status for a single agent in the payment chain. */
export interface GpiAgentStatus {
  /** BIC of the agent institution. */
  bicfi: string;
  /**
   * Agent-level tracker status.
   * Common values: "ACSP" (Accepted), "ACCC" (Completed), "RJCT" (Rejected).
   */
  trackerStatus: string;
}

/**
 * Payment status object returned by the SWIFT GPI Tracker for a given UETR.
 */
export interface GpiPaymentStatus {
  /** Unique End-to-End Transaction Reference (UUID v4). */
  uetr: string;
  /**
   * Overall payment status code.
   * Common values: "ACSP" (In-flight), "ACCC" (Credited), "RJCT" (Rejected).
   */
  status: string;
  /** ISO 8601 datetime of the last tracker update. */
  lastUpdateDt: string;
  /** Ordered list of agents that have processed or are processing the payment. */
  agents: GpiAgentStatus[];
}

/**
 * Client for querying the SWIFT GPI Tracker API to retrieve real-time
 * payment status by UETR.
 *
 * @see https://developer.swift.com/reference#tag/GPI-Payments-Tracker
 */
export class GpiTrackerClient {
  private readonly gatewayUrl: string;
  private readonly signer: LauHeaderSigner;

  /**
   * @param gatewayUrl Base URL of the SWIFT Alliance Gateway (no trailing slash).
   * @param signer     `LauHeaderSigner` instance for signing outbound requests.
   */
  constructor(gatewayUrl: string, signer: LauHeaderSigner) {
    this.gatewayUrl = gatewayUrl;
    this.signer = signer;
  }

  /**
   * Retrieves the current payment status for the given UETR from SWIFT GPI Tracker.
   *
   * @param uetr UUID v4 Unique End-to-End Transaction Reference.
   * @returns    `GpiPaymentStatus` object with current tracking information.
   * @throws     `Error` (with HTTP status) if the tracker returns a non-2xx response.
   */
  async trackByUetr(uetr: string): Promise<GpiPaymentStatus> {
    const endpoint = `${this.gatewayUrl}/swift/txtracking/v2/transactions/${uetr}`;
    const lauHeader = this.signer.buildHeader(uetr);

    const response = await axios.get<GpiPaymentStatus>(endpoint, {
      headers: {
        'X-SWIFT-Signature': lauHeader.signature,
        'X-SWIFT-Timestamp': lauHeader.timestamp,
        'X-SWIFT-AppId': lauHeader.appId,
        Accept: 'application/json',
      },
    });

    return response.data;
  }
}
