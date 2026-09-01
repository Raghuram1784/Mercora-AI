import { RecommendationCriteria } from "../recommendation/recommendation.types.js";
import { ValidationError } from "./product.validator.js";

export function validateRecommendationCriteria(body: any): RecommendationCriteria {
  if (!body || typeof body !== "object") {
    return {
      inStockOnly: true,
      limit: 3,
    };
  }

  const criteria: RecommendationCriteria = {
    inStockOnly: body.inStockOnly !== undefined ? Boolean(body.inStockOnly) : true,
    limit: 3,
  };

  if (body.category !== undefined && body.category !== null) {
    if (typeof body.category !== "string") {
      throw new ValidationError("category must be a string.");
    }
    criteria.category = body.category.trim();
  }

  if (body.minPrice !== undefined && body.minPrice !== null && body.minPrice !== "") {
    const minPrice = typeof body.minPrice === "number" ? body.minPrice : parseFloat(body.minPrice);
    if (isNaN(minPrice) || minPrice < 0) {
      throw new ValidationError("minPrice must be a non-negative number.");
    }
    criteria.minPrice = minPrice;
  }

  if (body.maxPrice !== undefined && body.maxPrice !== null && body.maxPrice !== "") {
    const maxPrice = typeof body.maxPrice === "number" ? body.maxPrice : parseFloat(body.maxPrice);
    if (isNaN(maxPrice) || maxPrice < 0) {
      throw new ValidationError("maxPrice must be a non-negative number.");
    }
    criteria.maxPrice = maxPrice;
  }

  if (criteria.minPrice !== undefined && criteria.maxPrice !== undefined) {
    if (criteria.minPrice > criteria.maxPrice) {
      throw new ValidationError("minPrice cannot be greater than maxPrice.");
    }
  }

  if (body.minRating !== undefined && body.minRating !== null && body.minRating !== "") {
    const minRating = typeof body.minRating === "number" ? body.minRating : parseFloat(body.minRating);
    if (isNaN(minRating) || minRating < 0 || minRating > 5) {
      throw new ValidationError("minRating must be a number between 0 and 5.");
    }
    criteria.minRating = minRating;
  }

  if (body.desiredFeatures !== undefined && body.desiredFeatures !== null) {
    if (typeof body.desiredFeatures !== "object" || Array.isArray(body.desiredFeatures)) {
      throw new ValidationError("desiredFeatures must be a key-value object.");
    }
    criteria.desiredFeatures = body.desiredFeatures;
  }

  if (body.useCases !== undefined && body.useCases !== null) {
    if (!Array.isArray(body.useCases)) {
      throw new ValidationError("useCases must be an array of strings.");
    }
    criteria.useCases = body.useCases.map((uc: any) => String(uc).trim()).filter(Boolean);
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
