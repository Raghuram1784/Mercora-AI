# Development Log

## Entry Template

### Date

### Feature

### Expected Behavior

### Problem Encountered

### Root Cause

### Investigation

### Fix

### Prevention / Lesson Learned

### Date: August 30, 2026

### Feature: Phase 8 Audit Logs & Merchant Growth Dashboard

### Expected Behavior
Mercora provides an append-only `CommerceEvent` audit ledger and a real-data **Merchant Growth Dashboard** (`/merchant`) displaying authoritative revenue, paid order metrics, payment completion rates, AI-assisted influence, Phase 5B growth engine performance, and live audit timeline.

### Key Implementation Highlights
- Added `CommerceEvent` model with `eventKey` deduplication, `CartItemSource`, `CommerceEventType`, and `CommerceEventSource` enums.
- Built server-validated AI attribution in `AuditService.validateAttribution`. Client claims without valid matching `CommerceEvent` evidence are rejected and downgraded to `DIRECT`.
- Implemented `MerchantAnalyticsService` computing server-side metrics from `Order`, `Payment`, `CommerceEvent`, and `OrderItem` records using consistent UTC range boundaries (`7d`, `30d`, `all`).
- Built frontend Merchant Growth Dashboard view (`/merchant`) with KPI cards, daily UTC revenue trend chart, AI Growth breakdown panel, recent orders table with `DIRECT` vs `AI ASSISTED` badges, and live audit timeline.
- Verified zero secret exposure (`RAZORPAY_KEY_SECRET`, `razorpay_signature`) across event metadata and API responses.
- Created 7-scenario comprehensive automated test suite (`scratch/test-phase8.ts`) — 100% passing.

---

### Date: August 30, 2026

### Feature: Phase 7B Payment Verification & Final Checkout Lifecycle

### Expected Behavior
Upon receiving Razorpay payment response callback, the frontend submits identifiers (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) to `POST /api/payments/razorpay/verify`. The backend performs constant-time HMAC SHA-256 signature verification and SDK amount integrity validation, atomically updates database records (`Payment` $\rightarrow$ `VERIFIED`, `Order` $\rightarrow$ `PAID`, `Cart` $\rightarrow$ `CONVERTED`), instantiates a fresh `ACTIVE` cart, and enables seamless shopping continuation.

### Problem Encountered
1. After order checkout, the source cart transitioned to `CHECKOUT_PENDING`. If the cart was not converted and reset to a fresh `ACTIVE` cart on payment completion, subsequent add-to-cart clicks failed with `CART_NOT_ACTIVE`.
2. HMAC SHA-256 signature comparison must use constant-time buffer comparison to prevent timing attacks.

### Root Cause
Frontend `CartContext` retained the converted `cartId` without receiving the newly created active cart from the backend verification payload.

### Fix
- Implemented `PaymentService.verifyRazorpayPayment` with constant-time HMAC SHA-256 signature check (`crypto.timingSafeEqual`), Razorpay SDK amount/currency validation, and atomic `prisma.$transaction`.
- Added `resetCartToActive` in frontend `CartContext` to automatically reset cart state to the fresh `ACTIVE` cart returned in `verifyRes.data.nextCart`.
- Connected `OrderConfirmationModal` checkout callback to `verifyRazorpayPayment`, displaying a polished `PAID` success screen and enabling `"Continue Shopping"` without page reload.

### Prevention / Lesson Learned
Never treat frontend payment callbacks as payment proof. Always perform server-side signature verification, transition cart/order states atomically in a database transaction, and immediately return a fresh active cart so the user's shopping journey continues smoothly.

---

### Date: August 30, 2026

### Feature: Phase 7A Razorpay Test Mode Payment Foundation

### Expected Behavior
A validated Mercora Order in `PENDING_PAYMENT` status creates or reuses a server-side Razorpay Order with an authoritative amount in paise. The frontend launches the Razorpay Standard Checkout overlay, allowing the customer to perform a test payment. Order status remains `PENDING_PAYMENT` until Phase 7B backend signature verification.

### Problem Encountered
1. Backend environment loading needed to support `apps/backend/.env` without leaking secret keys to frontend or logs.
2. Clicking "Continue to Payment" multiple times must not generate duplicate Razorpay Orders.

### Root Cause
1. `dotenv.config` was configured only for root `.env` path.
2. Multiple payments could be initialized if existing `Payment` records in `CREATED`/`PENDING` status were not queried prior to Razorpay API invocation.

