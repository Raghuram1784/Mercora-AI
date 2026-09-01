import { ToolDefinition } from "../agent.types.js";
import { OrderService } from "../../order/order.service.js";

export const createOrderTool: ToolDefinition = {
  name: "create_order",
  description:
    "Converts an active cart into a permanent Mercora order with status PENDING_PAYMENT. Invoke ONLY when the customer explicitly asks to create an order or proceed to checkout.",
  schema: {
    type: "object",
    properties: {
      cartId: {
        type: "string",
        description: "The UUID of the active cart to create an order from.",
      },
    },
    required: [],
  },
  execute: async (args: any, context: { customerId?: string; cartId?: string }) => {
    const targetCartId = args.cartId || context.cartId;

    if (!targetCartId) {
      return {
        success: false,
        error: {
          code: "CART_NOT_FOUND",
          message: "No active cart ID was provided or found in the session context.",
        },
      };
    }

    try {
      const order = await OrderService.createOrder({
        cartId: targetCartId,
        customerId: context.customerId,
      });

      return {
        success: true,
        summary: `Created Mercora order ${order.orderNumber} for total ${order.currency} ${order.total} (Status: ${order.status}).`,
        order,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: err.code || "ORDER_CREATION_FAILED",
          message: err.message || "Failed to create order.",
        },
      };
    }
  },
};
