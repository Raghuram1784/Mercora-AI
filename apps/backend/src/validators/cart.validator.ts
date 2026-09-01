import { CreateCartInput, AddCartItemInput, UpdateCartItemInput } from "../types/cart.types.js";
import { ValidationError } from "./product.validator.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUuid(id: any, fieldName: string): string {
  if (!id || typeof id !== "string") {
    throw new ValidationError(`${fieldName} must be a valid string.`);
  }
  const cleanId = id.trim();
  if (!UUID_REGEX.test(cleanId)) {
    throw new ValidationError(`${fieldName} must be a valid UUID format.`);
  }
  return cleanId;
}

export function validateCreateCart(body: any): CreateCartInput {
  if (!body) {
    throw new ValidationError("Request body is required.");
  }
  const customerId = validateUuid(body.customerId, "customerId");
  return { customerId };
}

export function validateAddCartItem(body: any): AddCartItemInput {
  if (!body) {
    throw new ValidationError("Request body is required.");
  }
  const productId = validateUuid(body.productId, "productId");
  
  let variantId: string | null = null;
  if (body.variantId !== undefined && body.variantId !== null && body.variantId !== "") {
    variantId = validateUuid(body.variantId, "variantId");
  }

  const quantity = body.quantity;
  if (quantity === undefined || quantity === null) {
    throw new ValidationError("quantity is required.");
  }

  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError("quantity must be a positive integer greater than or equal to 1.");
  }

  const source = typeof body.source === "string" ? body.source.trim() : undefined;
  const sourceEventId = typeof body.sourceEventId === "string" ? body.sourceEventId.trim() : undefined;

  return { productId, variantId, quantity, source, sourceEventId };
}

export function validateUpdateCartItem(body: any): UpdateCartItemInput {
  if (!body) {
    throw new ValidationError("Request body is required.");
  }
  const quantity = body.quantity;
  if (quantity === undefined || quantity === null) {
    throw new ValidationError("quantity is required.");
  }

  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
    throw new ValidationError("quantity must be a positive integer greater than or equal to 1.");
  }

  return { quantity };
}
