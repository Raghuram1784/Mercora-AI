# Phase 5B: Deterministic Upsell & Cross-Sell Engine

## Overview & Objective
Phase 5B establishes the **Merchant Growth Layer** in Mercora AI. It introduces deterministic, catalog-grounded upgrade suggestions (Upsells) and complementary recommendations (Cross-sells / Accessories) driven by explicit database relationships and category-aware feature comparison rules.

The system ensures that the merchant's revenue growth aligns strictly with customer value and satisfaction without ever allowing the LLM to invent prices, relations, upgrade deltas, or perform unauthorized cart mutations.

---

## Architecture & Data Flow

```text
Customer Request ("Is there a better version?" / "What goes well with this?")
               ↓
Groq Agent (Llama-3.3-70b-versatile)
  • Interprets customer intent
  • Invokes 'get_upsell_suggestions' or 'get_cross_sell_suggestions'
               ↓
Growth Engine Layer (Backend)
  • Explicit ProductRelation lookup (UPSELL / CROSS_SELL / ACCESSORY)
  • Hard Category Check (Upsells restricted strictly to same category)
  • Price Multiplier Guard (Target price <= Source price * 1.40)
  • Grounded Feature Comparison (Recognized property diffs)
  • Mathematical Scoring (100-point deterministic formulas)
  • Cart Context Filtering (Excludes items already in customer cart)
  • Independent Uplift Calculation (bestUpsellDelta vs crossSellTotalValue)
               ↓
Agent Explanation & UI Presentation
  • Grounded explanation ("For ₹1,009 more, you get active noise cancellation and higher rating")
  • Structured drawer cards with "Upgrade Available", "Accessory", "Goes Well With" badges
  • Explicit customer approval required before cart mutation
```

---

## Data Model & Relationships

### Prisma Schema (`prisma/schema.prisma`)
```prisma
enum ProductRelationType {
  UPSELL
  CROSS_SELL
  ACCESSORY
}

model ProductRelation {
  id              String              @id @default(uuid())
  sourceProductId String
  targetProductId String
  type            ProductRelationType
  priority        Int                 @default(0)
  reason          String?
  active          Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  sourceProduct Product @relation("SourceProductRelations", fields: [sourceProductId], references: [id], onDelete: Cascade)
  targetProduct Product @relation("TargetProductRelations", fields: [targetProductId], references: [id], onDelete: Cascade)

  @@unique([sourceProductId, targetProductId, type])
  @@index([sourceProductId, type, active])
}
```

---

## Upsell & Cross-Sell Scoring Math

### 1. Upsell Scoring (Total 100 Points)
- **Feature Improvement (40 pts)**: Detects recognized product specification advantages (battery life, capacity, noise cancellation, GPS, AMOLED display, water resistance, charging wattage).
- **Rating Improvement (20 pts)**: Proportional to `(target.rating - source.rating) * 30` (capped at 20).
- **Price Reasonableness (20 pts)**: Proportional to `(1 - (priceDelta / (source.price * 0.40))) * 20`.
- **Relationship Priority (15 pts)**: Priority 1 = 15 pts, Priority 2 = 10 pts, Priority 3+ = 5 pts.
- **Stock Availability (5 pts)**: Active stock > 0.

### 2. Cross-Sell / Accessory Scoring (Total 100 Points)
- **Relationship Priority (40 pts)**
- **Rating Quality (30 pts)**: `(rating / 5.0) * 30`
- **Price Reasonableness (20 pts)**
- **Stock Availability (10 pts)**

---

## Invariants & Safety Guarantees
1. **Zero Hallucinated Relationships**: Only verified catalog relationships seeded or validated in PostgreSQL are returned.
2. **Category Isolation**: Upsells are strictly confined to products sharing the exact same category.
3. **Price Delta Capping**: Target products costing $> 1.4\times$ the source product are rejected as invalid upsells.
4. **Mutually Exclusive Uplift**: `bestUpsellDelta` and `crossSellTotalValue` are calculated and reported separately; alternatives are never summed together.
5. **No Auto-Cart Mutation**: Inquiries for upgrades or accessories never add items to cart automatically. Explicit customer approval is required.
