export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  products?: {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    rating: number;
    imageUrl: string;
    hasVariants: boolean;
    source?: string;
    sourceEventId?: string;
    aiAttributionSource?: string;
    rank?: number;
    score?: number;
    label?: string;
    reasons?: string[];
  }[];
  actions?: {
    tool: string;
    status: "success" | "failure";
    summary: string;
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
}

export interface ChatHistoryItem {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}
