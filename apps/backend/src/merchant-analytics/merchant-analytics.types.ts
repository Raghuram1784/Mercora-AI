export type AnalyticsTimeRange = "7d" | "30d" | "all";

export interface MerchantDashboardSummary {
  range: AnalyticsTimeRange;
  revenue: string;
  paidOrders: number;
  averageOrderValue: string;
  paymentCompletionRate: number | null; // percentage 0-100 or null if zero sessions
  aiAssistedOrders: number;
  aiAssistedRevenue: string; // Revenue from AI-Assisted Orders
  potentialGrowthValue: string;
  acceptedGrowthValue: string;
  totalRecommendationRequests: number;
  totalRecommendationsReturned: number;
}

export interface RevenueTrendPoint {
  date: string; // YYYY-MM-DD in UTC
  revenue: string;
  orders: number;
}

export interface GrowthMetrics {
  recommendationRequests: number;
  recommendationsReturned: number;
  upsellsShown: number;
  upsellsAccepted: number;
  crossSellsShown: number;
  crossSellsAccepted: number;
  accessoriesShown: number;
  accessoriesAccepted: number;
  potentialGrowthValue: string;
  acceptedGrowthValue: string;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  currency: string;
  itemCount: number;
  isAiAssisted: boolean;
  aiAttributionType?: string;
  createdAt: string;
  paidAt?: string | null;
}
