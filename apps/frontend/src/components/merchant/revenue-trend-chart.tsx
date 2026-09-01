import React, { useState } from "react";
import { TrendingUp, Calendar, Info } from "lucide-react";
import { formatCurrencyWithDecimals } from "../../lib/currency";

export interface RevenueTrendPoint {
  date: string;
  revenue: string | number;
  orders: number;
}

export interface RevenueTrendChartProps {
  trend: RevenueTrendPoint[];
  summary?: {
    revenue: string | number;
    paidOrders: number;
  } | null;
}

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${monthNames[monthIdx]}`;
    }
  }
  return dateStr;
}

function formatAxisRevenue(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${Math.round(val)}`;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ trend, summary }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Single-day fallback when fewer than 2 distinct dates exist
  if (!trend || trend.length < 2) {
    const singlePoint = trend && trend.length === 1 ? trend[0] : null;
    const todayRevenue = singlePoint ? Number(singlePoint.revenue) || 0 : Number(summary?.revenue) || 0;
    const todayOrders = singlePoint ? singlePoint.orders || 0 : summary?.paidOrders || 0;
    const dateText = singlePoint?.date ? formatDateLabel(singlePoint.date) : "Today";

    return (
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              <span>Revenue & Paid Order Trend</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Daily breakdown of verified paid orders (UTC)</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            PAID ONLY
          </span>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-violet-950/30 via-white/[0.01] to-emerald-950/20 border border-violet-500/20 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5" />
                <span>Today's Performance ({dateText})</span>
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-white">
                Revenue: <span className="text-emerald-400 font-mono">{formatCurrencyWithDecimals(todayRevenue)}</span>
              </div>
              <div className="text-sm font-semibold text-neutral-300">
                Paid Orders: <span className="font-mono font-extrabold text-violet-300">{todayOrders}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-neutral-400 space-y-1 max-w-sm">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <Info className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                <span>Single-Day Summary</span>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-400">
                More trend data will appear as additional days are recorded.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Combined Chart Render (2 or more distinct dates exist)
  const viewBoxWidth = 600;
  const viewBoxHeight = 240;
  const padding = { top: 30, right: 45, bottom: 40, left: 60 };

  const chartWidth = viewBoxWidth - padding.left - padding.right;
  const chartHeight = viewBoxHeight - padding.top - padding.bottom;

  const N = trend.length;
  const maxRevenueRaw = Math.max(...trend.map((t) => Number(t.revenue) || 0));
  const maxOrdersRaw = Math.max(...trend.map((t) => Number(t.orders) || 0));

  const maxRevenue = maxRevenueRaw > 0 ? maxRevenueRaw * 1.15 : 100;
  const maxOrders = maxOrdersRaw > 0 ? Math.ceil(maxOrdersRaw * 1.25) : 5;

  const bandWidth = chartWidth / N;
  const barWidth = Math.min(bandWidth * 0.35, 28);

  const getX = (i: number) => padding.left + (i + 0.5) * bandWidth;
  const getYRev = (val: number) => padding.top + chartHeight - (val / maxRevenue) * chartHeight;
  const getYOrd = (val: number) => padding.top + chartHeight - (val / maxOrders) * chartHeight;

  // Build SVG path strings for Revenue Area and Line
  const areaPath =
    `M ${getX(0)} ${padding.top + chartHeight}` +
    ` L ${getX(0)} ${getYRev(Number(trend[0].revenue) || 0)}` +
    trend
      .slice(1)
      .map((t, idx) => ` L ${getX(idx + 1)} ${getYRev(Number(t.revenue) || 0)}`)
      .join("") +
    ` L ${getX(N - 1)} ${padding.top + chartHeight} Z`;

  const linePath =
    `M ${getX(0)} ${getYRev(Number(trend[0].revenue) || 0)}` +
    trend
      .slice(1)
      .map((t, idx) => ` L ${getX(idx + 1)} ${getYRev(Number(t.revenue) || 0)}`)
      .join("");

  // Y-axis Ticks
  const revTicks = [0, 0.25, 0.5, 0.75, 1.0].map((ratio) => ratio * maxRevenue);
  const ordTicks = [0, 0.25, 0.5, 0.75, 1.0].map((ratio) => Math.round(ratio * maxOrders));

  // Label Skip step for x-axis dates if N is large
  const xLabelStep = N > 12 ? Math.ceil(N / 8) : 1;

  const activePoint = hoveredIndex !== null ? trend[hoveredIndex] : null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <span>Revenue & Paid Order Trend</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">Daily breakdown of verified paid orders (UTC)</p>
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-violet-400 rounded-full inline-block" />
            <span className="text-neutral-300">Revenue (INR)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" />
            <span className="text-neutral-300">Paid Orders</span>
          </div>
        </div>
      </div>

      {/* SVG Combined Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            {/* Subtle Revenue Area Gradient */}
            <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.00" />
            </linearGradient>

            {/* Paid Orders Bar Gradient */}
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.35" />
            </linearGradient>

            <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34D399" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.60" />
            </linearGradient>
          </defs>

          {/* Gridlines & Left Y Axis Ticks */}
          {revTicks.map((tickVal, i) => {
            const y = getYRev(tickVal);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewBoxWidth - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="4 4"
                />
                {/* Left Y Axis Label (Revenue INR) */}
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-neutral-400 text-[9px] font-mono"
                >
                  {formatAxisRevenue(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Right Y Axis Labels (Order Count) */}
          {ordTicks.map((ordVal, i) => {
            const y = getYOrd(ordVal);
            return (
              <text
                key={`ord-axis-${i}`}
                x={viewBoxWidth - padding.right + 8}
                y={y + 3}
                textAnchor="start"
                className="fill-emerald-400/80 text-[9px] font-mono font-bold"
              >
                {ordVal}
              </text>
            );
          })}

          {/* Paid Orders Bar Series */}
          {trend.map((t, i) => {
            const x = getX(i);
            const ordCount = t.orders || 0;
            const y = getYOrd(ordCount);
            const h = padding.top + chartHeight - y;
            const isHovered = hoveredIndex === i;

            if (ordCount === 0) return null;

            return (
              <rect
                key={`bar-${i}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={Math.max(h, 2)}
                rx={3}
                fill={isHovered ? "url(#barGradHover)" : "url(#barGrad)"}
                className="transition-all duration-200"
              />
            );
          })}

          {/* Revenue Subtle Gradient Area Fill */}
          <path d={areaPath} fill="url(#revAreaGrad)" />

          {/* Revenue Line Series */}
          <path
            d={linePath}
            fill="none"
            stroke="#C084FC"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Revenue Line Data Circles */}
          {trend.map((t, i) => {
            const x = getX(i);
            const y = getYRev(Number(t.revenue) || 0);
            const isHovered = hoveredIndex === i;

            return (
              <circle
                key={`point-${i}`}
                cx={x}
                cy={y}
                r={isHovered ? 5.5 : 3.5}
                fill="#C084FC"
                stroke="#120F1D"
                strokeWidth={isHovered ? 2.5 : 1.5}
                className="transition-all duration-200"
              />
            );
          })}

          {/* X-Axis Date Labels */}
          {trend.map((t, i) => {
            if (i % xLabelStep !== 0 && i !== N - 1) return null;
            const x = getX(i);
            const y = padding.top + chartHeight + 18;
            const isHovered = hoveredIndex === i;

            return (
              <text
                key={`x-label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                className={`text-[9px] font-mono transition-colors ${
                  isHovered ? "fill-white font-bold" : "fill-neutral-400"
                }`}
              >
                {formatDateLabel(t.date)}
              </text>
            );
          })}

          {/* Active Hover Reference Line */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + chartHeight}
              stroke="rgba(192, 132, 252, 0.4)"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              className="pointer-events-none"
            />
          )}

          {/* Invisible Overlay Hover Bands */}
          {trend.map((_, i) => {
            const x = padding.left + i * bandWidth;
            return (
              <rect
                key={`hover-band-${i}`}
                x={x}
                y={padding.top}
                width={bandWidth}
                height={chartHeight + 25}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Popup Overlay */}
        {hoveredIndex !== null && activePoint && (
          <div
            className="absolute top-2 pointer-events-none z-30 transform -translate-x-1/2 transition-all duration-150"
            style={{
              left: `${((getX(hoveredIndex)) / viewBoxWidth) * 100}%`,
            }}
          >
            <div className="bg-[#120F1D] border border-violet-500/30 px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 min-w-[130px]">
              <div className="text-[10px] text-neutral-400 font-mono font-bold border-b border-white/10 pb-1">
                {activePoint.date} (UTC)
              </div>
              <div className="flex items-center justify-between gap-3 text-emerald-400 font-extrabold">
                <span className="text-[11px] text-neutral-300 font-normal">Revenue:</span>
                <span>{formatCurrencyWithDecimals(activePoint.revenue)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-violet-300 font-bold">
                <span className="text-[11px] text-neutral-300 font-normal">Paid Orders:</span>
                <span className="font-mono">{activePoint.orders} order(s)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
