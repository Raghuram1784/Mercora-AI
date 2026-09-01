export const RECOMMENDATION_WEIGHTS = {
  CATEGORY: 25,
  BUDGET: 25,
  FEATURE: 20,
  USE_CASE: 15,
  RATING: 10,
  STOCK: 5,
} as const;

export const BUDGET_SCORING_CONFIG = {
  SATISFACTION_POINTS: 20, // Points for meeting explicit budget or baseline budget eligibility
  MAX_VALUE_POINTS: 5,     // Up to 5 points for value headroom within budget
} as const;

export const RECOMMENDATION_LIMITS = {
  DEFAULT_LIMIT: 3,
  MAX_LIMIT: 5,
} as const;
