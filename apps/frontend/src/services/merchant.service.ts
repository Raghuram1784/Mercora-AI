const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export class MerchantService {
  static async getDashboardSummary(range: "7d" | "30d" | "all" = "30d") {
    const res = await fetch(`${API_BASE_URL}/merchant/dashboard/summary?range=${range}`);
    if (!res.ok) throw new Error("Failed to fetch merchant dashboard summary.");
    const json = await res.json();
    return json.data;
  }

  static async getRevenueTrend(range: "7d" | "30d" | "all" = "30d") {
    const res = await fetch(`${API_BASE_URL}/merchant/dashboard/revenue-trend?range=${range}`);
    if (!res.ok) throw new Error("Failed to fetch revenue trend data.");
    const json = await res.json();
    return json.data;
  }

  static async getGrowthMetrics(range: "7d" | "30d" | "all" = "30d") {
    const res = await fetch(`${API_BASE_URL}/merchant/dashboard/growth?range=${range}`);
    if (!res.ok) throw new Error("Failed to fetch growth analytics.");
    const json = await res.json();
    return json.data;
  }

  static async getRecentOrders(limit = 10) {
    const res = await fetch(`${API_BASE_URL}/merchant/dashboard/orders?limit=${limit}`);
    if (!res.ok) throw new Error("Failed to fetch recent merchant orders.");
    const json = await res.json();
    return json.data;
  }

  static async getAuditEvents(limit = 20, cursor?: string) {
    const url = cursor
      ? `${API_BASE_URL}/merchant/audit-events?limit=${limit}&cursor=${cursor}`
      : `${API_BASE_URL}/merchant/audit-events?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch audit events ledger.");
    const json = await res.json();
    return json.data;
  }
}
