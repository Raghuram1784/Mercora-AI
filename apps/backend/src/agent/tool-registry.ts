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

export const getGroqToolsConfigForNames = (toolNames: string[]) => {
  return toolNames
    .map((name) => registry[name])
    .filter(Boolean)
    .map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema,
      },
    }));
};

export const getToolsForIntent = (message: string, history: any[] = []): string[] => {
  const cleanMsg = message.toLowerCase();

  // 1. Checkout / Order
  if (
    cleanMsg.includes("checkout") ||
    cleanMsg.includes("create_order") ||
    cleanMsg.includes("place order") ||
    cleanMsg.includes("buy now") ||
    cleanMsg.includes("proceed to checkout") ||
    cleanMsg.includes("pay")
  ) {
    return ["get_cart", "create_order"];
  }

  // 2. Explicit Cart Mutation (add / put into cart)
  if (
    /\b(add|adds|adding)\b/i.test(cleanMsg) ||
    (cleanMsg.includes("put") && (cleanMsg.includes("in") || cleanMsg.includes("into"))) ||
    cleanMsg.includes("go ahead and add")
  ) {
    return ["get_product_details", "add_to_cart", "get_cart"];
  }

  // 3. Upsell
  if (
    cleanMsg.includes("upsell") ||
    cleanMsg.includes("upgrade") ||
    cleanMsg.includes("better version") ||
    cleanMsg.includes("premium option")
  ) {
    return ["get_upsell_suggestions", "get_product_details"];
  }

  // 4. Cross-sell / Accessory
  if (
    cleanMsg.includes("accessory") ||
    cleanMsg.includes("accessories") ||
    cleanMsg.includes("cross sell") ||
    cleanMsg.includes("pair with") ||
    cleanMsg.includes("complement") ||
    cleanMsg.includes("attach")
  ) {
    return ["get_cross_sell_suggestions", "get_product_details"];
  }

  // 5. Cart Inspection
  if (
    cleanMsg.includes("show cart") ||
    cleanMsg.includes("view cart") ||
    cleanMsg.includes("my cart") ||
    cleanMsg.includes("check cart") ||
    cleanMsg.includes("what is in my cart") ||
    cleanMsg.includes("cart items")
  ) {
    return ["get_cart"];
  }

  // 6. Recommendation / Advice
  if (
    cleanMsg.includes("recommend") ||
    cleanMsg.includes("should i buy") ||
    cleanMsg.includes("should i get") ||
    cleanMsg.includes("advice") ||
    cleanMsg.includes("which headphone") ||
    cleanMsg.includes("what headphone") ||
    cleanMsg.includes("which one") ||
    cleanMsg.includes("best") ||
    cleanMsg.includes("under ₹") ||
    cleanMsg.includes("under rs") ||
    cleanMsg.includes("for travel")
  ) {
    return ["recommend_products", "get_product_details"];
  }

  // 7. General Search / Browsing
  if (
    cleanMsg.includes("search") ||
    cleanMsg.includes("find") ||
    cleanMsg.includes("show me") ||
    cleanMsg.includes("catalog")
  ) {
    return ["search_products", "get_product_details"];
  }

  // Fallback default: minimal search & recommendation tools
  return ["recommend_products", "search_products", "get_product_details"];
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
