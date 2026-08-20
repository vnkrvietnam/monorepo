import axios from 'axios';
import { LauHeaderSigner } from '../security/lau-header.signer';

/**
 * Detailed record for an institution resolved from the SWIFT BIC directory.
 */
export interface BicRecord {
  /** 8- or 11-character BIC code (ISO 9362). */
  bic: string;
  /** Legal name of the financial institution. */
  institutionName: string;
  /** ISO 3166-1 alpha-2 country code where the institution is registered. */
  country: string;
  /** City where the institution's branch is located. */
  city: string;
  /** Street address of the institution's branch. */
  address: string;
}

/**
 * Client for querying the SWIFT BIC Directory to resolve institution details
 * from a BIC code.
 *
 * @see https://developer.swift.com/reference#tag/BIC-Directory
 */
export class BicDirectoryClient {
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
   * Looks up institution details for the given BIC code in the SWIFT
   * BIC Directory.
   *
   * @param bic 8- or 11-character BIC code to look up (ISO 9362).
   * @returns   `BicRecord` with institution name, country, city, and address.
   * @throws    `Error` (with HTTP status) if the BIC is not found or the
   *            gateway returns a non-2xx response.
   */
  async lookup(bic: string): Promise<BicRecord> {
    const endpoint = `${this.gatewayUrl}/swift/bicdirectory/v1/biccodes/${encodeURIComponent(bic)}`;
    const lauHeader = this.signer.buildHeader(bic);

    const response = await axios.get<BicRecord>(endpoint, {
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
