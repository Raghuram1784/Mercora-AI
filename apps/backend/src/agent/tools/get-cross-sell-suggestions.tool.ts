import { ToolDefinition } from "../agent.types.js";
import { GrowthService } from "../../growth/growth.service.js";
import { validateGrowthCriteria } from "../../validators/growth.validator.js";

export const getCrossSellSuggestionsTool: ToolDefinition = {
  name: "get_cross_sell_suggestions",
  description:
    "Retrieve deterministic complementary cross-sells and accessories for a specific product based on explicit catalog relationships. Filters out items already in the customer's cart. Use this when the customer asks what goes well with an item, accessories, or bundles.",
  schema: {
    type: "object",
    properties: {
      productId: {
        type: "string",
        description: "The UUID of the base product to find complementary items for",
      },
      cartId: {
        type: "string",
        description: "Optional active cart ID to filter out items already in cart",
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
      },
      crossSells: result.crossSells.map((cs) => ({
        type: cs.type,
        targetProduct: {
          id: cs.targetProduct.id,
          name: cs.targetProduct.name,
          brand: cs.targetProduct.brand,
          category: cs.targetProduct.category,
          price: cs.targetProduct.price,
          rating: cs.targetProduct.rating,
          imageUrl: cs.targetProduct.imageUrl,
          hasVariants: cs.targetProduct.hasVariants,
          features: cs.targetProduct.features,
        },
        score: cs.score,
        price: cs.price,
        reason: cs.reason,
      })),
      potentialUplift: {
        crossSellTotalValue: result.potentialUplift.crossSellTotalValue,
      },
    };
  },
};
