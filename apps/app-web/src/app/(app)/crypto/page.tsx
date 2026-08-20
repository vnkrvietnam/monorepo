"use client";
/**
 * /crypto — Crypto Portfolio
 * Components: LineChart · CryptoBadgeRow · ListItem (holdings) · Badge
 */
import React, { useState } from "react";
import {
  LineChart,
  CryptoBadgeRow,
  ListItem,
  Badge,
  Button,
  Text,
  TrendUp,
  TrendDown,
} from "@vnkrvietnam/ui-kit";
import type { ChartSeries, CryptoBadgeData } from "@vnkrvietnam/ui-kit";

// ─── Mock data ────────────────────────────────────────────────────────────────

const BADGES: CryptoBadgeData[] = [
  { ticker: "BTC",  percent: "12.7%", trend: "up"   },
  { ticker: "ETH",  percent: "5.2%",  trend: "up"   },
  { ticker: "SOL",  percent: "−3.1%", trend: "down" },
  { ticker: "AXVN", percent: "8.4%",  trend: "up"   },
];

const CHART_SERIES: ChartSeries[] = [
  {
    name:  "Portfolio (USD)",
    data:  [3200, 3450, 3100, 3800, 3650, 4100, 3950, 4400, 4250, 4600, 4800, 5100],
    color: "#AF96FB",
    area:  true,
  },
];
const CHART_LABELS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

const HOLDINGS = [
  { coin: "Bitcoin",   ticker: "BTC",  amount: "0.0842 BTC",   usd: "$5,120.40", change: "+12.7%", up: true,  color: "#FC7339" },
  { coin: "Ethereum",  ticker: "ETH",  amount: "1.25 ETH",     usd: "$4,250.00", change: "+5.2%",  up: true,  color: "#AF96FB" },
  { coin: "Solana",    ticker: "SOL",  amount: "12.5 SOL",     usd: "$1,875.00", change: "−3.1%",  up: false, color: "#49DBC8" },
  { coin: "AXVN Token",ticker: "AXVN", amount: "50,000 AXVN",  usd: "$840.00",   change: "+8.4%",  up: true,  color: "#BEFF6C" },
  { coin: "Gold Token", ticker: "GLD", amount: "2.0 GLD",      usd: "$360.00",   change: "+0.3%",  up: true,  color: "#FFF172" },
];

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

export default function CryptoPage() {
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [timeframe,  setTimeframe]  = useState("1M");

  const totalUSD = "$12,445.40";
  const dayChange = "+$487.20 (4.07%)";

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 0" }}>
        <Text variant="caption" color="#A0AEC0" weight="medium">Tổng danh mục</Text>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "4px 0 2px" }}>
          <Text variant="h4" weight="semibold" color="#1A1F36">{totalUSD}</Text>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <TrendUp size={14} color="#00D68F" />
          <Text variant="caption" color="#00D68F" weight="semibold">{dayChange}</Text>
          <Text variant="caption" color="#A0AEC0">hôm nay</Text>
        </div>
      </div>

      {/* ── Chart timeframe selector ──────────────────────────────────── */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                flex:         1,
                height:       28,
                borderRadius: 8,
                border:       "none",
                background:   timeframe === tf ? "#000" : "transparent",
                color:        timeframe === tf ? "#BEFF6C" : "#A0AEC0",
                fontSize:     11,
                fontWeight:   timeframe === tf ? 700 : 400,
                fontFamily:   "'Work Sans', sans-serif",
                cursor:       "pointer",
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Line chart */}
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px 8px 8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <LineChart
            series={CHART_SERIES}
            labels={CHART_LABELS}
            width={typeof window !== "undefined" ? window.innerWidth - 56 : 340}
            height={180}
            grid
            dots={false}
            legend={false}
          />
        </div>
      </div>

      {/* ── Market badges ───────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 8px" }}>
        <Text variant="subtitle2" weight="semibold" color="#1A1F36" style={{ marginBottom: 10 }}>
          Thị trường
        </Text>
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <CryptoBadgeRow
            items={BADGES}
            activeIndex={activeIdx}
            onSelect={setActiveIdx}
          />
        </div>
      </div>

      {/* ── Holdings list ────────────────────────────────────────────────── */}
      <div style={{ margin: "8px 16px 0", background: "#fff", borderRadius: 16, padding: "4px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "12px 0 4px" }}>
          <Text variant="subtitle2" weight="semibold" color="#1A1F36">Nắm giữ</Text>
        </div>
        {HOLDINGS.map((h, i) => (
          <ListItem
            key={h.ticker}
            title={h.coin}
            subtitle={h.amount}
            amount={h.usd}
            amountColor="#1A1F36"
            meta={h.change}
            avatar={{ initials: h.ticker.slice(0, 2), bg: h.color }}
            divider={i < HOLDINGS.length - 1}
            rightSlot={
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <Text variant="body2" weight="semibold" color="#1A1F36">{h.usd}</Text>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  {h.up
                    ? <TrendUp  size={12} color="#00D68F" />
                    : <TrendDown size={12} color="#FF3D71" />
                  }
                  <Text variant="caption" color={h.up ? "#00D68F" : "#FF3D71"} weight="semibold">
                    {h.change}
                  </Text>
                </div>
              </div>
            }
          />
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 10 }}>
        <Button variant="filled" color="dark" size="lg" fullWidth>
          Mua
        </Button>
        <Button variant="outlined" color="dark" size="lg" fullWidth>
          Bán
        </Button>
      </div>
    </div>
  );
}
