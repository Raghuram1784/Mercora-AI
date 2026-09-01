# Mercora AI - Real System Failure Stories & Retrospective Log

## Overview
This document records genuine runtime and architectural failures encountered during the development of Mercora AI, along with the root causes, investigations, fixes, and lessons learned.

---

### Failure Story 1: Post-Payment Stale Cart State (`CART_NOT_ACTIVE`)

- **Problem**: After a customer completed payment for Order A, returning to the shop and adding another item threw a backend error: `CART_NOT_ACTIVE`.
- **Impact**: Customers could not perform consecutive purchases without manually refreshing the browser.
- **Root Cause**:
  - The backend payment verification converted Cart A to `CONVERTED` and created a fresh `ACTIVE` Cart B.
  - However, the frontend `CartContext` retained the reference to Cart A in memory instead of replacing it with Cart B from the verification response.
- **Investigation**:
  - Inspected network responses for `POST /api/payments/razorpay/verify`.
  - Noticed `nextCart` object was returned in the payload, but `cart-context.tsx` did not immediately call `setCart(response.data.nextCart)`.
- **Fix**:
  - Updated `CartContext.verifyPayment` to directly ingest `response.data.nextCart` into state immediately upon signature verification.
  - Reset all checkout UI states (`currentOrder`, `paymentState`) on `Done` or dismissal.
- **Verification**: Tested sequential purchases without browser refresh in `scratch/test-phase9-e2e.ts` and verified Cart A $\rightarrow$ `CONVERTED`, Cart B $\rightarrow$ `ACTIVE`.
- **Lesson**: State transitions that occur on the server must return the new active resource state directly in the response payload to prevent client-server state divergence.

---

### Failure Story 2: AI Markdown Rendering Crash (Vite CJS/ESM Mismatch)

- **Problem**: Opening the AI Assistant drawer and receiving a response containing Markdown tables or lists caused a blank screen React crash (`ReactMarkdown is not a function`).
- **Impact**: Entire AI assistant feature broke on Vite production builds.
- **Root Cause**: Interop issue between ESM and CommonJS exports in `react-markdown` v10 under Vite's dev server bundler.
- **Investigation**:
  - Examined browser console error log: `TypeError: (0 , react_markdown__WEBPACK_IMPORTED_MODULE_0__.default) is not a function`.
- **Fix**:
  - Implemented a defensive CJS/ESM wrapper component in `agent-message.tsx`:
    `const MarkdownRenderer = (ReactMarkdown as any).default || ReactMarkdown;`
  - Wrapped `ReactMarkdown` render calls with `safeContent` string coercion.
- **Verification**: Verified Markdown rendering across tables, lists, and bold text with 0 React uncaught exceptions.
- **Lesson**: Third-party UI packages with complex module exports must be wrapped defensively against bundler module resolution differences.

---

### Failure Story 3: Server-Validated AI Attribution Metadata Loss

- **Problem**: Real browser purchases originated from AI recommendations showed `AI-Assisted Revenue = 0` and `AI-Assisted Orders = 0` on the Merchant Dashboard.
- **Impact**: AI recommendation efficacy was not reflected in merchant metrics.
- **Root Cause**:
  - `AgentService.processMessage` was stripping attribution fields (`source`, `aiAttributionSource`, `sourceEventId`) from candidate products before returning the JSON payload.
  - Frontend `addItem` call omitted `sourceEventId`, causing `AuditService.validateAttribution` to fail validation and fall back to `DIRECT`.
- **Investigation**:
  - Traced end-to-end payload fields: `CommerceEvent.id` $\rightarrow$ `AgentMessage` $\rightarrow$ `CartService.addCartItem` $\rightarrow$ `OrderItem.source`.
  - Identified where `sourceEventId` became `undefined`.
- **Fix**:
  - Preserved `source` and `sourceEventId` in `recMetadata` in `agent.service.ts`.
  - Passed `sourceEventId` through `AgentMessage`, `AgentVariantModal`, `CartContext`, `CartService`, and `OrderService`.
- **Verification**: Executed 3-flow validation in `scratch/test-final-browser-validation.ts` and `scratch/test-phase9-e2e.ts`. Confirmed `AI_RECOMMENDATION` items correctly attributed to AI revenue.
- **Lesson**: Attribution lineage requires strict end-to-end schema contract preservation across LLM tool outputs, UI state, API payloads, and database columns.

---

### Failure Story 4: Test Script Transaction Pollution on Merchant Dashboard

