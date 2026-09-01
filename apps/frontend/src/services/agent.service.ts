import { request } from "./api";
import { ChatHistoryItem } from "../types/agent";

export class AgentService {
  static async sendMessage(payload: {
    message: string;
    customerId?: string | null;
    cartId?: string | null;
    history: ChatHistoryItem[];
  }): Promise<{
    success: boolean;
    data: {
      message: string;
      actions: { tool: string; status: "success" | "failure"; summary: string }[];
      products?: {
        id: string;
        name: string;
        brand: string;
        category: string;
        price: number;
        rating: number;
        imageUrl: string;
        hasVariants: boolean;
      }[];
      pendingAction?: {
        type: "SELECT_VARIANT";
        productId: string;
        productName: string;
        variants: {
          id: string;
          name: string;
          sku: string;
          price: number | null;
          stock: number;
          attributes: Record<string, any>;
        }[];
      };
      cart?: any;
    };
  }> {
    // Sanitize conversation history: only include role & content, capped at 10 messages
    const sanitizedHistory = payload.history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
      .slice(-10);

    return request<{ success: boolean; data: any }>("/agent/chat", {
      method: "POST",
      body: JSON.stringify({
        message: payload.message,
        customerId: payload.customerId || undefined,
        cartId: payload.cartId || undefined,
        history: sanitizedHistory,
      }),
    });
  }
}