### Fix
- Updated `apps/backend/src/config/env.ts` to load both root `.env` and `apps/backend/.env` safely with `Razorpay configuration loaded ✅` startup verification.
- Added `PaymentStatus` enum (`CREATED`, `PENDING`, `VERIFIED`, `FAILED`) and `Payment` model to `prisma/schema.prisma`.
- Implemented `PaymentService.createRazorpayOrder` with authoritative paise conversion (`Order.total * 100`) and existing Razorpay Order reuse.
- Created frontend `PaymentService`, dynamic Razorpay script loader (`loadRazorpayScript`), and connected `OrderConfirmationModal` with `"Continue to Payment"`, loading state, dismissal panel, and retry handling (`[ Try Again ]`).

### Prevention / Lesson Learned
Always perform amount calculations server-side from canonical database records, and enforce strict boundary separation between checkout UI launch (Phase 7A) and backend HMAC signature verification (Phase 7B).

---

### Date: August 30, 2026

### Feature: Phase 6 Internal Order System & Concurrency Protection

### Expected Behavior
Creating an internal order converts an active cart into a permanent `PENDING_PAYMENT` order. The backend takes authoritative price snapshots, validates stock/variants/active status atomically inside `prisma.$transaction`, transitions the cart to `CHECKOUT_PENDING`, and protects against race conditions and price tampering.

### Problem Encountered
1. If a cart in `CHECKOUT_PENDING` status remained editable, subsequent cart additions would diverge from the immutable snapshotted pending order.
2. Concurrent duplicate checkout clicks or AI invocations risked creating multiple pending orders for the same cart.

### Root Cause
Cart mutations were checking `cart.status !== "ACTIVE"`, but `CHECKOUT_PENDING` was not yet an enum member in `CartStatus`. Also, pre-transaction checks alone could suffer from concurrent database race windows.

### Fix
- Added `CHECKOUT_PENDING` to `CartStatus` enum in `prisma/schema.prisma` and applied via Prisma migration / schema sync.
- Updated `OrderService.createOrder` to atomically transition `Cart.status` to `CHECKOUT_PENDING` inside the database transaction.
- Added database unique constraints on `Order.cartId` and `Order.idempotencyKey` with Prisma `P2002` race condition fallback returning the existing pending order.
- Standardized high-entropy order numbers `MRC-YYYYMMDD-XXXXXXXX` (8 hex chars $\approx 4.29\text{B}$ suffixes/day).
- Built frontend `OrderConfirmationModal` preview and Direct APIDirect endpoints (`POST /api/orders`, `GET /api/orders/:id`, `GET /api/orders/number/:orderNumber`).

### Prevention / Lesson Learned
Always link cart lifecycle states (`CHECKOUT_PENDING` $\rightarrow$ `CONVERTED`) explicitly to order creation and payment verification to guarantee that snapshot state and cart state never diverge.

---

### Date: August 27, 2026

### Feature: Non-Blocking Category Recommendations

### Expected Behavior
Queries mentioning a recognizable product category (e.g. "Which headphones should I buy?", "Recommend a smartwatch") must immediately invoke `recommend_products` with available criteria and rank items using backend scoring (rating, stock, value) without prematurely blocking on questions about optional criteria (budget, use case, features).

### Problem Encountered
The agent system prompt was overly conservative and guided the model to ask clarifying questions about budget and use cases before executing any recommendation tools.

### Root Cause
The recommendation prompt lacked explicit instructions stating that `category`, `budget`, `useCases`, and `desiredFeatures` are all optional, and that naming a category warrants an immediate recommendation tool call.

### Investigation
Tested "Which headphones should I buy?" in `AgentService`. Confirmed the agent was withholding the tool execution round to ask three clarification questions.

### Fix
Updated `apps/backend/src/agent/prompts/system-prompt.ts` with the "Recommend First, Personalize After" paradigm and refined `apps/backend/src/agent/tools/recommend-products.tool.ts` descriptions. Added regression test suite `scratch/test-recommendation-regression.ts`.

### Prevention / Lesson Learned
Shopping assistants should provide immediate value by returning top-ranked defaults based on available context, followed by optional personalization prompts, rather than interrogating the user beforehand.

---

### Date: August 24, 2026

### Feature: Product Images Seeding

### Expected Behavior
Idempotent database seeding maps unique, relevant, and visually distinct web images to each of the 40 product records in PostgreSQL.

