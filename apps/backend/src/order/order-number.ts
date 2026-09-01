import crypto from "crypto";

/**
 * Generates a human-readable, high-entropy unique Mercora Order Number.
 * Format: MRC-YYYYMMDD-XXXXXXXX (e.g., MRC-20260830-7A9F2E4B)
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  // 4 random bytes = 8 hex characters (4.29 billion unique suffixes per day)
  const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `MRC-${dateStr}-${randomSuffix}`;
}
