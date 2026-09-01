export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PAYMENT_FAILED" | "CANCELLED";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  idempotencyKey: string | null;
  customerId: string;
  cartId: string | null;
  status: OrderStatus;
  subtotal: string;
  shippingCharge: string;
  total: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CreateOrderResponse {
  success: boolean;
  data?: Order;
  error?: {
    code: string;
    message: string;
  };
}
