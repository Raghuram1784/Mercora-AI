export type RecommendationReasonType =
  | "CATEGORY"
  | "BUDGET"
  | "FEATURE"
  | "USE_CASE"
  | "RATING"
  | "STOCK";

export interface RecommendationReason {
  type: RecommendationReasonType;
  label: string;
  points: number;
}

export interface RecommendationCriteria {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  desiredFeatures?: Record<string, unknown>;
  useCases?: string[];
  inStockOnly?: boolean;
  limit?: number;
}

export interface RecommendedProductItem {
  id: string;
  name: string;
  slug?: string;
  category: string;
  brand: string;
  price: number;
  currency?: string;
  rating: number;
  imageUrl: string;
  stock: number;
  hasVariants: boolean;
  features?: Record<string, any>;
}

export type RecommendationBadge = "Best Match" | "Best Value" | "Strong Alternative";

export interface ScoredProductResult {
  rank: number;
  score: number;
  label: RecommendationBadge;
  product: RecommendedProductItem;
  reasons: RecommendationReason[];
}

export interface RecommendationResponseData {
  criteria: RecommendationCriteria;
  recommendations: ScoredProductResult[];
  totalEligible: number;
}
