# AI Design & Agent Strategy

## Overview
This document details the agentic commerce logic, controlled tool boundaries, and LLM design considerations.

## Planned Commerce Agent Flow
- Customer input processing & session context injection
- Intent classification (general browse vs. personalized recommendation vs. cart actions)
- Interactive tool execution (`search_products`, `get_product_details`, `get_cart`, `add_to_cart`, `recommend_products`)
- Cart safety gating & variant selection flows
- Grounded explanation & structured UI metadata rendering

---

## Deterministic Recommendation Strategy (Phase 5A)

### Role Separation:
1. **LLM**: Interprets natural language recommendation intent into structured criteria (`category`, `maxPrice`, `useCases`, `desiredFeatures`).
2. **Recommendation Engine**: Backend module (`apps/backend/src/recommendation`) evaluates candidates against hard constraints and calculates deterministic mathematical scores out of 100 points, applies tie-breaking, and attaches grounded reason labels.
3. **LLM**: Explains the ranked recommendations in conversational English using the structured reasons returned by the tool.

### Boundary Rule:
> **The LLM never assigns or fabricates recommendation scores.**
> All scores, rankings, badges (`Best Match`, `Best Value`, `Strong Alternative`), and recommendation reasons originate exclusively from the deterministic `RecommendationService`.

---

## Deterministic Upsell & Cross-Sell Strategy (Phase 5B)

### Role Separation:
1. **LLM**: Interprets intent (e.g. upgrade inquiries vs. accessory / pairing queries).
2. **Growth Engine**: Backend module (`apps/backend/src/growth`) queries explicit `ProductRelation` rows, validates category boundaries, enforces $\le 1.4\times$ price delta capping, runs grounded feature diffs, calculates deterministic scores, and filters items already present in cart.
3. **LLM**: Explains the grounded upgrade advantage (e.g., *"For ₹1,009 more, you get active noise cancellation and higher rating"*) or complementary match reason.
4. **Customer**: Explicitly chooses whether to add any item to cart.

### Boundary Rule:
> **The LLM never invents upsell or cross-sell relationships, price deltas, or auto-mutates carts.**
> All relations, price differences, and potential uplift values originate exclusively from the deterministic `GrowthService`.

---

## Tool Boundaries & Specialization

| Tool | Purpose | Typical Triggers |
|---|---|---|
| `recommend_products` | Deterministic ranking for customer needs, suitability, and comparative evaluation. | "What should I buy?", "Best headphones under ₹3,000 for travel", "Which speaker is best for outdoor use?" |
| `get_upsell_suggestions` | Higher-tier product upgrades in the same category with grounded feature advantages and reasonable price deltas. | "Is there a better version?", "Upgrade this product", "Show higher-end alternative" |
| `get_cross_sell_suggestions` | Complementary products and accessories based on explicit catalog relationships. | "What goes well with this?", "What accessories do you have?", "Complementary items" |
| `create_order` | Converts an active cart into a permanent Mercora order with status PENDING_PAYMENT. | "Create an order from my cart", "Proceed to checkout", "Buy now" |
| `search_products` | Open catalog discovery and category filtering. | "Show me power banks", "List all earbuds", "Browse items under ₹1,000" |
| `get_product_details` | In-depth product specification and variant lookup. | "Tell me more about X", "What colors does Y come in?" |
| `get_cart` | Active cart inspection. | "What's in my cart?", "Show cart" |
| `add_to_cart` | Authorized cart modification. | "Add the Black edition to cart", "Put this in my cart" |

---

## Internal Order System Strategy (Phase 6)

### Role Separation:
1. **LLM**: Interprets explicit customer intent to checkout (e.g., *"Create an order from my cart"*). Passes ONLY `cartId`.
2. **Order Engine**: Backend module (`apps/backend/src/order`) re-validates active status, stock, and variant requirements, calculates authoritative prices (`variant.price ?? product.price`), computes subtotal/total, generates high-entropy `MRC-YYYYMMDD-XXXXXXXX` order number, inserts `Order` and `OrderItem` snapshot records atomically inside `prisma.$transaction`, and transitions `Cart` to `CHECKOUT_PENDING`.
3. **LLM**: Reports the generated order number, total, and status (`Pending payment`) exactly as returned by `OrderService`.

### Boundary Rule:
> **The LLM never calculates order subtotals, submits prices, or claims an order is PAID.**
> All item snapshot prices, totals, order numbers, and states originate exclusively from the backend `OrderService`. State is strictly `Pending payment` prior to Phase 7 Razorpay verification.

---

## Razorpay Payment Foundation Strategy (Phase 7A)

### Role Separation:
1. **LLM**: May inform the user that an order is ready for payment and guide them to click "Continue to Payment" in the order modal.
2. **Payment Engine**: Backend module (`apps/backend/src/payment`) calculates paise conversion (`Order.total * 100`), calls Razorpay SDK `razorpay.orders.create(...)`, persists `Payment` record, and returns safe checkout data (`keyId`, `razorpayOrderId`, `amount`, `currency`).
3. **Razorpay SDK & User**: User completes payment directly inside the Razorpay Standard Checkout overlay.

### Boundary Rule:
> **Mercora AI does NOT execute payments, verify signatures, or mark orders as PAID.**
> No AI tools exist for `verify_payment`, `complete_payment`, or `mark_paid`.
> All payment signature verification and state transitions (`Order -> PAID`, `Cart -> CONVERTED`) are executed strictly by backend `PaymentService.verifyRazorpayPayment`. When asked "Did my payment go through?", the LLM relies solely on canonical backend database status (`Order.status === 'PAID'`).

---

## Frontend Experience Boundary

### Frontend displays:
* AI response & markdown formatting
* Safe action metadata (e.g. tool execution activity logs)
* Structured product cards with recommendation badges (`BEST MATCH`, `BEST VALUE`, `STRONG ALTERNATIVE`)
* Grounded "Why this fits" reason bullets
* Confirmed cart state & pending variant selection modals

### Frontend does NOT:
* Call Groq directly
* Compute recommendation scores or rankings
* Control prices or stock
* Generate product IDs
* Bypass cart or variant validation
