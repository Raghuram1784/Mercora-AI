import { ToolDefinition } from "../agent.types.js";
import { ProductService } from "../../services/product.service.js";

export const searchProductsTool: ToolDefinition = {
  name: "search_products",
  description: "Search and filter the Mercora product catalog dynamically.",
  schema: {
    type: "object",
    properties: {
      search: { type: "string", description: "Search keyword matching name/description/brand" },
      category: { type: "string", description: "Category string (e.g. Headphones, Earbuds, Smartwatches, Speakers, Power Banks, Accessories)" },
      brand: { type: "string", description: "Brand name" },
      minPrice: { type: "number", description: "Minimum price in INR" },
      maxPrice: { type: "number", description: "Maximum price in INR" },
      minRating: { type: "number", description: "Minimum rating between 1 and 5" },
      inStock: { type: "boolean", description: "Filter only items currently in stock" },
      limit: { type: "integer", description: "Default is 5, max limit is 10" },
    },
  },
  execute: async (args) => {
    // 1. Validate Arguments
    if (args.minPrice !== undefined && (typeof args.minPrice !== "number" || args.minPrice < 0)) {
      throw new Error("Invalid Argument: minPrice must be a non-negative number.");
    }
    if (args.maxPrice !== undefined && (typeof args.maxPrice !== "number" || args.maxPrice < 0)) {
      throw new Error("Invalid Argument: maxPrice must be a non-negative number.");
    }
    if (args.minRating !== undefined && (typeof args.minRating !== "number" || args.minRating < 0 || args.minRating > 5)) {
      throw new Error("Invalid Argument: minRating must be a number between 0 and 5.");
    }
    if (args.limit !== undefined && (typeof args.limit !== "number" || args.limit < 1)) {
      throw new Error("Invalid Argument: limit must be a positive integer.");
    }

    // Apply limits
    const limit = Math.min(Math.max(1, args.limit || 5), 10);
    const offset = 0;

    const result = await ProductService.getProducts({
      category: args.category,
      brand: args.brand,
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
      minRating: args.minRating,
      inStock: args.inStock,
      search: args.search,
      limit,
      offset,
    });

    // 2. Sanitize Tool Result before returning to Groq
    return {
      products: result.products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        stock: p.stock,
        rating: p.rating,
        imageUrl: p.imageUrl,
        features: p.features,
        hasVariants: p.hasVariants,
      })),
      total: result.total,
    };
  },
};
