import React, { useState, useEffect } from "react";
import { MerchantService } from "../services/merchant.service";
import { formatCurrency } from "../lib/currency";
import {
  TrendingUp,
  ShoppingBag,
  Zap,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { RevenueTrendChart } from "../components/merchant/revenue-trend-chart";

export const MerchantDashboardPage: React.FC = () => {
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [growth, setGrowth] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, trendData, growthData, ordersData, auditData] = await Promise.all([
        MerchantService.getDashboardSummary(range),
        MerchantService.getRevenueTrend(range),
        MerchantService.getGrowthMetrics(range),
        MerchantService.getRecentOrders(10),
        MerchantService.getAuditEvents(20),
      ]);

      setSummary(sumData);
      setTrend(trendData || []);
      setGrowth(growthData);
      setOrders(ordersData || []);
      setAuditEvents(auditData?.events || []);
      setLastFetchTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load merchant analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  return (
    <div className="min-h-screen bg-[#07070A] text-white p-4 md:p-8 space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-violet-400 bg-clip-text text-transparent">
              Merchant Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono text-[11px] font-extrabold">
              LIVE METRICS
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Real-time commerce performance, AI attribution, growth uplift, and payment audit events.
          </p>
        </div>

        {/* Time Range Filter Controls */}
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 p-1.5 rounded-xl self-start md:self-auto">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                range === r
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-500/40"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
            </button>
          ))}
          <button
            onClick={fetchData}
            title="Refresh analytics"
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors ml-1 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-violet-400" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Failed to Load Dashboard</h3>
              <p className="text-xs text-neutral-300 mt-0.5">{error}</p>
            </div>
          </div>
          <Button onClick={fetchData} className="bg-rose-500/20 hover:bg-rose-500/30 text-white text-xs font-bold border border-rose-500/40">
            Retry
          </Button>
        </div>
      ) : loading && !summary ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4 text-neutral-400">
          <Loader2 className="h-9 w-9 animate-spin text-violet-400" />
          <p className="text-xs font-medium uppercase tracking-wider">Computing server-side merchant analytics...</p>
        </div>
      ) : (
        <>
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Paid Revenue */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/30 transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all" />
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
                <span className="font-semibold uppercase tracking-wider">Paid Revenue</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(summary?.revenue || 0)}
              </div>
              <div className="text-[11px] text-neutral-500 mt-2 font-medium">
                Authoritative verified payment total
              </div>
            </div>

            {/* KPI 2: Paid Orders */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/30 transition-all">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
                <span className="font-semibold uppercase tracking-wider">Paid Orders</span>
                <ShoppingBag className="h-4 w-4 text-violet-400" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {summary?.paidOrders || 0}
              </div>
              <div className="text-[11px] text-neutral-400 mt-2 font-medium">
                AOV: <span className="text-violet-300 font-bold">{formatCurrency(summary?.averageOrderValue || 0)}</span>
              </div>
            </div>

            {/* KPI 3: AI-Assisted Influence */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/30 transition-all">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
                <span className="font-semibold uppercase tracking-wider">AI-Assisted Influence</span>
                <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-indigo-300 tracking-tight">
                {summary?.aiAssistedOrders || 0} <span className="text-xs font-semibold text-neutral-400">orders</span>
              </div>
              <div className="text-[11px] text-neutral-400 mt-2 font-medium line-clamp-1">
                Revenue: <span className="text-indigo-300 font-bold">{formatCurrency(summary?.aiAssistedRevenue || 0)}</span>
              </div>
            </div>

            {/* KPI 4: Accepted Growth Value */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/30 transition-all">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-3">
                <span className="font-semibold uppercase tracking-wider">Accepted Growth Uplift</span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-amber-300 tracking-tight">
                {formatCurrency(summary?.acceptedGrowthValue || 0)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-2 font-medium line-clamp-1">
                Potential: <span className="text-neutral-500">{formatCurrency(summary?.potentialGrowthValue || 0)}</span>
              </div>
            </div>
          </div>

          {/* Secondary KPI Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-semibold uppercase tracking-wider">Payment Completion Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${summary?.paymentCompletionRate ?? 0}%` }}
                  />
                </div>
                <span className="font-mono font-extrabold text-emerald-400">
                  {summary?.paymentCompletionRate !== null && summary?.paymentCompletionRate !== undefined
                    ? `${summary.paymentCompletionRate}%`
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-semibold uppercase tracking-wider">Recommendation Requests</span>
              <span className="font-mono font-extrabold text-violet-300">
                {summary?.totalRecommendationRequests || 0} <span className="text-[10px] text-neutral-500">req</span> / {summary?.totalRecommendationsReturned || 0} <span className="text-[10px] text-neutral-500">ret</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.015] border border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-semibold uppercase tracking-wider">Last Data Sync</span>
              <span className="text-neutral-300 font-mono text-[11px]">{lastFetchTime || "Just now"} UTC</span>
            </div>
          </div>

          {/* Revenue Trend Chart & AI Growth Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2">
              <RevenueTrendChart trend={trend} summary={summary} />
            </div>

            {/* AI Growth Performance Breakdown */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-5">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span>AI Growth Performance</span>
                </h3>
                <p className="text-xs text-neutral-400">Deterministic Phase 5B upsell & cross-sell metrics</p>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Recommendations */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <div className="flex justify-between font-semibold text-neutral-200">
                    <span>Recommendations</span>
                    <span className="text-violet-300">{growth?.recommendationsReturned || 0} returned</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Requests: {growth?.recommendationRequests || 0}
                  </div>
                </div>

                {/* Upsells */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <div className="flex justify-between font-semibold text-neutral-200">
                    <span>Upsells (Upgrades)</span>
                    <span className="text-emerald-400 font-bold">{growth?.upsellsAccepted || 0} accepted</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Shown: {growth?.upsellsShown || 0}
                  </div>
                </div>

                {/* Cross-Sells & Accessories */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                  <div className="flex justify-between font-semibold text-neutral-200">
                    <span>Cross-Sells & Accessories</span>
                    <span className="text-emerald-400 font-bold">
                      {(growth?.crossSellsAccepted || 0) + (growth?.accessoriesAccepted || 0)} accepted
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Cross-sells: {growth?.crossSellsShown || 0} shown · Accessories: {growth?.accessoriesShown || 0} shown
                  </div>
                </div>

                {/* Uplift Summary */}
                <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Potential Growth Value</span>
                    <span>{formatCurrency(growth?.potentialGrowthValue || 0)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-amber-300 pt-1">
                    <span>Accepted Growth Uplift</span>
                    <span>{formatCurrency(growth?.acceptedGrowthValue || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders & Audit Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders Table (2 cols) */}
            <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">Recent Orders</h3>
                  <p className="text-xs text-neutral-400">Latest customer order transactions & attribution</p>
                </div>
                <span className="text-xs text-neutral-500 font-mono">Top {orders.length} orders</span>
              </div>

              {orders.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 border border-dashed border-white/10 rounded-xl">
                  No orders created yet. Complete a test checkout to see order records.
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="pb-3 px-2">Order</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2">Total</th>
                        <th className="pb-3 px-2">Items</th>
                        <th className="pb-3 px-2">Attribution</th>
                        <th className="pb-3 px-2 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {orders.map((o) => (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-2 font-mono font-bold text-violet-300 group-hover:text-violet-200">
                            {o.orderNumber}
                          </td>
                          <td className="py-3 px-2">
                            {o.status === "PAID" ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-extrabold text-[10px]">
                                PAID
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-[10px]">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 font-bold text-white">
                            {formatCurrency(o.total)}
                          </td>
                          <td className="py-3 px-2 text-neutral-400">
                            {o.itemCount} item(s)
                          </td>
                          <td className="py-3 px-2">
                            {o.isAiAssisted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold text-[10px]">
                                <Sparkles className="h-3 w-3 text-indigo-400" />
                                <span>AI ASSISTED</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 font-medium text-[10px]">
                                DIRECT
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right text-neutral-500 font-mono text-[10px]">
                            {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Live Commerce Activity Audit Ledger */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Commerce Audit Log</span>
                  </h3>
                  <p className="text-xs text-neutral-400">Append-only system event timeline</p>
                </div>
              </div>

              {auditEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 border border-dashed border-white/10 rounded-xl flex-1 flex items-center justify-center">
                  No audit events recorded yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar pr-1 flex-1">
                  {auditEvents.map((evt) => {
                    const timeStr = new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div key={evt.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-violet-300 text-[11px] uppercase tracking-wide">
                            {evt.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">{timeStr}</span>
                        </div>

                        {evt.metadata?.orderNumber && (
                          <div className="text-neutral-300 font-mono text-[11px]">
                            Order: {evt.metadata.orderNumber}
                          </div>
                        )}

                        {evt.acceptedUplift && (
                          <div className="text-emerald-400 font-bold text-[11px]">
                            Accepted Uplift: +{formatCurrency(evt.acceptedUplift)}
                          </div>
                        )}

                        <div className="text-[10px] text-neutral-500 flex items-center gap-2 pt-0.5">
                          <span>Source: {evt.source}</span>
                          {evt.paymentId && <span>· Payment Ref</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-md max-w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto bg-[#0C0A15] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 z-50 text-white shadow-2xl">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">Order Detail</span>
              <h3 className="text-lg font-mono font-bold text-violet-300">{selectedOrder.orderNumber}</h3>
            </div>

            <div className="space-y-2 text-xs border-t border-b border-white/10 py-3">
              <div className="flex justify-between">
                <span className="text-neutral-400">Status</span>
                <span className="font-bold text-emerald-400">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total Amount</span>
                <span className="font-bold text-white">{formatCurrency(selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Attribution</span>
                <span className="font-bold text-indigo-300">
                  {selectedOrder.isAiAssisted ? `AI ASSISTED (${selectedOrder.aiAttributionType})` : "DIRECT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Created At</span>
                <span className="font-mono text-neutral-300">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2.5 rounded-xl border border-white/10 cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
