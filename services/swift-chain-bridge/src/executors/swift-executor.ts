import axios from "axios";
import type { SWIFTMT103Payload } from "@vnkrvietnam/swift-adapter";

/**
 * SwiftExecutor — gọi swift-gateway để bắn điện SWIFT outbound.
 *
 * Dùng trong luồng OUTBOUND:
 *   OnChainListener detect SwiftOutboundRequested event
 *   → SwiftExecutor.sendMT103() → POST swift-gateway:4004/api/v1/swift/send-mt103
 *   → swift-gateway → MGW → SWIFT Net
 */
export class SwiftExecutor {
  private readonly gatewayUrl: string;
  private readonly apiKey: string;
  private readonly bic: string;

  constructor(
    gatewayUrl: string = process.env["SWIFT_GATEWAY_URL"] ?? "http://localhost:4004",
    apiKey:     string = process.env["SWIFT_API_KEY"]     ?? "",
    bic:        string = process.env["SWIFT_BIC_CODE"]    ?? "VNKRVNVNXXX"
  ) {
    this.gatewayUrl = gatewayUrl;
    this.apiKey     = apiKey;
    this.bic        = bic;
  }

  /**
   * Gửi điện MT103 ra mạng SWIFT thông qua swift-gateway.
   *
   * @param params.uetr               UETR (dùng làm reference)
   * @param params.receiverBic        BIC ngân hàng nhận
   * @param params.amountUsd          Số tiền (đơn vị: USD, float)
   * @param params.senderAddress      Địa chỉ EVM người gửi (dùng làm account ref)
   * @param params.beneficiaryName    Tên người nhận
   * @param params.beneficiaryAccount Số tài khoản người nhận
   */
  async sendMT103(params: {
    uetr: string;
    receiverBic: string;
    amountUsd: number;
    currency?: string;
    senderAddress: string;
    beneficiaryName: string;
    beneficiaryAccount: string;
    remittanceInfo?: string;
  }): Promise<{
    success: boolean;
    messageId: string;
    lauSignature: string;
    status: string;
    transmissionId?: string;
  }> {
    const payload: SWIFTMT103Payload = {
      senderBIC:          this.bic,
      receiverBIC:        params.receiverBic.padEnd(11, "X").slice(0, 11),
      reference:          `BRIDGE-${params.uetr.slice(0, 10)}`,
      amount:             params.amountUsd,
      currency:           params.currency ?? "USD",
      orderingAccount:    params.senderAddress.slice(0, 34),
      orderingName:       "VNKR ON-CHAIN USER",
      beneficiaryAccount: params.beneficiaryAccount,
      beneficiaryName:    params.beneficiaryName,
      chargesCode:        "OUR",
    };

    const response = await axios.post(
      `${this.gatewayUrl}/api/v1/swift/send-mt103`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "x-api-key": this.apiKey } : {}),
        },
        timeout: 15_000,
      }
    );

    return {
      success:        response.data.success ?? true,
      messageId:      response.data.messageId,
      lauSignature:   response.data.lauSignature,
      status:         response.data.status,
      transmissionId: response.data.transmissionId,
    };
  }

  /**
   * Gửi điện pacs.008 (ISO 20022) khi đối tác yêu cầu MX format.
   */
  async sendPacs008(params: {
    msgId: string;
    receiverBic: string;
    amountUsd: number;
    currency?: string;
    senderName: string;
    senderIBAN: string;
    beneficiaryName: string;
    beneficiaryIBAN: string;
  }): Promise<{ success: boolean; messageId: string; status: string }> {
    const response = await axios.post(
      `${this.gatewayUrl}/api/v1/swift/send-pacs008`,
      {
        msgId:          params.msgId,
        instrId:        `INSTR-${Date.now()}`,
        endToEndId:     `E2E-BRIDGE-${Date.now()}`,
        txId:           params.msgId,
        intrBkSttlmAmt: params.amountUsd,
        currency:       params.currency ?? "USD",
        dbtrName:       params.senderName,
        dbtrAcctIBAN:   params.senderIBAN,
        dbtrAgtBIC:     this.bic,
        cdtrAgtBIC:     params.receiverBic,
        cdtrName:       params.beneficiaryName,
        cdtrAcctIBAN:   params.beneficiaryIBAN,
      },
      {
        headers: { "Content-Type": "application/json", ...(this.apiKey ? { "x-api-key": this.apiKey } : {}) },
        timeout: 15_000,
      }
    );
    return { success: true, messageId: response.data.messageId, status: response.data.status };
  }
}
