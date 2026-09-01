import { ToolDefinition } from "../agent.types.js";
import { CartService } from "../../services/cart.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getCartTool: ToolDefinition = {
  name: "get_cart",
  description: "Retrieve details of a customer's shopping cart, including items, quantities, and authoritative subtotal.",
  schema: {
    type: "object",
    properties: {
      cartId: { type: "string", description: "The UUID of the cart" },
    },
    required: ["cartId"],
  },
  execute: async (args, context) => {
    // 1. Validate Arguments
    if (!args.cartId || !UUID_REGEX.test(args.cartId)) {
      throw new Error("Invalid Argument: cartId must be a valid UUID.");
    }

    const cart = await CartService.getCart(args.cartId);

    // 2. Validate Cart Ownership
    if (context.customerId && cart.customer.id !== context.customerId) {
      throw new Error("Unauthorized: Cart does not belong to the supplied customer.");
    }

    // 3. Sanitize output (only return necessary fields)
    return {
      id: cart.id,
      status: cart.status,
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        variantId: item.variant?.id || null,
        variantName: item.variant?.name || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        available: item.availability.available,
      })),
      summary: cart.summary,
    };
  },
};
