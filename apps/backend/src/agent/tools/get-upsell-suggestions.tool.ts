import { ToolDefinition } from "../agent.types.js";
import { GrowthService } from "../../growth/growth.service.js";
import { validateGrowthCriteria } from "../../validators/growth.validator.js";

export const getUpsellSuggestionsTool: ToolDefinition = {
  name: "get_upsell_suggestions",
  description:
    "Retrieve deterministic higher-tier upgrades for a specific product. Checks same-category products with grounded feature improvements and reasonable price deltas. Use this when the customer asks for a better version, upgrade, or premium alternative of a specific product.",
  schema: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "The UUID of the product to find upgrades for",
      },
      cartId: {
        type: "string",
        description: "Optional active cart ID to avoid duplicate recommendations",
      },
    },
    required: ["productId"],
  },
  execute: async (args, context) => {
    const criteria = validateGrowthCriteria({
      productId: args.productId,
      cartId: args.cartId || context.cartId,
    });

    const result = await GrowthService.getSuggestions(criteria);

    return {
      success: true,
      sourceProduct: {
        id: result.sourceProduct.id,
        name: result.sourceProduct.name,
        price: result.sourceProduct.price,
        rating: result.sourceProduct.rating,
      },
      upsells: result.upsells.map((u) => ({
        targetProduct: {
          id: u.targetProduct.id,
          name: u.targetProduct.name,
          brand: u.targetProduct.brand,
          category: u.targetProduct.category,
          price: u.targetProduct.price,
          rating: u.targetProduct.rating,
          imageUrl: u.targetProduct.imageUrl,
          hasVariants: u.targetProduct.hasVariants,
          features: u.targetProduct.features,
        },
        score: u.score,
        priceDelta: u.priceDelta,
        priceDeltaPercent: u.priceDeltaPercent,
        improvements: u.improvements,
        reason: u.reason,
      })),
      potentialUplift: {
        bestUpsellDelta: result.potentialUplift.bestUpsellDelta,
      },
    };
  },
};
