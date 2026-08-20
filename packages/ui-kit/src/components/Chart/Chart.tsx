/**
 * @vnkrvietnam/ui — Chart
 * Lightweight SVG-native chart components — zero external dependencies
 * Used by: analytics.vnkr.vn, sandbox.vnkr.vn, merchant portal
 *
 * Components:
 *   LineChart  — time-series, multi-series, area fill
 *   BarChart   — vertical bars, grouped, stacked
 *   PieChart   — donut / pie, legend
 *
 * Design:
 *   - VNKR brand colors by default
 *   - Tooltip on hover (inline SVG + foreignObject fallback)
 *   - Responsive via viewBox + preserveAspectRatio
 *   - Grid lines + axis labels
 */
import React, { useState } from "react";
import type { CSSProperties } from "react";
import { colorBrand, colorShades } from "../../tokens/colors";

// ─── Shared palette ───────────────────────────────────────────────────────────
const CHART_COLORS = [
  colorBrand.violet,  // #AF96FB
  colorBrand.greeny,  // #BEFF6C
  colorBrand.blue,    // #49DBC8
  colorBrand.orange,  // #FC7339
  colorBrand.magenta, // #FD9FDD
  colorBrand.yellow,  // #FFF172
  colorShades.info[3],    // #0095FF
  colorShades.success[3], // #00D68F
];

// ─── Common types ─────────────────────────────────────────────────────────────

export interface ChartSeries {
  name:   string;
  data:   number[];
  color?: string;
  /** Fill area under line (LineChart only) */
  area?:  boolean;
}

export interface ChartLabel {
  value: string;
  /** Rotate label (degrees) */
  rotate?: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// LINE CHART
// ══════════════════════════════════════════════════════════════════════════════

export interface LineChartProps {
  series:       ChartSeries[];
  /** X-axis labels */
  labels:       string[];
  width?:       number;
  height?:      number;
  /** Show grid lines */
  grid?:        boolean;
  /** Show dots on data points */
  dots?:        boolean;
  /** Show legend */
  legend?:      boolean;
  /** Y-axis label count */
  yTicks?:      number;
  style?:       CSSProperties;
  title?:       string;
}

export function LineChart({
  series,
  labels,
  width   = 600,
  height  = 300,
  grid    = true,
  dots    = true,
  legend  = true,
  yTicks  = 5,
  style,
  title,
}: LineChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; values: { name: string; value: number; color: string }[] } | null>(null);

  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const W   = width  - PAD.left - PAD.right;
  const H   = height - PAD.top  - PAD.bottom;

  const allVals   = series.flatMap(s => s.data);
  const minVal    = Math.min(...allVals, 0);
  const maxVal    = Math.max(...allVals, 1);
  const range     = maxVal - minVal || 1;

  const toX = (i: number) => (i / Math.max(labels.length - 1, 1)) * W;
  const toY = (v: number) => H - ((v - minVal) / range) * H;

  const yTickVals = Array.from({ length: yTicks }, (_, i) =>
    minVal + (range / (yTicks - 1)) * i
  );

  return (
    <ChartShell width={width} height={height + (legend ? 32 : 0)} title={title} style={style}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid lines */}
          {grid && yTickVals.map((v, i) => (
            <line key={i}
              x1={0} y1={toY(v)} x2={W} y2={toY(v)}
              stroke="#F3F4F6" strokeWidth={1} />
          ))}

          {/* Y axis labels */}
          {yTickVals.map((v, i) => (
            <text key={i}
              x={-8} y={toY(v) + 4}
              textAnchor="end"
              fontSize={10} fill="#A0AEC0"
              fontFamily="'Work Sans', sans-serif">
              {formatNum(v)}
            </text>
          ))}

          {/* X axis labels */}
          {labels.map((l, i) => (
            <text key={i}
              x={toX(i)} y={H + 20}
              textAnchor="middle"
              fontSize={10} fill="#A0AEC0"
              fontFamily="'Work Sans', sans-serif">
              {l}
            </text>
          ))}

