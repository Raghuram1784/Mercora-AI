import { AppError } from "../middleware/error.js";

export class OrderDomainError extends Error implements AppError {
  statusCode: number;
  code: string;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = "OrderDomainError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class OrderNotFoundError extends OrderDomainError {
  constructor(message: string = "Order not found.") {
    super(message, "ORDER_NOT_FOUND", 404);
  }
}

export class CartNotFoundError extends OrderDomainError {
  constructor(message: string = "Cart not found.") {
    super(message, "CART_NOT_FOUND", 404);
  }
}

export class EmptyCartError extends OrderDomainError {
  constructor(message: string = "Cannot create an order from an empty cart.") {
    super(message, "EMPTY_CART", 400);
  }
}

export class InvalidCartStatusError extends OrderDomainError {
  constructor(message: string = "Cart is not active for order creation.") {
    super(message, "INVALID_CART_STATUS", 409);
  }
}

export class InsufficientStockError extends OrderDomainError {
  constructor(message: string = "Insufficient stock available for order items.") {
    super(message, "INSUFFICIENT_STOCK", 409);
  }
}

export class ProductUnavailableError extends OrderDomainError {
  constructor(message: string = "One or more products are inactive or unavailable.") {
    super(message, "PRODUCT_UNAVAILABLE", 409);
  }
}

export class VariantRequiredError extends OrderDomainError {
  constructor(message: string = "Variant selection is required for this product.") {
    super(message, "VARIANT_REQUIRED", 409);
  }
}

export class InvalidVariantError extends OrderDomainError {
  constructor(message: string = "Selected variant is invalid or inactive.") {
    super(message, "INVALID_VARIANT", 409);
  }
}

export class OrderAlreadyExistsError extends OrderDomainError {
  constructor(message: string = "An order already exists for this cart.") {
    super(message, "ORDER_ALREADY_EXISTS", 409);
  }
}

export class IdempotencyConflictError extends OrderDomainError {
  constructor(message: string = "Idempotency key conflict.") {
    super(message, "IDEMPOTENCY_CONFLICT", 409);
  }
}

export class InvalidOrderStatusError extends OrderDomainError {
  constructor(message: string = "Order status does not allow this operation.") {
    super(message, "INVALID_ORDER_STATUS", 400);
  }
}
