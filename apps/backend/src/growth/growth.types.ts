export type GrowthRelationType = "UPSELL" | "CROSS_SELL" | "ACCESSORY";

export interface GrowthProductSummary {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  category: string;
  price: number;
  currency?: string;
  rating: number;
  imageUrl: string;
  stock: number;
  hasVariants: boolean;
  features?: Record<string, any>;
}

export interface UpsellSuggestion {
  type: "UPSELL";
  sourceProductId: string;
  targetProduct: GrowthProductSummary;
  score: number;
  priceDelta: number;
  priceDeltaPercent: number;
  improvements: string[];
  reason?: string;
  priority: number;
}

export interface CrossSellSuggestion {
  type: "CROSS_SELL" | "ACCESSORY";
  sourceProductId: string;
  targetProduct: GrowthProductSummary;
  score: number;
  price: number;
  reason?: string;
  priority: number;
}

export interface PotentialUplift {
  bestUpsellDelta: number;
  crossSellTotalValue: number;
}

export interface GrowthSuggestionsResponse {
  sourceProduct: GrowthProductSummary;
  upsells: UpsellSuggestion[];
  crossSells: CrossSellSuggestion[];
  potentialUplift: PotentialUplift;
}

export interface GrowthRequestCriteria {
  productId: string;
  cartId?: string;
  limit?: number;
}
