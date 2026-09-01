/**
 * Helper utility functions for deterministic recommendation scoring and normalization.
 */

export function normalizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

export function normalizeArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => (typeof v === "string" ? normalizeString(v) : ""))
    .filter(Boolean);
}

/**
 * Deterministic comparison for feature values.
 * - Booleans: exact equality
 * - Strings: case-insensitive trimmed equality
 * - Numbers: exact numeric equality
 * - Arrays: normalized inclusion
 */
export function matchFeatureValue(productValue: unknown, requestedValue: unknown): boolean {
  if (productValue === undefined || productValue === null) {
    return false;
  }

  // Boolean match
  if (typeof requestedValue === "boolean") {
    return typeof productValue === "boolean" && productValue === requestedValue;
  }

  // Number match
  if (typeof requestedValue === "number") {
    if (typeof productValue === "number") {
      return productValue === requestedValue;
    }
    if (typeof productValue === "string") {
      const parsed = Number(productValue);
      return !isNaN(parsed) && parsed === requestedValue;
    }
    return false;
  }

  // String match
  if (typeof requestedValue === "string") {
    const normalizedReq = normalizeString(requestedValue);
    if (typeof productValue === "string") {
      return normalizeString(productValue) === normalizedReq;
    }
    if (Array.isArray(productValue)) {
      const normalizedArr = normalizeArray(productValue);
      return normalizedArr.includes(normalizedReq);
    }
    return false;
  }

  // Array match
  if (Array.isArray(requestedValue)) {
    const normalizedReqs = normalizeArray(requestedValue);
    if (Array.isArray(productValue)) {
      const normalizedProd = normalizeArray(productValue);
      return normalizedReqs.some((req) => normalizedProd.includes(req));
    }
    if (typeof productValue === "string") {
      const normalizedProd = normalizeString(productValue);
      return normalizedReqs.includes(normalizedProd);
    }
    return false;
  }

  return false;
}

/**
 * Format currency amount for clean display in reasons.
 */
export function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
