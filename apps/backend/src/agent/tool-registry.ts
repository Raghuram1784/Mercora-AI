import { ToolDefinition } from "./agent.types.js";
import { searchProductsTool } from "./tools/search-products.tool.js";
import { getProductDetailsTool } from "./tools/get-product-details.tool.js";
import { getCartTool } from "./tools/get-cart.tool.js";
import { addToCartTool } from "./tools/add-to-cart.tool.js";
import { recommendProductsTool } from "./tools/recommend-products.tool.js";
import { getUpsellSuggestionsTool } from "./tools/get-upsell-suggestions.tool.js";
import { getCrossSellSuggestionsTool } from "./tools/get-cross-sell-suggestions.tool.js";
import { createOrderTool } from "./tools/create-order.tool.js";

export const registry: Record<string, ToolDefinition> = {
  search_products: searchProductsTool,
  get_product_details: getProductDetailsTool,
  get_cart: getCartTool,
  add_to_cart: addToCartTool,
  recommend_products: recommendProductsTool,
  get_upsell_suggestions: getUpsellSuggestionsTool,
  get_cross_sell_suggestions: getCrossSellSuggestionsTool,
  create_order: createOrderTool,
};

export const getGroqToolsConfig = () => {
  return Object.values(registry).map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.schema,
    },
  }));
};

export const executeTool = async (
  name: string,
  args: any,
  context: { customerId?: string; cartId?: string }
): Promise<any> => {
  const tool = registry[name];
  if (!tool) {
    throw new Error(`Tool ${name} is not registered in the Tool Registry.`);
  }
  return tool.execute(args, context);
};
