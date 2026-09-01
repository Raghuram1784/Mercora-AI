# Phase 5A: Deterministic Recommendation Engine

## Objective
Implement a deterministic recommendation engine that calculates the BEST products for a customer's specific needs, constraints, and use-cases instead of merely returning unranked catalog search results.

Key design invariant:
```text
LLM interprets intent
Backend ranks deterministically
LLM explains recommendations
```
The LLM never assigns or fabricates recommendation scores.

---

## Core Architecture

```text
Customer Request
      ↓
Groq Agent (system prompt guided)
      ↓ (calls recommend_products tool)
Structured Recommendation Criteria
      ↓
Recommendation Service (apps/backend/src/recommendation/recommendation.service.ts)
      ↓
Product Service (apps/backend/src/services/product.service.ts)
      ↓
Recommendation Scorer (apps/backend/src/recommendation/recommendation.scorer.ts)
  ├─ Hard Constraints Enforcement
  ├─ Mathematical Scoring (100 pts)
  ├─ Grounded Reason Attribution
  ├─ Deterministic Tie-Breaking
  └─ Badge Assignment (Best Match, Best Value, Strong Alternative)
      ↓
Ranked Recommendations + Grounded Reasons
      ↓
Groq Agent Explains Results in Natural Language
      ↓
Frontend AI Drawer (AgentMiniCard with badges & "Why this fits" reasons)
```

---

## Scoring Model & Weights

The scoring system calculates a score out of 100 points:

| Factor | Weight | Type | Description |
|---|---|---|---|
| **Category Match** | 25 pts | Eligibility Satisfaction | Full points if category satisfies requested category. |
| **Budget Match** | 25 pts | 20 pts Satisfaction + 5 pts Value | 20 base points for satisfying `maxPrice` + up to 5 points proportional to budget headroom. |
| **Feature Match** | 20 pts | Soft Preference | Proportional match of requested features in product's JSON specifications. |
| **Use-Case Match** | 15 pts | Soft Preference | Proportional match of requested use-cases against `bestFor`/`useCases`. |
| **Rating Quality** | 10 pts | Soft Preference | Normalized score: `(rating / 5.0) * 10`. |
| **Stock Availability** | 5 pts | Eligibility Satisfaction | 5 points when product is in stock (`stock > 0`). |
| **Total** | **100 pts** | | |

Centrally declared in `apps/backend/src/recommendation/recommendation.config.ts`:
```typescript
export const RECOMMENDATION_WEIGHTS = {
  CATEGORY: 25,
  BUDGET: 25,
  FEATURE: 20,
  USE_CASE: 15,
  RATING: 10,
  STOCK: 5,
} as const;
```

---

## Hard Constraints vs. Soft Preferences

### Hard Constraints
When explicitly provided, failing these constraints excludes the product immediately:
- `category`: Non-matching categories are filtered out.
- `maxPrice`: Products with `price > maxPrice` are filtered out.
- `minPrice`: Products with `price < minPrice` are filtered out.
- `inStockOnly`: Out-of-stock items (`stock <= 0`) are filtered out (default: `true`).
- `minRating`: Products with `rating < minRating` are filtered out (when explicitly requested).

### Soft Preferences
Used for candidate scoring and differentiation:
- `desiredFeatures`: Key-value matching (exact equality for booleans and numbers, normalized for strings).
- `useCases`: Normalized array inclusion against product `bestFor` / `useCases` metadata.
- `rating`: Higher rating yields higher rating score points.
- `valueHeadroom`: Remaining budget margin provides up to 5 bonus points within budget.

---

## Deterministic Tie-Breaking Logic
When two products have identical recommendation scores, ties are resolved deterministically:
1. **Higher Rating** (`rating DESC`)
2. **Lower Price** (`price ASC`)
3. **Stable Product ID** (`id ASC` alphabetical sort)

---

## Recommendation Badges & Labels
- **Rank 1**: `Best Match` (Highest scoring candidate).
- **Rank 2**:
  - `Best Value`: Awarded only when Rank 2 has a strong recommendation score (score ≥ 80 and within 10 pts of Rank 1), is substantially cheaper (price ≤ 85% of Rank 1 price), AND satisfies 100% of explicitly requested `desiredFeatures`. If any explicitly requested feature is missed, it is not awarded `Best Value`.
  - `Strong Alternative`: Default label when full feature coverage or price advantage does not justify "Best Value".
- **Rank 3+**: `Strong Alternative`.

---

## Grounded Recommendation Reasons
Every recommendation includes structured reasons attributed directly to underlying catalog fields:
- `Under ₹3,000` (from `maxPrice` and product `price`)
- `Travel use-case match` (from `product.features.bestFor: ["travel", ...]`)
- `Wireless` (from `product.features.wireless: true`)
- `Noise cancellation` (from `product.features.noiseCancellation: true`)
- `20,000mAh capacity` (from `product.features.capacityMah: 20000`)
- `GPS enabled` (from `product.features.gps: true`)
- `Top rated (4.7/5)` / `Good rating (3.9/5)` (from `product.rating`)
- `In stock` (from `product.stock > 0`)

