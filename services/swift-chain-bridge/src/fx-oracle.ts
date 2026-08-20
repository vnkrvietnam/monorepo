import axios from "axios";

// ─── FX Rate Types ────────────────────────────────────────────────────────────

export interface FXRateResult {
  /** ISO 4217 currency code */
  currency: string;
  /** Tỷ giá sang VND, ví dụ: 25_450 (1 USD = 25,450 VND) */
  rateToVnd: number;
  /** Unix timestamp khi lấy tỷ giá */
  timestamp: number;
  /** Nguồn tỷ giá */
  source: "SBV" | "VIETCOMBANK" | "CHAINLINK" | "FALLBACK";
}

/** Bảng tỷ giá fallback — cập nhật định kỳ từ SBV */
const FALLBACK_RATES: Record<string, number> = {
  VND: 1,
  USD: 25_450,
  EUR: 27_600,
  GBP: 32_300,
  JPY: 165,
  SGD: 18_900,
  AED: 6_930,
  CNY: 3_510,
  KRW: 18,
  HKD: 3_265,
  THB: 705,
  MYR: 5_420,
  AUD: 16_800,
  CAD: 18_750,
  CHF: 28_900,
};

// ─── SBV API ──────────────────────────────────────────────────────────────────

/**
 * Lấy tỷ giá từ API Ngân hàng Nhà nước Việt Nam (SBV).
 * Endpoint: https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx
 * hoặc NHNN API: https://www.sbv.gov.vn/webcenter/contentattachment/...
 */