### Problem Encountered
Unrelated product images displayed across the catalog. All items under the `Power Banks` and `Accessories` categories rendered identical workspace/tech setup images.

### Root Cause
`prisma/seed.ts` assigned the same Unsplash photo URLs to all products within the category listings. The idempotent seed `update` step was only updating other fields and not resetting existing `imageUrl` fields if they already existed.

### Investigation
Checked the Unsplash photo IDs in `prisma/seed.ts` and confirmed duplicate links were defined for power banks and cables/adapters. Rerunning `db seed` was not updating the `imageUrl` column in existing database rows.

### Fix
Curated a distinct, category-correct set of 20+ Unsplash photo URLs and mapped them to all 40 products. Updated the upsert loop to explicitly map `imageUrl` updates in the query `update` block.

### Prevention / Lesson Learned
Always visually review product listings in the browser rather than inspecting row counts alone. Spaced updates must spread all image parameters inside Prisma upsert runs.

---

### Date: August 24, 2026

### Feature: Variant Selection Enforcement

### Expected Behavior
Adding products with active variants to the cart requires selecting a variant configuration. Direct base product quick-add must be rejected on the backend.

### Problem Encountered
Products with active variants could be quick-added directly from catalog cards without selecting a variant, placing parent base product records in the cart.

### Root Cause
The backend `addCartItem` logic inside `apps/backend/src/services/cart.service.ts` only validated specific variants if `variantId` was supplied. It did not check if the parent product had any active variants when `variantId` was missing.

### Investigation
Inspected the transaction logic in `cart.service.ts` and found no conditional active variant count checks for base product add requests.

### Fix
- Modified backend to query active variant counts: `tx.productVariant.count({ where: { productId, active: true } })`.
- Throw a `ConflictError` with code `VARIANT_REQUIRED` if count > 0 and `variantId` is omitted.
- Exposed `hasVariants` boolean flag in `GET /api/products` list response.
- Configured frontend cards to show "Choose Options" (directing to details page) instead of quick-adds if `hasVariants === true`.

### Prevention / Lesson Learned
Frontend validation is insufficient; the backend API must enforce schema rules to protect API users and future AI agents. Custom error responses must utilize structured code keys (e.g. `VARIANT_REQUIRED`) instead of message string regex checks.

---

### Date: August 24, 2026

### Feature: Visual Fidelity & Product Media

### Expected Behavior
The shop interface matches the approved design mockup: displaying visually accurate product images, multi-image thumbnail carousels on detail pages, and defined gradients/color systems.

### Problem Encountered
Phase 3.5 improved general styling but failed visual fidelity check against mockup rules. Mismatches existed between product name representations and visual stock photographs (e.g. desk mats showing full computer setup images, charging cables showing headphones, writing tablets showing coffee/book photos).

### Root Cause
1. **Independent Curation**: Product names and stock images were curated in isolation rather than mapping object definitions together.
2. **Schema Limitation**: Storing only a single `imageUrl` prevented rendering detailed gallery thumbnails.
3. **Implicit Design Specification**: Development lacked strict CSS hex variables and linear/radial gradient layer properties in tailwind configurations.

### Investigation
Compared the active web browser catalog and details pages with mockup assets, finding inconsistencies in card layouts, labels (e.g., "Authoritative Price"), and header heights.

### Fix
- Added `galleryImages String[] @default([])` to schema and executed migration.
- Replaced seed items with generic demo names and visually checked matching Unsplash images.
- Applied exact colors (`#07060C`, `#0B0912`, `#0F0D18`, glass ratios) and radial backdrop layers.
- Formatted details pages to use a 48%/52% grid split, thumbnail image galleries with click transitions, and specs parameter cards.

### Prevention / Lesson Learned
Design specifications must define exact visual tokens. Content data structures must align name properties and media properties together. Verify image contents by rendering them in a live browser rather than assuming contents from URLs.

---

### Date: August 26, 2026

### Feature: Category-Based Product and Image Curation Rebuild

### Expected Behavior
A visually verified product catalog where every name, description, category, and photo gallery represent the exact same physical object.

### Problem Encountered
Previous product media mappings repeatedly produced unrelated or duplicated imagery, and overly specific/awkward product names made locating exact visual representation photography difficult.

### Root Cause
Ad-hoc or automated stock photo mapping without manual pixel verification resulted in incorrect categorization (e.g. keyboard showing up as headphones) and repetitive photo links.

