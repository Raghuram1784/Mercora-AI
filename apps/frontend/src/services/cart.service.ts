import { request } from "./api";
import { CartResponse } from "../types/cart";

export class CartService {
  static async createOrGetCart(customerId: string): Promise<{ success: boolean; data: { id: string; customerId: string; status: string } }> {
    return request<{ success: boolean; data: { id: string; customerId: string; status: string } }>("/carts", {
      method: "POST",
      body: JSON.stringify({ customerId }),
    });
  }

  static async getCart(cartId: string): Promise<CartResponse> {
    return request<CartResponse>(`/carts/${cartId}`);
  }

  static async addCartItem(
    cartId: string,
    payload: { productId: string; variantId?: string | null; quantity: number; source?: string; sourceEventId?: string }
  ): Promise<any> {
    return request(`/carts/${cartId}/items`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<any> {
    return request(`/carts/${cartId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  static async removeCartItem(cartId: string, itemId: string): Promise<any> {
    return request(`/carts/${cartId}/items/${itemId}`, {
      method: "DELETE",
    });
  }
}
