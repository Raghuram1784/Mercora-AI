# System Architecture

## Overview
This document serves as the architectural overview of the Mercora AI platform.

## Planned Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Express + Node + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 7

## Database Relationships
```text
Merchant
   │
   └── Product
          │
          └── ProductVariant

Customer
   │
   ├── Cart (ACTIVE, ABANDONED, CONVERTED, CHECKOUT_PENDING)
   │      │
   │      └── CartItem
   │             ├── Product (Restrict delete)
   │             └── ProductVariant (optional, Restrict delete)
   │
   └── Order (PENDING_PAYMENT, PAID, PAYMENT_FAILED, CANCELLED)
          │
          └── OrderItem (price snapshot)
                 ├── Product (Restrict delete)
                 └── ProductVariant (optional, SetNull delete)
```

## API Data Flow
### Product Catalog
```text
HTTP Request
   ↓
Product Route (apps/backend/src/routes)
   ↓
Product Controller (apps/backend/src/controllers)
   ↓
Product Service (apps/backend/src/services)
   ↓
Prisma Client (apps/backend/src/config/database.ts)
   ↓
PostgreSQL (Database)
```

### Shopping Cart
```text
HTTP Request
   ↓
Cart Route (apps/backend/src/routes)
   ↓
Cart Controller (apps/backend/src/controllers)
   ↓
Cart Service (apps/backend/src/services)
   ↓
Catalog & Stock Validation
   ↓
Prisma Client (apps/backend/src/config/database.ts)
   ↓
PostgreSQL (Database)
```

### Internal Order System (Phase 6) & Razorpay Payment Foundation (Phase 7A)
```text
Active Cart
   ↓
Order Route: POST /api/orders (apps/backend/src/routes/order.routes.ts)
   ↓
Order Controller (apps/backend/src/controllers/order.controller.ts)
   ↓
Order Service (apps/backend/src/order/order.service.ts)
   ↓
Stock / Variant / Active Re-validation
   ↓
Authoritative Price Snapshots (variant.price ?? product.price)
   ↓
prisma.$transaction
   ├── Order (PENDING_PAYMENT, MRC-YYYYMMDD-XXXXXXXX)
   ├── OrderItems (unitPrice snapshot)
   └── Cart → CHECKOUT_PENDING
   ↓
Payment Route: POST /api/payments/razorpay/order (apps/backend/src/routes/payment.routes.ts)
   ↓
Payment Service: createRazorpayOrder (apps/backend/src/payment/payment.service.ts)
   ↓
Authoritative Amount Conversion (Order.total * 100 paise)
   ↓
Razorpay Orders API (server-side SDK)
   ↓
Razorpay Checkout (Frontend Overlay)
   ↓
Payment Response Identifiers (payment_id, order_id, signature)
   ↓
Payment Verification Route: POST /api/payments/razorpay/verify
   ↓
Payment Service: verifyRazorpayPayment (apps/backend/src/payment/payment.service.ts)
   ↓
HMAC SHA-256 Signature Verification & SDK Amount/Currency Check
   ↓
prisma.$transaction
   ├── Payment → VERIFIED (razorpayPaymentId, verifiedAt)
   ├── Order   → PAID (paidAt)
   └── Cart    → CONVERTED
   ↓
CartService: createOrGetActiveCart (apps/backend/src/services/cart.service.ts)
   ↓
Fresh ACTIVE Cart initialized (CartContext reset, badge count = 0)
```

## Core Commerce Rules
1. **Pricing Authority**: The backend controls pricing. Unit prices are resolved dynamically from `ProductVariant` (if selected and non-null) or base `Product` during checkout or cart retrieval. Client-provided prices are ignored.
2. **Inventory Tracking**: The cart validates item quantities against available stock but does not decrement stock or hold reservations. Inventory deductions occur inside the Order phase.
3. **Cart Item Identity**: Different variants of the same product constitute separate logical items. Adding duplicate matching entries (same product + same variant, or same base product without variant) merges quantities rather than duplicating records.
4. **Availability State**: Cart items are not deleted if they become unavailable; their availability status is dynamically computed and flagged in the retrieval payload.

## Frontend Routing and Data Flow
```text
Customer Interaction
   ↓
React UI Components (apps/frontend/src/components)
   ↓
Context Hook: useCart() (apps/frontend/src/context/cart-context.tsx)
   ↓
API Service wrapper: cart.service.ts / product.service.ts
   ↓
REST HTTP Request
   ↓
Express REST APIs (apps/backend/src/routes)
```