### Fix
- Discarded previous image assignments and fully reset all product records.
- Renamed all 40 products to clean, simple, generic names under six strictly defined categories.
- Configured 1 primary image and exactly 2 gallery images for all 40 products (3 visually inspected, unique Unsplash photo links per product).
- Repurposed the `mivi-roam-2` product from `Speakers` to `Accessories` to achieve the target 6 Speakers and 7 Accessories distribution.
- Simplified custom category features templates.
- Executed idempotent Prisma seeds successfully.

### Prevention / Lesson Learned
Always visually verify the final rendered catalog in the browser, category by category. Skip automated or unverified URL imports for high-fidelity commerce catalogs.

---

### Date: August 26, 2026

### Feature: Product Details Mockup Alignment

### Expected Behavior
A compact, dense, fold-efficient details page matching the design mockup proportions, layout, and visual placement without excessive vertical gaps or padding.

### Problem Encountered
The product details page had too much vertical whitespace, oversized option selection cards, and pushed critical purchasing details below the fold on standard desktop resolutions.

### Root Cause
Implicit spacing, large padding gaps between blocks, and cards layout for variant lists instead of inline horizontal wrap option chips.

### Fix
- Restructured `product-page.tsx` grid to utilize a 54% Left / 46% Right layout.
- Embedded a vertical thumbnail rail next to the primary image container on desktop.
- Integrated a row of 4 dynamic, category-aligned premium feature badges inside the bottom area of the image card.
- Compressed option card elements into compact, inline selectable chips inside `variant-selector.tsx`.
- Grouped Call-To-Action (quantity controls + Add to Cart) into a single row on desktop with a full-width secondary Wishlist button directly below.
- Appended a bottom horizontal utility trust benefits strip below the main split columns.
- Reduced margin gaps and vertical paddings across all elements.

### Prevention / Lesson Learned
Group primary purchase call-to-actions compactly. Avoid full-card option components when lists grow vertically, opting for flex-wrapped chip rows to preserve above-the-fold content visibility.

---

### Date: August 26, 2026

### Feature: Final Product Detail Compact Layout Fix

### Expected Behavior
The entire key shopping and details content (back shop link, gallery thumbnail strip, main image, ratings/reviews, description, variants selector, quantity selectors, Add to Cart button, key specs, and trust benefits) fits naturally above the fold (100vh) on standard desktop resolutions without vertical scrollbar requirements.

### Problem Encountered
Vertical layout heights was still unnecessarily tall due to the separate technical specifications grid at the bottom, separate bottom trust indicator bar, global page footer render, and loose wishlist action block.

### Root Cause
Wasted space from multiple margins, duplicated details sections, global footer attachment on product detail paths, and redundant secondary button blocks.

### Fix
- Removed the Wishlist button, state, and click handlers completely.
- Hidden the global footer conditionally on all product detail page routes.
- Deleted the separate bottom technical specifications container and dynamic specs grid, and replaced it by piping features attributes directly into the 4 image container badges.
- Deleted the separate bottom trust benefits bar and relocated it as a compact row directly below the quantity/Add to Cart CTA block inside the purchase panel.
- Constrained left column image stage to max heights matching specific resolutions (e.g. 540px at 1440x900).
- Limited product description to a strict 2-line clamp (`line-clamp-2`).
- Fixed thumbnail heights to 64px, added load error state handlers to prevent browser broken icon displays.
- Visual mouse gallery curation to replace the unrelated office/desk mat photo.

#### Date: August 27, 2026

### Feature: Premium AI Assistant Drawer Integration

### Expected Behavior
A premium, integrated AI assistant drawer on the right side of the Shop view. It slides in/out using Framer Motion, preserves conversational history across toggle unmounts, maps horizontal mini product recommendation cards inline in the chat flow, and traps exceptions locally inside the sheet without crashing the main application.

### Problem Encountered
1. Dedicated `/ai` page split-panel layout felt visually weak and occupied too much whitespace.
2. Unmounting the assistant page resulted in loss of conversation history context during the session.
3. Rendering crashes on message loops or missing response elements turned the screen blank.

### Root Cause
1. Split-pane layout required both columns to exist, resulting in empty panels on initial load.
2. Conversation state was locked to page unmount life-cycle.
3. Lacked a localized error trap boundary, so any child layout crash bubbled up to the global routing wrapper.

