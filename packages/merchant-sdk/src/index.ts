import axios, { type AxiosInstance } from "axios";
import type { MerchantCreateOrderRequest, MerchantOrderResponse } from "@vnkrvietnam/types";
import { DEFAULT_API_ENDPOINT } from "@vnkrvietnam/config";

export class VNKRMerchantClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseURL = DEFAULT_API_ENDPOINT) {
    this.client = axios.create({
      baseURL,
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  /** Create a new payment order */
  async createOrder(req: MerchantCreateOrderRequest): Promise<MerchantOrderResponse> {
    const { data } = await this.client.post<MerchantOrderResponse>("/v1/orders", req);
    return data;
  }

  /** Query order status by ID */
  async getOrder(orderId: string): Promise<MerchantOrderResponse> {
    const { data } = await this.client.get<MerchantOrderResponse>(`/v1/orders/${orderId}`);
    return data;
  }
}
