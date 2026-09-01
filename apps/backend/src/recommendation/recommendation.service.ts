import { ProductService } from "../services/product.service.js";
import {
  RecommendationCriteria,
  RecommendationResponseData,
  RecommendedProductItem,
} from "./recommendation.types.js";
import { RECOMMENDATION_LIMITS } from "./recommendation.config.js";
import { RecommendationScorer } from "./recommendation.scorer.js";

export class RecommendationService {
  /**
   * Main recommendation flow:
   * 1. Retrieve candidates via ProductService
   * 2. Apply hard constraints filter
   * 3. Calculate deterministic scores & grounded reasons
   * 4. Perform deterministic tie-breaking sort
   * 5. Assign badges (Best Match, Best Value, Strong Alternative)
   * 6. Return top N recommendations
   */
  static async recommendProducts(
    criteria: RecommendationCriteria
  ): Promise<RecommendationResponseData> {
    const limit = Math.min(
      RECOMMENDATION_LIMITS.MAX_LIMIT,
      Math.max(1, criteria.limit ?? RECOMMENDATION_LIMITS.DEFAULT_LIMIT)
    );

    // 1. Fetch eligible active products from ProductService
    const { products } = await ProductService.getProducts({
      category: criteria.category,
      minPrice: criteria.minPrice,
      maxPrice: criteria.maxPrice,
      minRating: criteria.minRating,
      inStock: criteria.inStockOnly !== false,
      limit: 100, // Fetch ample candidates to evaluate
      offset: 0,
    });

    // Map ProductService results to RecommendedProductItem format
    const candidateItems: RecommendedProductItem[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      brand: p.brand,
      price: Number(p.price),
      currency: p.currency,
      rating: Number(p.rating),
      imageUrl: p.imageUrl,
      stock: p.stock,
      hasVariants: p.hasVariants,
      features: (p.features as Record<string, any>) || {},
    }));

    // 2. Extra validation of hard constraints
    const eligible = RecommendationScorer.filterEligible(candidateItems, criteria);

    if (eligible.length === 0) {
      return {
        criteria,
        recommendations: [],
        totalEligible: 0,
      };
    }

    // 3. Deterministic scoring
    const scoredList = eligible.map((prod) => {
      const { score, reasons } = RecommendationScorer.scoreProduct(prod, criteria);
      return {
        product: prod,
        score,
        reasons,
      };
    });

    // 4. Deterministic tie-breaking sort
    const sortedList = RecommendationScorer.sortCandidates(scoredList);

    // 5. Assign labels and ranks
    const labeledResults = RecommendationScorer.assignLabels(sortedList, criteria);

    // 6. Slice to requested limit
    const finalRecommendations = labeledResults.slice(0, limit);

    return {
      criteria,
      recommendations: finalRecommendations,
      totalEligible: eligible.length,
    };
  }
}
