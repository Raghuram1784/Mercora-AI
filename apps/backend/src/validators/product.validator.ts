import { ProductQueryFilters } from "../types/product.types.js";

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateProductQuery(query: any): ProductQueryFilters {
  const filters: ProductQueryFilters = {
    limit: 20,
    offset: 0,
  };

  if (query.category !== undefined && query.category !== null) {
    filters.category = String(query.category).trim();
  }

  if (query.brand !== undefined && query.brand !== null) {
    filters.brand = String(query.brand).trim();
  }

  if (query.search !== undefined && query.search !== null) {
    filters.search = String(query.search).trim();
  }

  if (query.minPrice !== undefined && query.minPrice !== "") {
    const minPrice = parseFloat(query.minPrice);
    if (isNaN(minPrice) || minPrice < 0) {
      throw new ValidationError("minPrice must be a non-negative number.");
    }
    filters.minPrice = minPrice;
  }

  if (query.maxPrice !== undefined && query.maxPrice !== "") {
    const maxPrice = parseFloat(query.maxPrice);
    if (isNaN(maxPrice) || maxPrice < 0) {
      throw new ValidationError("maxPrice must be a non-negative number.");
    }
    filters.maxPrice = maxPrice;
  }

  if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
    if (filters.minPrice > filters.maxPrice) {
      throw new ValidationError("minPrice cannot be greater than maxPrice.");
    }
  }

  if (query.minRating !== undefined && query.minRating !== "") {
    const minRating = parseFloat(query.minRating);
    if (isNaN(minRating) || minRating < 0 || minRating > 5) {
      throw new ValidationError("minRating must be a number between 0 and 5.");
    }
    filters.minRating = minRating;
  }

  if (query.inStock !== undefined && query.inStock !== null) {
    filters.inStock = query.inStock === "true" || query.inStock === "1";
  }

  if (query.limit !== undefined && query.limit !== "") {
    const limit = parseInt(query.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      throw new ValidationError("limit must be a positive integer.");
    }
    if (limit > 100) {
      throw new ValidationError("limit cannot exceed the maximum allowed value of 100.");
    }
    filters.limit = limit;
  }

  if (query.offset !== undefined && query.offset !== "") {
    const offset = parseInt(query.offset, 10);
    if (isNaN(offset) || offset < 0) {
      throw new ValidationError("offset must be a non-negative integer.");
    }
    filters.offset = offset;
  }

  return filters;
}
