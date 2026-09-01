# Phase 8: Audit Logs & Merchant Growth Dashboard

## Objective

Phase 8 implements Mercora's **merchant intelligence & growth analytics layer**. It introduces an append-only event ledger (`CommerceEvent`) and a real-data **Merchant Growth Dashboard** to measure revenue, AI influence, recommendation usage, Phase 5B growth engine performance, and payment completion rates.

```text
Customer / AI / Payment Lifecycle Actions
                   ↓
        CommerceEvent Audit Ledger
                   ↓
    Orders + Payments + CommerceEvents
                   ↓
       MerchantAnalyticsService
                   ↓
         Merchant Dashboard API
                   ↓
       Merchant Dashboard UI (/merchant)
```

---

## Technical Architecture & Lifecycle

### 1. Database Schema Evolution (`prisma/schema.prisma`)

- **`CommerceEvent` Model**: Append-only audit ledger with indexing on `type`, `merchantId`, `orderId`, `cartId`, and `customerId`. Supports unique `eventKey` for idempotent deduplication.
- **Enums**:
  - `CommerceEventType`: `AI_RECOMMENDATION_REQUESTED`, `AI_RECOMMENDATION_RETURNED`, `UPSELL_SHOWN`, `CROSS_SELL_SHOWN`, `ACCESSORY_SHOWN`, `AI_ITEM_ADDED_TO_CART`, `UPSELL_ACCEPTED`, `CROSS_SELL_ACCEPTED`, `ACCESSORY_ACCEPTED`, `ORDER_CREATED`, `PAYMENT_STARTED`, `PAYMENT_VERIFIED`, `PAYMENT_FAILED`, `CART_CONVERTED`.
  - `CommerceEventSource`: `CUSTOMER`, `AI`, `SYSTEM`, `PAYMENT`.
  - `CartItemSource`: `DIRECT`, `AI_RECOMMENDATION`, `AI_UPSELL`, `AI_CROSS_SELL`, `AI_ACCESSORY`.
- **Attribution Fields**: `source` and `sourceEventId` on `CartItem` and `OrderItem`.

---

### 2. Server-Validated AI Attribution Boundary

Client-supplied `source` claims (e.g. `AI_RECOMMENDATION`, `AI_UPSELL`) are **never trusted blindly**.

When an item is added to the cart:
1. `AuditService.validateAttribution` verifies the existence of `sourceEventId` in `CommerceEvent`.
2. Confirms the event belongs to the same customer/cart context.
3. Confirms event type matches (`AI_RECOMMENDATION_RETURNED`, `UPSELL_SHOWN`, `CROSS_SELL_SHOWN`, `ACCESSORY_SHOWN`).
4. Confirms target product matches the item being added.
5. If validation fails or passes without valid AI evidence, attribution is downgraded to `DIRECT`.

---

### 3. Growth Uplift Rules

- **Upsell Accepted Uplift**: Calculated only when backend proves source-to-target upgrade (`acceptedUplift = targetUnitPrice - sourceUnitPrice`).
- **Cross-Sell & Accessory Accepted Uplift**: Calculated as line item value (`acceptedUplift = itemPrice * quantity`).
- **Potential Uplift**: Logged when suggestions are shown without combining mutually exclusive upsells.

---

### 4. Authoritative Financial & Behavioral Analytics

- **Paid Revenue**: `SUM(Order.total)` WHERE `status = PAID` in selected UTC period.
- **Paid Orders**: `COUNT(Order)` WHERE `status = PAID` in selected UTC period.
- **Average Order Value (AOV)**: `paidRevenue / paidOrders`.
- **Payment Completion Rate**: `(VERIFIED Payments) / (Unique Razorpay Sessions / PAYMENT_STARTED Events) * 100`.
- **AI-Assisted Influence**: Paid orders containing at least 1 validated AI-attributed `OrderItem`. Revenue labeled as **Revenue from AI-Assisted Orders**.
- **Time Range Boundaries**: Consistent UTC range filtering (`7d`, `30d`, `all`).

---

### 5. Merchant Dashboard APIs & Frontend View (`/merchant`)

- `GET /api/merchant/dashboard/summary?range=30d`
- `GET /api/merchant/dashboard/revenue-trend?range=30d`
- `GET /api/merchant/dashboard/growth?range=30d`
- `GET /api/merchant/dashboard/orders?limit=10`
- `GET /api/merchant/audit-events?limit=20`

#### UI Components ([`apps/frontend/src/pages/merchant-dashboard.tsx`](file:///c:/Users/Raghu%20Ram/Desktop/Mercora%20AI/apps/frontend/src/pages/merchant-dashboard.tsx)):
- KPI cards (Paid Revenue, Paid Orders, AI Influence & Revenue, Accepted Growth Uplift).
- Payment completion rate & recommendation usage metrics bar.
- Daily UTC revenue & orders bar chart.
- AI Growth performance breakdown panel.
- Recent orders table with `DIRECT` vs `AI ASSISTED` status badges and order detail modal.
- Live Commerce Audit Timeline.

---

## Verification Summary

All 7 test scenarios in [`scratch/test-phase8.ts`](file:///c:/Users/Raghu%20Ram/Desktop/Mercora%20AI/scratch/test-phase8.ts) passed:
1. Direct Purchase Audit Logging.
2. Fake Client AI Attribution Rejection & Downgrade to `DIRECT` (Regression Test).
3. Valid Server-Validated AI Attribution & AI-Assisted Classification.
4. Cross-Sell Event & Accepted Uplift Calculation.
5. Event Idempotency & Deduplication.
6. Audit Ledger Secret Scanning (Zero Leaks).
7. Time Range Filtering (`7D`, `30D`, `ALL`).
