import { CommerceEventType, CommerceEventSource, ProductRelationType } from "../generated/prisma/index.js";

export interface RecordCommerceEventInput {
  eventKey?: string;
  type: CommerceEventType;
  source: CommerceEventSource;
  merchantId?: string;
  customerId?: string;
  cartId?: string;
  orderId?: string;
  paymentId?: string;
  productId?: string;
  sourceProductId?: string;
  targetProductId?: string;
  suggestionType?: ProductRelationType;
  potentialUplift?: number | string;
  acceptedUplift?: number | string;
  metadata?: Record<string, any>;
}

export interface ValidateAttributionInput {
  customerId?: string;
  cartId?: string;
  productId: string;
  source?: string;
  sourceEventId?: string;
}

export interface ValidateAttributionResult {
  valid: boolean;
  source: "DIRECT" | "AI_RECOMMENDATION" | "AI_UPSELL" | "AI_CROSS_SELL" | "AI_ACCESSORY";
  sourceEventId?: string;
  event?: any;
}
