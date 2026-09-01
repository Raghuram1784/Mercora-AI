import { CreateOrderResponse, Order } from "../types/order";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export class OrderService {
  /**
   * Creates a permanent Mercora Order from an active cart.
   */
  static async createOrder(cartId: string, idempotencyKey?: string): Promise<CreateOrderResponse> {
    const key = idempotencyKey || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ik-${Date.now()}`);

    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify({ cartId }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || {
          code: "ORDER_CREATION_FAILED",
          message: "Failed to create order.",
        },
      };
    }

    return {
      success: true,
      data: data.data,
    };
  }

  /**
   * Fetches an Order by ID.
   */
  static async getOrder(orderId: string): Promise<Order | null> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  }

  /**
   * Cancels an unpaid pending checkout (Order PENDING_PAYMENT -> CANCELLED, Cart CHECKOUT_PENDING -> ACTIVE).
   */
  static async cancelPendingCheckout(orderId: string): Promise<{ success: boolean; data?: { order: Order; cart: any }; error?: any }> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel-pending`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || {
          code: "CANCEL_CHECKOUT_FAILED",
          message: "Failed to cancel pending checkout.",
        },
      };
    }

    return {
      success: true,
      data: data.data,
    };
  }
}