### Fix
1. Removed the `/ai` route path and dedicated page components.
2. Lifted messages, history, and products state array into `AppContent` context to maintain persistent session memory across drawer toggles.
3. Created a sparkles ✨ AI button in the header nav and a floating FAB at the bottom-right.
4. Built `agent-assistant-drawer.tsx` with a `w-full max-w-md` sheet layout.
5. Wired horizontal mini product cards (`agent-mini-card.tsx`) inline inside message bubbles.
6. Configured `agent-error-boundary.tsx` to trap render crashes inside the sheet, displaying a local inline `Mercora AI couldn't display this response. [ Try Again ]` card.

### Prevention / Lesson Learned
Lifting conversation state up keeps logs persistent when toggling visibility drawers. Use compact horizontal mini card layouts inside restricted sidebars, and wrap drawer components inside error boundaries to isolate exceptions.

---

## [Phase 5A] Deterministic Recommendation Engine Implementation

### Issue Summary
1. **Budget-Favoring Distortion**: Simple linear pricing scoring could inadvertently reward the cheapest budget-satisfying product excessively, overshadowing superior feature or rating matches.
2. **Deterministic Stability**: LLM-driven recommendation tools must avoid stochastic ranking and hallucinated scores while still producing natural language conversational explanations.
3. **Type Safety & Pagination in Product Queries**: `ProductService.getProducts()` enforces strict query typing including `offset` parameter which required explicit pagination defaults when invoked from the recommendation service layer.

### Solution
1. **Split Budget Model**: Allocated 20 base points for satisfying the explicit budget (`maxPrice`) and capped value headroom bonuses to 5 points. This ensures feature quality, rating, and use-case suitability determine the top candidate.
2. **Architecture Separation (LLM Interprets -> Backend Ranks -> LLM Explains)**: The LLM converts user queries into structured criteria, `RecommendationService` applies hard constraints and 100-point scoring with multi-tier tie-breaking (`Score DESC -> Rating DESC -> Price ASC -> ID ASC`), and the LLM receives grounded reason labels to explain the result.
3. **Controlled Agent Tool (`recommend_products`)**: Registered as the 5th tool alongside `search_products`, with clear system prompt boundaries preventing hallucinations and cart mutations during recommendation inquiries.

### Prevention / Lesson Learned
Separate eligibility satisfaction points from candidate differentiation scoring to avoid biasing rankings toward extreme values. Always enforce deterministic tie-breaking cascades to guarantee reproducible output across multiple invocations.

---

## [Phase 5B] Deterministic Upsell & Cross-Sell Engine Implementation

### Issue Summary
1. **Unconstrained Upsells**: Freeform LLM recommendations could suggest cross-category items as upgrades or products with excessive price jumps (e.g. recommending an ₹8,000 product when looking at a ₹1,500 item).
2. **Hallucinated Feature Claims**: Unrestricted numeric comparison could claim arbitrary numbers as advantages (e.g. claiming a heavier weight or smaller battery as an improvement).
3. **Cart Safety & Rate Limit Robustness**: Rapid multi-turn agent tool execution could burst free-tier Groq TPM quotas, while suggestion inquiries risked auto-mutating shopping carts without explicit user confirmation.

### Solution
1. **Strict Category Isolation & 1.4x Price Guard**: Restricted `UPSELL` relationships strictly to the same category, and enforced `target.price <= source.price * 1.40`.
2. **Category-Aware Feature Diff Engine**: Built `GrowthScorer.detectImprovements()` supporting only verified properties (`batteryLifeHours`, `batteryLifeDays`, `capacityMah`, `rating`, `gps`, `noiseCancellation`, `fastCharging`, `AMOLED display`, `waterResistance`, `outputPowerWatts`). Unknown diffs award 0 points.
3. **Independent Uplift Reporting**: Separated mutually exclusive upsell deltas (`bestUpsellDelta`) from complementary sums (`crossSellTotalValue`).
4. **Resilient Agent Tooling & Auto-Backoff**: Registered `get_upsell_suggestions` and `get_cross_sell_suggestions`, embedded exponential retry backoff in `AgentService`, and enforced explicit customer confirmation before cart mutations.

### Prevention / Lesson Learned
Never sum mutually exclusive upgrade alternatives into a single potential uplift figure. Guard LLM tool execution loops with automatic rate-limit backoff, and strictly gate cart mutations behind explicit user actions.