- **Problem**: Merchant Dashboard showed accumulated revenue of ₹95,869 and 20 paid orders despite only 3 real manual test orders being placed.
- **Impact**: Financial reporting analytics contained automated test data pollution.
- **Root Cause**: Automated test scripts (`scratch/test-phase6.ts`, `test-phase7a.ts`, etc.) created persistent orders and payments in the main development database without cleanup.
- **Investigation**:
  - Queried database `Order` table grouped by customer email.
  - Found hundreds of test orders linked to `test-customer@mercora.ai`.
- **Fix**:
  - Added dedicated isolated test emails (`phase6-test@mercora.ai`, `phase9-failures@mercora.ai`, etc.).
  - Added pre-test database reset functions and `finally` teardown blocks in all test scripts.
- **Verification**: Verified `scratch/test-phase9-failures.ts` and `test-phase9-e2e.ts` clean up 100% of created records upon exit.
- **Lesson**: Automated test suites running against dev databases must enforce strict isolation and mandatory teardown cleanup to protect analytics integrity.

---

### Failure Story 5: Razorpay Checkout Modal Dismissal & Pending Order State Lock

- **Problem**: When a customer opened the Razorpay payment modal and closed it by clicking `X` or pressing `ESC`, the cart controls remained disabled (`CHECKOUT_PENDING`), and subsequent attempts to check out threw an error (`ACTIVE_ORDER_EXISTS`).
- **Impact**: Customers who dismissed the payment modal could neither retry payment nor edit their shopping cart.
- **Root Cause**:
  - Closing the Razorpay modal fired `onDismiss` on the frontend, but the frontend did not release the pending UI lock.
  - The cart remained in `CHECKOUT_PENDING` status while the created Mercora Order remained in `PENDING_PAYMENT` status in the database.
- **Investigation**:
  - Traced frontend modal event handlers in `apps/frontend/src/components/cart/order-confirmation-modal.tsx`.
  - Found that closing the Razorpay overlay left `paymentState = "dismissed"` without providing clear recovery actions to either retry the pending order or cancel the pending checkout.
- **Fix**:
  - Implemented state lock controls and clear UX recovery paths:
    1. **Retry Payment**: Reuses the existing `PENDING_PAYMENT` Mercora order and launches Razorpay overlay directly.
    2. **Cancel Checkout & Edit Cart**: Calls `POST /api/orders/:id/cancel` which transitions the order to `CANCELLED`, releases the cart back to `ACTIVE`, and unlocks all quantity/item modification controls.
  - Implemented late-payment server guard: If a late webhook or signature verification attempt arrives for a `CANCELLED` order, backend rejects it with `INVALID_ORDER_STATUS` (*Cannot verify a cancelled order*), protecting cart and revenue integrity.
- **Verification**: Verified in `scratch/test-phase9-failures.ts` (Test #12, #13, #15) that pending checkout cancellation safely releases cart to `ACTIVE` and late payment attempts on cancelled orders are rejected.
- **Lesson**: Payment systems must account for user drop-off and modal dismissal by offering explicit recovery mechanisms (retry or cancel) while enforcing strict backend guards against late verification attempts.

---

### Failure Story 6: Prisma Production Enum Migration Drift (`CommerceEventType` Failure)

- **Problem**: When running analytics API queries on the live Neon PostgreSQL database (`GET /api/merchant/dashboard/summary`), backend threw HTTP 500: `Invalid input value for enum "CommerceEventType": "PAYMENT_STARTED"`.
- **Impact**: Merchant Dashboard queries crashed on production Neon PostgreSQL database.
- **Root Cause**:
  - Migration 4 (`20260831212500_phase_10_full_schema`) was generated when draft enum values were present in Prisma schema.
  - Later, `schema.prisma` was updated with canonical enum values (`PAYMENT_STARTED`, `PAYMENT_VERIFIED`, etc.), but the live PostgreSQL database type `CommerceEventType` on Neon retained the old draft values.
- **Investigation**:
  - Checked Prisma migration history and Neon PostgreSQL type definition using `SELECT enumlabel FROM pg_enum`.
  - Found that Neon's Postgres enum lacked the new canonical values used by backend controllers.
- **Fix**:
  - Created incremental Migration 5 (`20260831233000_fix_commerce_event_enums`) using safe PostgreSQL DDL: `ALTER TYPE "CommerceEventType" ADD VALUE IF NOT EXISTS 'PAYMENT_STARTED';` etc.
  - Executed `npx prisma migrate deploy` to synchronize Neon PostgreSQL schema without resetting or deleting commerce data.
- **Verification**: Ran `npx prisma migrate status` (0 unapplied migrations) and verified all 5 Merchant Dashboard endpoints return HTTP 200 OK.
- **Lesson**: Never edit an already-applied Prisma migration DDL file. Production database schema changes must be deployed via incremental, non-destructive migrations.

