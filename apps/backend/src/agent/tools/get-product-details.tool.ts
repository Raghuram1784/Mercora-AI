import { ToolDefinition } from "../agent.types.js";
import { ProductService } from "../../services/product.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getProductDetailsTool: ToolDefinition = {
  name: "get_product_details",
  description: "Get detailed information about a specific product by ID, including its variants, specs, and stock levels.",
  schema: {
    type: "object",
    properties: {
      productId: { type: "string", description: "The UUID of the product" },
    },
    required: ["productId"],
  },
  execute: async (args) => {
    // 1. Validate Arguments
    if (!args.productId || !UUID_REGEX.test(args.productId)) {
      throw new Error("Invalid Argument: productId must be a valid UUID.");
    }

    const product = await ProductService.getProductById(args.productId);
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND: Product could not be found or is inactive.");
    }

    // 2. Sanitize Tool Result (No images, no db timestamps)
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      stock: product.stock,
      rating: product.rating,
      features: product.features,
      description: product.description,
      hasVariants: product.variants.length > 0,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        attributes: v.attributes,
      })),
    };
  },
};
