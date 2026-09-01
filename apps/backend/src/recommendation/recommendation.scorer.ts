import {
  RecommendationCriteria,
  RecommendationReason,
  RecommendedProductItem,
  ScoredProductResult,
  RecommendationBadge,
} from "./recommendation.types.js";
import {
  RECOMMENDATION_WEIGHTS,
  BUDGET_SCORING_CONFIG,
} from "./recommendation.config.js";
import {
  normalizeString,
  normalizeArray,
  matchFeatureValue,
  formatAmount,
} from "./recommendation.utils.js";

/**
 * Maps common feature keys and values to human-friendly customer-facing reason labels.
 */
function formatFeatureReasonLabel(key: string, value: unknown): string {
  const normKey = key.toLowerCase();

  if (normKey === "wireless" && value === true) return "Wireless";
  if (normKey === "noisecancellation" && value === true) return "Noise cancellation";
  if (normKey === "fastcharging" && value === true) return "Fast charging";
  if (normKey === "usbc" && value === true) return "USB-C support";
  if (normKey === "bluetooth" && value === true) return "Bluetooth enabled";
  if (normKey === "gps" && value === true) return "GPS enabled";
  if (normKey === "waterresistance") return `Water resistant (${String(value)})`;
  if (normKey === "capacitymah") return `${Number(value).toLocaleString()}mAh capacity`;
  if (normKey === "batterylifehours") return `${value}h battery life`;
  if (normKey === "batterylifedays") return `${value}-day battery life`;
  if (normKey === "display") return `${String(value)} display`;

  // Generic fallback
  if (typeof value === "boolean" && value === true) {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim();
  }
  return `${key}: ${String(value)}`;
}

/**
 * Maps use-case strings to human-friendly reason labels.
 */
function formatUseCaseReasonLabel(useCase: string): string {
  const norm = useCase.toLowerCase().trim();
  if (norm === "travel") return "Travel use-case match";
  if (norm === "fitness" || norm === "workout" || norm === "sports") return "Fitness use-case match";
  if (norm === "work" || norm === "office" || norm === "calls") return "Work & calling match";
  if (norm === "music" || norm === "commute") return `Ideal for ${norm}`;
  return `Good for ${norm}`;
}

