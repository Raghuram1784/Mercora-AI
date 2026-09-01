import { ToolDefinition } from "../agent.types.js";
import { CartService } from "../../services/cart.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const addToCartTool: ToolDefinition = {
  name: "add_to_cart",
  description: "Add a product (with specific variant, if active variants exist) and quantity to the customer's cart.",
  schema: {
    type: "object",
    properties: {
      cartId: { type: "string", description: "The UUID of the cart" },
      productId: { type: "string", description: "The UUID of the product to add" },
      variantId: { type: "string", description: "The UUID of the selected variant (required if product has variants)" },
      quantity: { type: "integer", description: "The quantity to add (must be a positive integer)" },
    },
    required: ["cartId", "productId", "quantity"],
  },
  execute: async (args, context) => {
    // 1. Validate Arguments
    if (!args.cartId || !UUID_REGEX.test(args.cartId)) {
      throw new Error("Invalid Argument: cartId must be a valid UUID.");
    }
    if (!args.productId || !UUID_REGEX.test(args.productId)) {
      throw new Error("Invalid Argument: productId must be a valid UUID.");
    }
    if (args.variantId && !UUID_REGEX.test(args.variantId)) {
      throw new Error("Invalid Argument: variantId must be a valid UUID if provided.");
    }
    if (args.quantity === undefined || typeof args.quantity !== "number" || args.quantity <= 0 || !Number.isInteger(args.quantity)) {
      throw new Error("Invalid Argument: quantity must be a positive integer.");
    }

    // 2. Validate Cart Ownership
    const cart = await CartService.getCart(args.cartId);
    if (context.customerId && cart.customer.id !== context.customerId) {
      throw new Error("Unauthorized: Cart does not belong to the supplied customer.");
    }

    // 3. Add item
    const item = await CartService.addCartItem(args.cartId, {
      productId: args.productId,
      variantId: args.variantId || undefined,
      quantity: args.quantity,
    });

    return {
      success: true,
      message: "Successfully added item to cart.",
      item: {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      },
    };
  },
};
