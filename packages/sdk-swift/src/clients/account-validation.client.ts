import axios from 'axios';
import { LauHeaderSigner } from '../security/lau-header.signer';

/**
 * Result returned after validating an account IBAN + BIC combination.
 */
export interface AccountValidationResult {
  /** IBAN that was validated. */
  iban: string;
  /** BIC associated with the account. */
  bic: string;
  /** `true` if the account is reachable and the IBAN/BIC pair is consistent. */
  isValid: boolean;
  /** Human-readable reason code when `isValid` is `false`. */
  reason?: string;
}

/**
 * Client for validating beneficiary account details against the
 * SWIFT Pre-Validation API before initiating a cross-border payment.
 *
 * @see https://developer.swift.com/reference#tag/Pre-Validation
 */
export class AccountValidationClient {
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
   * Validates that the given IBAN and BIC pair correspond to a reachable
   * account on the SWIFT network.
   *
   * @param iban IBAN of the beneficiary account (ISO 13616).
   * @param bic  BIC of the beneficiary institution (ISO 9362).
   * @returns    `AccountValidationResult` indicating validity and optional reason.
   * @throws     `Error` (with HTTP status) on network or gateway errors.
   */
  async validate(iban: string, bic: string): Promise<AccountValidationResult> {
    const endpoint = `${this.gatewayUrl}/swift/prevalidation/v2/accounts/verification`;
    const requestBody = JSON.stringify({ iban, bic });
    const lauHeader = this.signer.buildHeader(requestBody);

    const response = await axios.post<AccountValidationResult>(endpoint, { iban, bic }, {
      headers: {
        'X-SWIFT-Signature': lauHeader.signature,
        'X-SWIFT-Timestamp': lauHeader.timestamp,
        'X-SWIFT-AppId': lauHeader.appId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return response.data;
  }
}
