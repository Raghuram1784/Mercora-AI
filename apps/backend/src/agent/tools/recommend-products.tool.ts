import { ToolDefinition } from "../agent.types.js";
import { RecommendationService } from "../../recommendation/recommendation.service.js";
import { validateRecommendationCriteria } from "../../validators/recommendation.validator.js";

export const recommendProductsTool: ToolDefinition = {
  name: "recommend_products",
  description:
    "Evaluate and deterministically rank the best products for a customer's needs, budget, use-cases, and desired features. All criteria are optional; providing just a category (or partial constraints) is sufficient to recommend top products immediately. Returns ranked products with objective reasons and badges (Best Match, Best Value, Strong Alternative).",
  schema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Category name (e.g. Headphones, Earbuds, Smartwatches, Speakers, Power Banks, Accessories)",
      },
      minPrice: {
        type: "number",
        description: "Minimum budget/price in INR (hard constraint)",
      },
      maxPrice: {
        type: "number",
        description: "Maximum budget/price in INR (hard constraint)",
      },
      minRating: {
        type: "number",
        description: "Minimum rating between 1 and 5 (hard constraint)",
      },
      desiredFeatures: {
        type: "object",
        description: "Key-value map of desired product specifications (e.g. { wireless: true, noiseCancellation: true, capacityMah: 20000, gps: true, fastCharging: true })",
      },
      useCases: {
        type: "array",
        items: { type: "string" },
        description: "Intended use-cases (e.g. ['travel', 'fitness', 'work', 'commute'])",
      },
      inStockOnly: {
        type: "boolean",
        description: "Require products to be in stock (default true)",
      },
      limit: {
        type: "integer",
        description: "Number of recommendations to return (default 3, max 5)",
      },
    },
  },
  execute: async (args) => {
    // 1. Runtime validation
    const criteria = validateRecommendationCriteria(args);

    // 2. Execute Deterministic Recommendation Engine
    const result = await RecommendationService.recommendProducts(criteria);

    // 3. Return structured recommendations to LLM
    return {
      success: true,
      criteria: result.criteria,
      totalEligible: result.totalEligible,
      recommendations: result.recommendations.map((rec) => ({
        rank: rec.rank,
        score: rec.score,
        label: rec.label,
        reasons: rec.reasons.map((r) => r.label),
        product: {
          id: rec.product.id,
          name: rec.product.name,
          brand: rec.product.brand,
          category: rec.product.category,
          price: rec.product.price,
          rating: rec.product.rating,
          stock: rec.product.stock,
          imageUrl: rec.product.imageUrl,
          hasVariants: rec.product.hasVariants,
          features: rec.product.features,
        },
      })),
    };
  },
};
