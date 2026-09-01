import { prisma } from "../config/database.js";
import { ProductService } from "../services/product.service.js";
import { CartService } from "../services/cart.service.js";
import {
  GrowthRequestCriteria,
  GrowthSuggestionsResponse,
  GrowthProductSummary,
  UpsellSuggestion,
  CrossSellSuggestion,
} from "./growth.types.js";
import { GROWTH_CONFIG } from "./growth.config.js";
import { GrowthScorer } from "./growth.scorer.js";

export class GrowthService {
  /**
   * Main Growth Suggestions entry point.
   * Returns deterministic upsells, cross-sells/accessories, and separate potential uplift calculations.
   */
  static async getSuggestions(
    criteria: GrowthRequestCriteria
  ): Promise<GrowthSuggestionsResponse> {
    const { productId, cartId, limit = GROWTH_CONFIG.LIMITS.MAX_SUGGESTIONS } = criteria;

    // 1. Fetch Source Product
    const fullSource = await ProductService.getProductById(productId);
    if (!fullSource) {
      throw new Error(`Source product with ID "${productId}" not found or inactive.`);
    }

    const sourceProduct: GrowthProductSummary = {
      id: fullSource.id,
      name: fullSource.name,
      slug: fullSource.slug,
      brand: fullSource.brand,
      category: fullSource.category,
      price: Number(fullSource.price),
      currency: fullSource.currency,
      rating: Number(fullSource.rating),
      imageUrl: fullSource.imageUrl,
      stock: fullSource.stock,
      hasVariants: fullSource.variants.length > 0,
      features: (fullSource.features as Record<string, any>) || {},
    };

    // 2. Fetch Cart Items to avoid recommending products already in cart
    const cartProductIds = new Set<string>();
    if (cartId && cartId !== "unknown") {
      try {
        const cart = await CartService.getCart(cartId);
        cart.items.forEach((item) => {
          cartProductIds.add(item.product.id);
        });
      } catch (e) {
        console.error("[GrowthService] Could not fetch cart context:", e);
      }
    }

    // 3. Fetch explicit active relations from database
    const relations = await prisma.productRelation.findMany({
      where: {
        sourceProductId: productId,
        active: true,
        targetProduct: {
          active: true,
          stock: { gt: 0 },
        },
      },
      include: {
        targetProduct: {
          include: {
            variants: { where: { active: true } },
          },
        },
      },
      orderBy: { priority: "asc" },
    });

    // 4. Process UPSELLS
    const upsellCandidates: UpsellSuggestion[] = [];
    const upsellRelations = relations.filter((r) => r.type === "UPSELL");

    for (const rel of upsellRelations) {
      const tp = rel.targetProduct;
      const targetSummary: GrowthProductSummary = {
        id: tp.id,
        name: tp.name,
        slug: tp.slug,
        brand: tp.brand,
        category: tp.category,
        price: Number(tp.price),
        currency: tp.currency,
        rating: Number(tp.rating),
        imageUrl: tp.imageUrl,
        stock: tp.stock,
        hasVariants: tp.variants.length > 0,
        features: (tp.features as Record<string, any>) || {},
      };

      const { valid, improvements } = GrowthScorer.isValidUpsell(sourceProduct, targetSummary);
      if (valid) {
        const priceDelta = targetSummary.price - sourceProduct.price;
        const priceDeltaPercent = Number(((priceDelta / sourceProduct.price) * 100).toFixed(1));
        const score = GrowthScorer.scoreUpsell(sourceProduct, targetSummary, improvements, rel.priority);

        upsellCandidates.push({
          type: "UPSELL",
          sourceProductId: sourceProduct.id,
          targetProduct: targetSummary,
          score,
          priceDelta,
          priceDeltaPercent,
          improvements,
          reason: rel.reason || undefined,
          priority: rel.priority,
        });
      }
    }

    // Sort upsells deterministically: Score DESC, Rating DESC, PriceDelta ASC, ID ASC
    const sortedUpsells = upsellCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.targetProduct.rating !== a.targetProduct.rating) return b.targetProduct.rating - a.targetProduct.rating;
      if (a.priceDelta !== b.priceDelta) return a.priceDelta - b.priceDelta;
      return a.targetProduct.id.localeCompare(b.targetProduct.id);
    });

    // 5. Process CROSS-SELLS & ACCESSORIES
    const crossSellCandidates: CrossSellSuggestion[] = [];
    const crossSellRelations = relations.filter(
      (r) => r.type === "CROSS_SELL" || r.type === "ACCESSORY"
    );

    for (const rel of crossSellRelations) {
      const tp = rel.targetProduct;

      // Skip if already in customer's cart
      if (cartProductIds.has(tp.id)) {
        continue;
      }

      const targetSummary: GrowthProductSummary = {
        id: tp.id,
        name: tp.name,
        slug: tp.slug,
        brand: tp.brand,
        category: tp.category,
        price: Number(tp.price),
        currency: tp.currency,
        rating: Number(tp.rating),
        imageUrl: tp.imageUrl,
        stock: tp.stock,
        hasVariants: tp.variants.length > 0,
        features: (tp.features as Record<string, any>) || {},
      };

      const score = GrowthScorer.scoreCrossSell(targetSummary, rel.priority);

      crossSellCandidates.push({
        type: rel.type as "CROSS_SELL" | "ACCESSORY",
        sourceProductId: sourceProduct.id,
        targetProduct: targetSummary,
        score,
        price: targetSummary.price,
        reason: rel.reason || undefined,
        priority: rel.priority,
      });
    }

    // Sort cross-sells deterministically: Score DESC, Priority ASC, Rating DESC, ID ASC
    const sortedCrossSells = crossSellCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (b.targetProduct.rating !== a.targetProduct.rating) return b.targetProduct.rating - a.targetProduct.rating;
      return a.targetProduct.id.localeCompare(b.targetProduct.id);
    });

    const finalUpsells = sortedUpsells.slice(0, Math.min(limit, GROWTH_CONFIG.LIMITS.DEFAULT_UPSELLS));
    const finalCrossSells = sortedCrossSells.slice(0, Math.min(limit, GROWTH_CONFIG.LIMITS.DEFAULT_CROSS_SELLS));

    // 6. Calculate Potential Uplift Separately
    // Best upsell delta (mutually exclusive) vs. sum of cross-sell opportunities
    const bestUpsellDelta = finalUpsells.length > 0 ? finalUpsells[0].priceDelta : 0;
    const crossSellTotalValue = finalCrossSells.reduce((acc, curr) => acc + curr.price, 0);

    return {
      sourceProduct,
      upsells: finalUpsells,
      crossSells: finalCrossSells,
      potentialUplift: {
        bestUpsellDelta,
        crossSellTotalValue,
      },
    };
  }
}
