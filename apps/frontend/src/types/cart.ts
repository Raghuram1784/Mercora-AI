export interface CustomerSummary {
  id: string;
  name: string;
}

export interface CartAvailability {
  available: boolean;
  reason: string;
  stock: number;
}

export interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
  };
  variant: {
    id: string;
    name: string;
    sku: string;
  } | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  availability: CartAvailability;
}

export interface CartSummary {
  itemCount: number;
  subtotal: string;
  currency: string;
}

export interface Cart {
  id: string;
  status: string;
  customer: CustomerSummary;
  items: CartItem[];
  summary: CartSummary;
}

export interface CartResponse {
  success: boolean;
  data: Cart;
}