export class RecommendationScorer {
  /**
   * Filter products based on HARD constraints.
   */
  static filterEligible(
    products: RecommendedProductItem[],
    criteria: RecommendationCriteria
  ): RecommendedProductItem[] {
    const inStockOnly = criteria.inStockOnly !== undefined ? criteria.inStockOnly : true;

    return products.filter((product) => {
      // 1. Hard Category Filter
      if (criteria.category) {
        if (normalizeString(product.category) !== normalizeString(criteria.category)) {
          return false;
        }
      }

      // 2. Hard Max Price Filter
      if (criteria.maxPrice !== undefined && criteria.maxPrice !== null) {
        if (product.price > criteria.maxPrice) {
          return false;
        }
      }

      // 3. Hard Min Price Filter
      if (criteria.minPrice !== undefined && criteria.minPrice !== null) {
        if (product.price < criteria.minPrice) {
          return false;
        }
      }

      // 4. Hard Min Rating Filter (when explicitly requested)
      if (criteria.minRating !== undefined && criteria.minRating !== null) {
        if (product.rating < criteria.minRating) {
          return false;
        }
      }

      // 5. Hard In-Stock Filter
      if (inStockOnly && product.stock <= 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate deterministic score and grounded reasons for a single eligible product.
   */
  static scoreProduct(
    product: RecommendedProductItem,
    criteria: RecommendationCriteria
  ): { score: number; reasons: RecommendationReason[] } {
    const reasons: RecommendationReason[] = [];

    // 1. Category Score (25 points) - eligibility satisfaction
    const categoryPoints = RECOMMENDATION_WEIGHTS.CATEGORY;
    // (Product already passed category filter)
    reasons.push({
      type: "CATEGORY",
      label: "Category match",
      points: categoryPoints,
    });

    // 2. Budget Score (25 points) - 20 satisfaction + up to 5 value headroom
    let budgetScore = 0;
    if (criteria.maxPrice !== undefined && criteria.maxPrice > 0) {
      const satisfaction = BUDGET_SCORING_CONFIG.SATISFACTION_POINTS;
      const savingsRatio = Math.max(0, (criteria.maxPrice - product.price) / criteria.maxPrice);
      const valueBonus = Math.min(
        BUDGET_SCORING_CONFIG.MAX_VALUE_POINTS,
        Number((savingsRatio * BUDGET_SCORING_CONFIG.MAX_VALUE_POINTS).toFixed(2))
      );
      budgetScore = satisfaction + valueBonus;

      reasons.push({
        type: "BUDGET",
        label: `Under ${formatAmount(criteria.maxPrice)}`,
        points: Math.round(budgetScore),
      });
    } else {
      // Baseline budget score if no budget constraint was imposed
      budgetScore = BUDGET_SCORING_CONFIG.SATISFACTION_POINTS;
      reasons.push({
        type: "BUDGET",
        label: "Within price range",
        points: budgetScore,
      });
    }

    // 3. Feature Matching (20 points)
    let featureScore = 0;
    const productFeatures = product.features || {};
    const requestedFeatures = criteria.desiredFeatures ? Object.entries(criteria.desiredFeatures) : [];

    if (requestedFeatures.length > 0) {
      let matchedCount = 0;
      for (const [key, reqVal] of requestedFeatures) {
        const prodVal = productFeatures[key];
        if (matchFeatureValue(prodVal, reqVal)) {
          matchedCount++;
          const singleFeatureWeight = RECOMMENDATION_WEIGHTS.FEATURE / requestedFeatures.length;
          reasons.push({
            type: "FEATURE",
            label: formatFeatureReasonLabel(key, reqVal),
            points: Math.round(singleFeatureWeight),
          });
        }
      }
      featureScore = (matchedCount / requestedFeatures.length) * RECOMMENDATION_WEIGHTS.FEATURE;
    } else {
      // If user didn't specify feature constraints, product receives baseline feature points
      featureScore = RECOMMENDATION_WEIGHTS.FEATURE;
    }

    // 4. Use-Case Matching (15 points)
    let useCaseScore = 0;
    const requestedUseCases = criteria.useCases || [];
    const productUseCases = normalizeArray(productFeatures.bestFor || productFeatures.useCases || []);

    if (requestedUseCases.length > 0) {
      let matchedUseCases = 0;
      for (const uc of requestedUseCases) {
        const normUc = normalizeString(uc);
        const isMatched =
          productUseCases.includes(normUc) ||
          normalizeString(product.name).includes(normUc) ||
          normalizeString(productFeatures.category || "").includes(normUc);

        if (isMatched) {
          matchedUseCases++;
          const singleUseCaseWeight = RECOMMENDATION_WEIGHTS.USE_CASE / requestedUseCases.length;
          reasons.push({
            type: "USE_CASE",
            label: formatUseCaseReasonLabel(uc),
            points: Math.round(singleUseCaseWeight),
          });
        }
      }
      useCaseScore = (matchedUseCases / requestedUseCases.length) * RECOMMENDATION_WEIGHTS.USE_CASE;
    } else {
      // Baseline use case score if none specified
      useCaseScore = RECOMMENDATION_WEIGHTS.USE_CASE;
    }

    // 5. Rating Score (10 points) - Normalized (rating / 5) * 10
    const cleanRating = Math.min(5, Math.max(0, Number(product.rating) || 0));
    const ratingScore = (cleanRating / 5.0) * RECOMMENDATION_WEIGHTS.RATING;
    if (cleanRating >= 3.8) {
      reasons.push({
        type: "RATING",
        label: cleanRating >= 4.5 ? `Top rated (${cleanRating.toFixed(1)}/5)` : `Good rating (${cleanRating.toFixed(1)}/5)`,
        points: Math.round(ratingScore),
      });
    }

    // 6. Stock Score (5 points) - in-stock eligibility satisfaction
    let stockScore = 0;
    if (product.stock > 0) {
      stockScore = RECOMMENDATION_WEIGHTS.STOCK;
      reasons.push({
        type: "STOCK",
        label: "In stock",
        points: stockScore,
      });
    }

    const rawTotal = categoryPoints + budgetScore + featureScore + useCaseScore + ratingScore + stockScore;
    const finalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    return {
      score: finalScore,
      reasons,
    };
  }

  /**
   * Sort products by deterministic tie-breaking rules:
   * 1. Score DESC
   * 2. Rating DESC
   * 3. Price ASC
   * 4. Product ID ASC
   */
  static sortCandidates(
    scoredItems: { product: RecommendedProductItem; score: number; reasons: RecommendationReason[] }[]
  ) {
    return [...scoredItems].sort((a, b) => {
      // 1. Primary: Score DESC
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 2. Tie-break: Rating DESC
      const ratingA = Number(a.product.rating) || 0;
      const ratingB = Number(b.product.rating) || 0;
      if (ratingB !== ratingA) {
        return ratingB - ratingA;
      }
      // 3. Tie-break: Price ASC
      if (a.product.price !== b.product.price) {
        return a.product.price - b.product.price;
      }
      // 4. Stable Tie-break: ID alphabetical ASC
      return a.product.id.localeCompare(b.product.id);
    });
  }

  /**
   * Assign badges (Best Match, Best Value, Strong Alternative) to ranked candidates.
   * Best Value requires high score, lower price, AND full coverage of explicitly requested desired features.
   */
  static assignLabels(
    sortedList: { product: RecommendedProductItem; score: number; reasons: RecommendationReason[] }[],
    criteria?: RecommendationCriteria
  ): ScoredProductResult[] {
    if (sortedList.length === 0) return [];

    const results: ScoredProductResult[] = [];
    const rank1 = sortedList[0];
    const requestedFeatures = criteria?.desiredFeatures ? Object.entries(criteria.desiredFeatures) : [];

    sortedList.forEach((item, index) => {
      const rank = index + 1;
      let label: RecommendationBadge = "Strong Alternative";

      if (rank === 1) {
        label = "Best Match";
      } else if (rank === 2) {
        // Evaluate if Rank 2 truly qualifies as "Best Value":
        // 1. High recommendation score (within 10 points of Rank 1 and score >= 80)
        // 2. Lower price than Rank 1 by at least 15%
        // 3. Full feature coverage: must satisfy 100% of explicitly requested desired features
        const isHighQuality = item.score >= 80 && (rank1.score - item.score) <= 10;
        const isSubstantiallyCheaper = item.product.price <= rank1.product.price * 0.85;

        let satisfiesAllRequestedFeatures = true;
        if (requestedFeatures.length > 0) {
          const prodFeatures = item.product.features || {};
          for (const [key, reqVal] of requestedFeatures) {
            if (!matchFeatureValue(prodFeatures[key], reqVal)) {
              satisfiesAllRequestedFeatures = false;
              break;
            }
          }
        }

        if (isHighQuality && isSubstantiallyCheaper && satisfiesAllRequestedFeatures) {
          label = "Best Value";
        } else {
          label = "Strong Alternative";
        }
      } else {
        label = "Strong Alternative";
      }

      results.push({
        rank,
        score: item.score,
        label,
        product: item.product,
        reasons: item.reasons,
      });
    });

    return results;
  }
}
