export interface CreateCartInput {
  customerId: string;
}

export interface AddCartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  source?: string;
  sourceEventId?: string;
}

export interface UpdateCartItemInput {
  quantity: number;
}
