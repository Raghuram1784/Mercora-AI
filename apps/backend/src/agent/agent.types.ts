export interface AgentHistoryMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ChatRequest {
  message: string;
  customerId?: string;
  cartId?: string;
  history?: AgentHistoryMessage[];
}

export interface AgentAction {
  tool: string;
  status: "success" | "failure";
  summary: string;
}

export interface AgentTimings {
  initialGroqMs: number;
  toolsMs: Record<string, number>;
  totalToolsMs: number;
  finalGroqMs: number;
  totalMs: number;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    message: string;
    actions: AgentAction[];
    timings?: AgentTimings;
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
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, context: { customerId?: string; cartId?: string }) => Promise<any>;
}