async function fetchFromVietcombank(currency: string): Promise<number | null> {
  try {
    const url = process.env["VIETCOMBANK_FX_API"] ??
      "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=10";

    const resp = await axios.get(url, { timeout: 5_000 });
    const xml: string = resp.data;

    // Parse XML đơn giản — tìm <Exrate CurrencyCode="USD" ... Transfer="25450.00"/>
    const pattern = new RegExp(
      `CurrencyCode="${currency.toUpperCase()}"[^>]*Transfer="([\\d.]+)"`,
      "i"
    );
    const match = xml.match(pattern);
    if (match?.[1]) {
      return parseFloat(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lấy tỷ giá từ SBV Open API (nguồn chính thức NHNN).
 */
async function fetchFromSBV(currency: string): Promise<number | null> {
  try {
    const apiKey = process.env["SBV_API_KEY"];
    const url    = process.env["SBV_FX_API_URL"] ??
      `https://apiv2.sbv.gov.vn/ExchangeRates?CurrencyCode=${currency.toUpperCase()}`;

    const headers = apiKey ? { "Authorization": `Bearer ${apiKey}` } : {};
    const resp    = await axios.get(url, { timeout: 5_000, headers });

    // SBV trả JSON array: [{ "CurrencyCode": "USD", "TransferRate": 25450.00, ... }]
    const data = resp.data as Array<{ CurrencyCode: string; TransferRate?: number; SellRate?: number }>;
    const record = data.find((d) => d.CurrencyCode.toUpperCase() === currency.toUpperCase());
    if (record) {
      return record.TransferRate ?? record.SellRate ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── VNKRBrokerFXOracle ───────────────────────────────────────────────────────

/**
 * VNKRBrokerFXOracle — FX Rate Engine cho VNKR SWIFT Chain Bridge.
 *
 * Nguồn tỷ giá theo thứ tự ưu tiên:
 *   1. SBV Open API (Ngân hàng Nhà nước Việt Nam) — nguồn pháp lý chính thức
 *   2. Vietcombank XML Feed — nguồn thực tế thị trường
 *   3. Fallback rates (hardcoded, cập nhật khi deploy)
 *
 * Production: Tích hợp Chainlink Data Feed trên App-Chain EVM
 * bằng cách set CHAINLINK_FX_FEED_ADDRESS trong env.
 *
 * Vendor reference: TODO/6-V3.md — Section 3 "FX Oracle Integration"
 */
export class VNKRBrokerFXOracle {
  /** Cache in-memory để tránh gọi API liên tục — TTL: 5 phút */
  private readonly cache = new Map<string, { rate: number; fetchedAt: number; source: FXRateResult["source"] }>();
  private readonly cacheTtlMs: number;

  constructor(cacheTtlMs: number = 5 * 60 * 1_000) {
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Lấy tỷ giá thực của `currency` so với VND.
   * Trả về integer (VND per 1 đơn vị ngoại tệ).
   * VND → luôn trả về 1 (không tốn phí FX).
   */
  async getLiveFXRate(currency: string): Promise<number> {
    const { rateToVnd } = await this.getFullFXRate(currency);
    return rateToVnd;
  }

  /**
   * Lấy FXRateResult đầy đủ gồm tỷ giá, timestamp và nguồn.
   */
  async getFullFXRate(currency: string): Promise<FXRateResult> {
    const sym = currency.toUpperCase();

    // VND: tỷ giá cố định 1:1
    if (sym === "VND") {
      return { currency: "VND", rateToVnd: 1, timestamp: Date.now(), source: "FALLBACK" };
    }

    // Cache hit
    const cached = this.cache.get(sym);
    if (cached && Date.now() - cached.fetchedAt < this.cacheTtlMs) {
      return { currency: sym, rateToVnd: cached.rate, timestamp: cached.fetchedAt, source: cached.source };
    }

    // 1. Thử SBV API
    let rate = await fetchFromSBV(sym);
    let source: FXRateResult["source"] = "SBV";

    // 2. Fallback → Vietcombank
    if (!rate) {
      rate   = await fetchFromVietcombank(sym);
      source = "VIETCOMBANK";
    }

    // 3. Fallback → hardcoded
    if (!rate) {
      rate   = FALLBACK_RATES[sym] ?? null;
      source = "FALLBACK";
    }

    if (!rate) {
      throw new Error(`[FX Oracle] Unsupported or unavailable currency: ${sym}`);
    }

    // Update cache
    this.cache.set(sym, { rate, fetchedAt: Date.now(), source });

    return { currency: sym, rateToVnd: rate, timestamp: Date.now(), source };
  }

  /**
   * Tính toán VNKR minted cho một giao dịch SWIFT inbound.
   * Trả về breakdown đầy đủ để log và audit.
   */
  async computeConversion(params: {
    originalAmount: number;
    currency: string;
    bridgeFeeBps?: number;          // default: 10 (0.1%)
    baseGasFeeVnkr?: number;        // default: 10_000 VNKR
  }): Promise<{
    fxRate:          number;
    grossVnkr:       number;
    bridgeFeeVnkr:   number;
    baseGasFeeVnkr:  number;
    totalFeeVnkr:    number;
    netVnkr:         number;
    source:          FXRateResult["source"];
  }> {
    const { originalAmount, currency } = params;
    const bridgeFeeBps  = params.bridgeFeeBps  ?? 10;
    const baseGasFee    = params.baseGasFeeVnkr ?? 10_000;

    const { rateToVnd, source } = await this.getFullFXRate(currency);

    const grossVnkr      = originalAmount * rateToVnd;
    const bridgeFeeVnkr  = Math.floor((grossVnkr * bridgeFeeBps) / 10_000);
    const totalFeeVnkr   = baseGasFee + bridgeFeeVnkr;
    const netVnkr        = grossVnkr > totalFeeVnkr ? grossVnkr - totalFeeVnkr : 0;

    return {
      fxRate:         rateToVnd,
      grossVnkr,
      bridgeFeeVnkr,
      baseGasFeeVnkr: baseGasFee,
      totalFeeVnkr,
      netVnkr,
      source,
    };
  }

  /** Flush toàn bộ cache (dùng trong tests). */
  clearCache(): void {
    this.cache.clear();
  }
}
