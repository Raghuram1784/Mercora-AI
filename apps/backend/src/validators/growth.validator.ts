import { GrowthRequestCriteria } from "../growth/growth.types.js";
import { ValidationError } from "./product.validator.js";

export function validateGrowthCriteria(body: any): GrowthRequestCriteria {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body is required.");
  }

  if (!body.productId || typeof body.productId !== "string" || body.productId.trim() === "") {
    throw new ValidationError("productId is required and must be a non-empty string.");
  }

  const criteria: GrowthRequestCriteria = {
    productId: body.productId.trim(),
  };

  if (body.cartId !== undefined && body.cartId !== null && body.cartId !== "") {
    if (typeof body.cartId !== "string") {
      throw new ValidationError("cartId must be a string.");
    }
    criteria.cartId = body.cartId.trim();
  }

  if (body.limit !== undefined && body.limit !== null && body.limit !== "") {
    const limit = typeof body.limit === "number" ? body.limit : parseInt(body.limit, 10);
    if (isNaN(limit) || limit < 1) {
      throw new ValidationError("limit must be a positive integer.");
    }
    if (limit > 5) {
      throw new ValidationError("limit cannot exceed the maximum allowed value of 5.");
    }
    criteria.limit = limit;
  }

  return criteria;
}