The frontend AI drawer exposes these under a sleek, collapsible **"Why this fits"** accordion on each product card.

---

## Direct REST API Endpoint

`POST /api/recommendations`

### Request Example
```json
{
  "category": "Headphones",
  "maxPrice": 3000,
  "useCases": ["travel"],
  "desiredFeatures": {
    "wireless": true
  },
  "limit": 3
}
```

### Response Example
```json
{
  "success": true,
  "data": {
    "criteria": {
      "category": "Headphones",
      "maxPrice": 3000,
      "useCases": ["travel"],
      "desiredFeatures": {
        "wireless": true
      },
      "inStockOnly": true,
      "limit": 3
    },
    "totalEligible": 2,
    "recommendations": [
      {
        "rank": 1,
        "score": 96,
        "label": "Best Match",
        "product": {
          "id": "28e4dc5f-e34c-4834-a8c6-8953d4784eaa",
          "name": "Travel Headphones",
          "category": "Headphones",
          "brand": "Mercora",
          "price": 1299,
          "rating": 3.9,
          "stock": 140,
          "hasVariants": true
        },
        "reasons": [
          { "type": "CATEGORY", "label": "Category match", "points": 25 },
          { "type": "BUDGET", "label": "Under ₹3,000", "points": 23 },
          { "type": "FEATURE", "label": "Wireless", "points": 20 },
          { "type": "USE_CASE", "label": "Travel use-case match", "points": 15 },
          { "type": "RATING", "label": "Good rating (3.9/5)", "points": 8 },
          { "type": "STOCK", "label": "In stock", "points": 5 }
        ]
      },
      {
        "rank": 2,
        "score": 95,
        "label": "Strong Alternative",
        "product": {
          "id": "0d22d56c-1fb7-4f24-9599-5dcb16873f23",
          "name": "Studio Headphones",
          "category": "Headphones",
          "brand": "Mercora",
          "price": 1999,
          "rating": 4.1,
          "stock": 250,
          "hasVariants": true
        },
        "reasons": [
          { "type": "CATEGORY", "label": "Category match", "points": 25 },
          { "type": "BUDGET", "label": "Under ₹3,000", "points": 22 },
          { "type": "FEATURE", "label": "Wireless", "points": 20 },
          { "type": "USE_CASE", "label": "Travel use-case match", "points": 15 },
          { "type": "RATING", "label": "Good rating (4.1/5)", "points": 8 },
          { "type": "STOCK", "label": "In stock", "points": 5 }
        ]
      }
    ]
  }
}
```

---

## Agent Integration

### Agent Tool
Added `recommend_products` as the 5th controlled tool in `apps/backend/src/agent/tool-registry.ts`:
- `search_products`: Catalog exploration and keyword search.
- `get_product_details`: View detailed specifications and variants.
- `get_cart`: Retrieve active cart state.
- `add_to_cart`: Explicitly authorized cart additions.
- `recommend_products`: Deterministic recommendation engine queries.

### System Prompt Directive
The agent is instructed to use `recommend_products` for recommendation, suitability, and comparative questions, and strictly explain recommendations using the returned deterministic reasons without hallucinating scores or rankings.

---

## Test Verification

| Test Scenario | Input Query / Payload | Result | Status |
|---|---|---|---|
| **Scenario 1** | Headphones ≤ ₹3,000, travel, wireless | Travel Headphones #1 Best Match (96 pts, ₹1,299) | PASSED ✅ |
| **Scenario 2** | Smartwatches, fitness, GPS | Fitness Smartwatch #1 Best Match (93 pts, GPS confirmed) | PASSED ✅ |
| **Scenario 3** | Power Banks ≤ ₹2,000, 20000mAh, USB-C | Slim Power Bank #1 (94 pts, 20000mAh), Fast Charging Power Bank #2 (Best Value, ₹999) | PASSED ✅ |
| **Scenario 4** | Headphones ≤ ₹1 (Impossible budget) | 0 recommendations returned, no constraint violation | PASSED ✅ |
| **Scenario 5** | Determinism test (5 consecutive runs) | 5/5 runs produced 100% identical ranks, scores, and IDs | PASSED ✅ |
| **Scenario 6** | Agent query: "Which headphones should I buy under ₹3,000 for travel?" | Agent invoked `recommend_products`, explained grounded reasons | PASSED ✅ |
| **Scenario 7** | General search regression: "Show me headphones under ₹3000" | Agent invoked `search_products` for catalog browsing | PASSED ✅ |
| **Scenario 8** | Cart Safety: "Which headphone do you recommend?" | Agent recommended without calling `add_to_cart` | PASSED ✅ |

---

## Known Limitations & Boundaries
1. **No Upselling / Cross-selling**: Phase 5A does not implement `ProductRelation`, bundle recommendations, or cart uplift (reserved for Phase 5B).
2. **No Checkout / Payment**: Remains strictly excluded from the agent boundaries.

---

## Status
**PHASE 5A STATUS: READY**