          {/* Series */}
          {series.map((s, si) => {
            const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
            const pts   = s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
            const areaPath = s.data.length > 0
              ? `M${toX(0)},${H} L${s.data.map((v, i) => `${toX(i)},${toY(v)}`).join(" L")} L${toX(s.data.length - 1)},${H} Z`
              : "";

            return (
              <g key={si}>
                {s.area && (
                  <path d={areaPath} fill={color} fillOpacity={0.12} />
                )}
                <polyline
                  points={pts}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {dots && s.data.map((v, i) => (
                  <circle
                    key={i}
                    cx={toX(i)} cy={toY(v)} r={3.5}
                    fill="#fff" stroke={color} strokeWidth={2}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as SVGCircleElement).getBoundingClientRect();
                      const svg  = (e.target as SVGCircleElement).closest("svg")!.getBoundingClientRect();
                      setTooltip({
                        x: rect.left - svg.left + 8,
                        y: rect.top  - svg.top  - 8,
                        label:  labels[i] ?? String(i),
                        values: series.map((se, idx) => ({
                          name:  se.name,
                          value: se.data[i] ?? 0,
                          color: se.color ?? CHART_COLORS[idx % CHART_COLORS.length],
                        })),
                      });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {tooltip && <ChartTooltip {...tooltip} />}

      {legend && <ChartLegend series={series} />}
    </ChartShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BAR CHART
// ══════════════════════════════════════════════════════════════════════════════

export interface BarChartProps {
  series:     ChartSeries[];
  labels:     string[];
  width?:     number;
  height?:    number;
  stacked?:   boolean;
  grid?:      boolean;
  legend?:    boolean;
  yTicks?:    number;
  barRadius?: number;
  style?:     CSSProperties;
  title?:     string;
}

export function BarChart({
  series,
  labels,
  width      = 600,
  height     = 300,
  stacked    = false,
  grid       = true,
  legend     = true,
  yTicks     = 5,
  barRadius  = 4,
  style,
  title,
}: BarChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; values: { name: string; value: number; color: string }[] } | null>(null);

  const PAD    = { top: 20, right: 20, bottom: 40, left: 50 };
  const W      = width  - PAD.left - PAD.right;
  const H      = height - PAD.top  - PAD.bottom;
  const n      = labels.length;
  const ns     = series.length;

  const allVals  = stacked
    ? labels.map((_, i) => series.reduce((s, se) => s + (se.data[i] ?? 0), 0))
    : series.flatMap(s => s.data);
  const maxVal   = Math.max(...allVals, 1);

  const GROUP_W  = W / n;
  const GAP      = GROUP_W * 0.2;
  const BAR_W    = stacked ? GROUP_W - GAP : (GROUP_W - GAP) / ns;

  const yTickVals = Array.from({ length: yTicks }, (_, i) => (maxVal / (yTicks - 1)) * i);

  return (
    <ChartShell width={width} height={height + (legend ? 32 : 0)} title={title} style={style}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {grid && yTickVals.map((v, i) => (
            <line key={i} x1={0} y1={H - (v / maxVal) * H} x2={W} y2={H - (v / maxVal) * H}
              stroke="#F3F4F6" strokeWidth={1} />
          ))}
          {yTickVals.map((v, i) => (
            <text key={i} x={-8} y={H - (v / maxVal) * H + 4}
              textAnchor="end" fontSize={10} fill="#A0AEC0" fontFamily="'Work Sans', sans-serif">
              {formatNum(v)}
            </text>
          ))}
          {labels.map((l, i) => (
            <text key={i} x={i * GROUP_W + GROUP_W / 2} y={H + 20}
              textAnchor="middle" fontSize={10} fill="#A0AEC0" fontFamily="'Work Sans', sans-serif">
              {l}
            </text>
          ))}

          {stacked
            ? labels.map((_, gi) => {
                let stackY = H;
                return (
                  <g key={gi}>
                    {series.map((s, si) => {
                      const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
                      const val   = s.data[gi] ?? 0;
                      const bh    = (val / maxVal) * H;
                      const x     = gi * GROUP_W + GAP / 2;
                      stackY     -= bh;
                      return (
                        <rect key={si} x={x} y={stackY} width={BAR_W} height={bh}
                          fill={color} rx={si === series.length - 1 ? barRadius : 0}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={e => {
                            const rect = (e.target as SVGRectElement).getBoundingClientRect();
                            const svg  = (e.target as SVGRectElement).closest("svg")!.getBoundingClientRect();
                            setTooltip({ x: rect.left - svg.left, y: rect.top - svg.top - 8,
                              label: labels[gi], values: series.map((se, idx) => ({
                                name: se.name, value: se.data[gi] ?? 0,
                                color: se.color ?? CHART_COLORS[idx % CHART_COLORS.length],
                              }))});
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      );
                    })}
                  </g>
                );
              })
            : series.map((s, si) => {
                const color = s.color ?? CHART_COLORS[si % CHART_COLORS.length];
                return (
                  <g key={si}>
                    {s.data.map((v, gi) => {
                      const bh = (v / maxVal) * H;
                      const x  = gi * GROUP_W + GAP / 2 + si * BAR_W;
                      return (
                        <rect key={gi} x={x} y={H - bh} width={BAR_W} height={bh}
                          fill={color} rx={barRadius}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={e => {
                            const rect = (e.target as SVGRectElement).getBoundingClientRect();
                            const svg  = (e.target as SVGRectElement).closest("svg")!.getBoundingClientRect();
                            setTooltip({ x: rect.left - svg.left, y: rect.top - svg.top - 8,
                              label: labels[gi], values: [{ name: s.name, value: v, color }] });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      );
                    })}
                  </g>
                );
              })
          }
        </g>
      </svg>

      {tooltip && <ChartTooltip {...tooltip} />}
      {legend && <ChartLegend series={series} />}
    </ChartShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PIE / DONUT CHART
// ══════════════════════════════════════════════════════════════════════════════

export interface PieChartSegment {
  label:  string;
  value:  number;
  color?: string;
}

export interface PieChartProps {
  segments:  PieChartSegment[];
  /** true = donut (hollow centre) */
  donut?:    boolean;
  size?:     number;
  legend?:   boolean;
  /** Show value label on each slice */
  showValues?: boolean;
  style?:    CSSProperties;
  title?:    string;
}

export function PieChart({
  segments,
  donut    = true,
  size     = 220,
  legend   = true,
  showValues = true,
  style,
  title,
}: PieChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const R      = size / 2;
  const cx     = R;
  const cy     = R;
  const outerR = R - 8;
  const innerR = donut ? outerR * 0.58 : 0;

  const total  = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  let startAngle = -Math.PI / 2;

  const slices = segments.map((seg, i) => {
    const angle = (seg.value / total) * (2 * Math.PI);
    const end   = startAngle + angle;
    const color = seg.color ?? CHART_COLORS[i % CHART_COLORS.length];
    const slice = {
      ...seg,
      color,
      startAngle,
      endAngle: end,
      midAngle: startAngle + angle / 2,
      pct:      ((seg.value / total) * 100).toFixed(1),
    };
    startAngle = end;
    return slice;
  });

  const arc = (sa: number, ea: number, r: number, ri: number) => {
    const x1 = cx + r  * Math.cos(sa);
    const y1 = cy + r  * Math.sin(sa);
    const x2 = cx + r  * Math.cos(ea);
    const y2 = cy + r  * Math.sin(ea);
    const xi1 = cx + ri * Math.cos(sa);
    const yi1 = cy + ri * Math.sin(sa);
    const xi2 = cx + ri * Math.cos(ea);
    const yi2 = cy + ri * Math.sin(ea);
    const large = ea - sa > Math.PI ? 1 : 0;
    if (ri === 0) {
      return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    }
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ri} ${ri} 0 ${large} 0 ${xi1} ${yi1} Z`;
  };

  return (
    <ChartShell width={size + (legend ? 160 : 0)} height={size} title={title} style={style}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
          {slices.map((s, i) => {
            const isActive = activeIdx === i;
            const scale    = isActive ? 1.06 : 1;
            return (
              <path
                key={i}
                d={arc(s.startAngle, s.endAngle, outerR, innerR)}
                fill={s.color}
                stroke="#fff"
                strokeWidth={2}
                style={{
                  cursor:    "pointer",
                  transform: `scale(${scale})`,
                  transformOrigin: `${cx}px ${cy}px`,
                  transition:"transform 0.15s",
                }}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
              />
            );
          })}

          {/* Centre label (donut) */}
          {donut && (
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={700}
              fill="#1A1F36" fontFamily="'Work Sans', sans-serif">
              {activeIdx !== null ? `${slices[activeIdx].pct}%` : `${segments.length}`}
            </text>
          )}
          {donut && (
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="#A0AEC0"
              fontFamily="'Work Sans', sans-serif">
              {activeIdx !== null ? slices[activeIdx].label : "segments"}
            </text>
          )}

          {/* Slice value labels */}
          {showValues && !donut && slices.map((s, i) => {
            const lx = cx + (outerR * 0.65) * Math.cos(s.midAngle);
            const ly = cy + (outerR * 0.65) * Math.sin(s.midAngle);
            return (
              <text key={i} x={lx} y={ly + 4} textAnchor="middle"
                fontSize={11} fontWeight={600} fill="#fff"
                fontFamily="'Work Sans', sans-serif">
                {s.pct}%
              </text>
            );
          })}
        </svg>

        {legend && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {slices.map((s, i) => (
              <div key={i}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                  opacity: activeIdx !== null && activeIdx !== i ? 0.5 : 1, transition: "opacity 0.15s" }}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
              >
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#4A5568", fontFamily: "'Work Sans', sans-serif",
                  fontWeight: activeIdx === i ? 600 : 400 }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 12, color: "#A0AEC0", fontFamily: "'Work Sans', sans-serif", marginLeft: "auto" }}>
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ChartShell>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ChartShell({ width, height, title, style, children }: {
  width: number; height: number; title?: string; style?: CSSProperties; children: React.ReactNode;
}) {
  return (
    <div style={{
      position:    "relative",
      width:       "100%",
      maxWidth:    width,
      fontFamily:  "'Work Sans', sans-serif",
      ...style,
    }}>
      {title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1F36", marginBottom: 12 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function ChartTooltip({ x, y, label, values }: {
  x: number; y: number; label: string;
  values: { name: string; value: number; color: string }[];
}) {
  return (
    <div style={{
      position:    "absolute",
      left:        x,
      top:         y,
      background:  "#1A1F36",
      color:       "#fff",
      borderRadius: 8,
      padding:     "8px 12px",
      fontSize:    12,
      fontFamily:  "'Work Sans', sans-serif",
      boxShadow:   "0 4px 16px rgba(0,0,0,0.2)",
      pointerEvents:"none",
      zIndex:      10,
      whiteSpace:  "nowrap",
      transform:   "translateX(-50%)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#A0AEC0", fontSize: 11 }}>{label}</div>
      {values.map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color, display: "inline-block" }} />
          <span style={{ color: "#CBD5E0" }}>{v.name}:</span>
          <span style={{ fontWeight: 600 }}>{formatNum(v.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ChartLegend({ series }: { series: ChartSeries[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginTop: 8, justifyContent: "center" }}>
      {series.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 3, borderRadius: 99,
            background: s.color ?? CHART_COLORS[i % CHART_COLORS.length], display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "#718096", fontFamily: "'Work Sans', sans-serif" }}>{s.name}</span>
        </div>
      ))}
    </div>
  );
}

function formatNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}
