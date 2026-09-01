import { OrderDomainError } from "../order/order.errors.js";

export function validateCreateOrderInput(body: any): { cartId: string; customerId?: string } {
  if (!body || typeof body !== "object") {
    throw new OrderDomainError("Request body must be a valid JSON object.", "BAD_REQUEST", 400);
  }

  const { cartId } = body;
  if (!cartId || typeof cartId !== "string" || cartId.trim().length === 0) {
    throw new OrderDomainError("cartId is required and must be a valid string.", "BAD_REQUEST", 400);
  }

  return { cartId: cartId.trim() };
}