## Cart State Strategy
- **Provider Pattern**: The `CartProvider` maintains the `cart` state object.
- **Server Authority**: The frontend never controls prices, stock levels, or calculates authoritative cart subtotals.
- **One-way Sync**: Mutations (add, update, delete) are confirmed by the backend, which returns the canonical cart snapshot to the provider, keeping the frontend in sync with server calculations.

## Variant Enforcement Invariant
If a product has one or more active variant configurations, adding the product to the cart requires supplying a valid `variantId`.
```text
Product has active variants
        ↓
variantId required
        ↓
Backend enforced (VARIANT_REQUIRED)
```
This rule is strictly enforced at the database/transaction layer on the backend to protect:
1. **Frontend UI UX**: Prevents invalid base products from being quick-added from grid listings.
2. **Direct API Callers**: Standardizes cart integrity across custom endpoint integrations.
3. **Future AI Agents**: Ensures LLM-based autonomous agents using tools cannot add ambiguous products without specifying client preferences.

## Visual Design & Color System
The Mercora interface adheres to a designated visual design system:
- **Design Tokens**:
  - Background: `#07060C`
  - Elevated background: `#0B0912`
  - Card: `#0F0D18`
  - Glass: `rgba(18, 14, 31, 0.68)`
  - Glass stronger: `rgba(20, 16, 36, 0.82)`
  - Borders: `rgba(255, 255, 255, 0.08)`
  - Primary text: `#F8F7FC`
  - Secondary text: `#A39CAF`
  - Primary violet: `#8B5CF6`
  - Bright violet: `#A855F7`
  - Indigo: `#6366F1`
  - Electric blue accent: `#4F7CFF`
  - Success: `#22C55E`
  - Rating star: `#FBBF24`
- **Page Gradient System**: Layered radial gradients and a base linear gradient are rendered behind content (using `pointer-events-none` container lights to preserve click targets).
- **Product Gallery Model**: Keeps a primary `imageUrl` for lightweight catalog grid lists, and adds a `galleryImages` string array queried only on detail loads for active thumbnail carousel swaps.

## Agentic Commerce Architecture
```text
Customer
   ↓
AI Shopping UI
   ↓
POST /api/agent/chat
   ↓
Groq Agent
   ↓
Controlled Tools (search_products, get_product_details, get_cart, add_to_cart, recommend_products)
   ↓
Commerce & Recommendation Services
   ↓
PostgreSQL
```

## Deterministic Recommendation Architecture (Phase 5A)
```text
Customer Request
   ↓
Mercora AI (Groq)
   ↓
recommend_products Tool
   ↓
Recommendation Engine (apps/backend/src/recommendation)
   ↓
Product Service (apps/backend/src/services/product.service.ts)
   ↓
Product Catalog (PostgreSQL)
   ↓
Deterministic 100-Point Scoring & Tie-Breaking
   ↓
Ranked Recommendations + Grounded Reasons
   ↓
AI Natural Explanation & UI Presentation
```

## Deterministic Growth Engine Architecture (Phase 5B)
```text
Customer Request ("Is there a better version?" / "What goes well with this?")
   ↓
Mercora AI (Groq)
   ↓
Controlled Growth Tools:
  • get_upsell_suggestions (same-category upgrades, <= 1.4x price guard)
  • get_cross_sell_suggestions (complementary items & accessories)
   ↓
Growth Service (apps/backend/src/growth/growth.service.ts)
   ↓
Product Relationships (PostgreSQL ProductRelation table)
   ↓
Category-Aware Feature Diff & Deterministic Scoring
   ↓
Cart Duplicate Filtering (excl. items already in cart)
   ↓
Independent Uplift Calculation (bestUpsellDelta & crossSellTotalValue)
   ↓
AI Explanation + Drawer Badges + Manual Cart Mutation
```
## Phase 9: Failure Recovery & Idempotency Architecture

```text
Incoming Action / Verification Request
   ↓
[ Idempotency Gate ] ──(Already Verified?)──> Return Existing Verified Payload
   ↓ (No)
[ Validation & Ownership Check ] ──(Mismatch/Invalid?)──> Controlled Error Code Response
   ↓ (Valid)
[ Atomic Transaction ] (Payment -> VERIFIED, Order -> PAID, Cart -> CONVERTED)
   ↓
[ Deduplicated Audit Event ] (via unique eventKey)
   ↓
[ Fresh Active Cart Initialization ]
   ↓
Client State Synchronization (CartContext updated, UI reset)
```
