import { Decimal } from "../config/database.js";

export interface CreateOrderInput {
  cartId: string;
  customerId?: string;
  idempotencyKey?: string;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  source?: string;
  sourceEventId?: string | null;
}

export interface OrderResponseData {
  id: string;
  orderNumber: string;
  idempotencyKey: string | null;
  customerId: string;
  cartId: string | null;
  status: "PENDING_PAYMENT" | "PAID" | "PAYMENT_FAILED" | "CANCELLED";
  subtotal: string;
  shippingCharge: string;
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
}
