# Phase 7A: Razorpay Test Mode Payment Foundation

## Objective

Phase 7A establishes the Razorpay Test Mode Payment Foundation for Mercora AI.
It links a snapshotted Mercora Order (`PENDING_PAYMENT`) to a server-generated Razorpay Order, allowing customers to launch Razorpay Standard Checkout in test mode.

```text
ACTIVE Cart
    ↓ (Phase 6)
Mercora Order (PENDING_PAYMENT) & Cart (CHECKOUT_PENDING)
    ↓ (Phase 7A)
Backend creates Razorpay Order (authoritative amount in paise)
    ↓
Frontend opens Razorpay Checkout overlay
    ↓
Customer completes TEST payment
    ↓
Razorpay returns payment identifiers (payment_id, order_id, signature)
    ↓
Order remains PENDING_PAYMENT (Signature verification in Phase 7B)
```

---

## Environment & Git Safety

- Backend environment variables loaded safely from `apps/backend/.env`:
  ```env
  RAZORPAY_KEY_ID=rzp_test_...
  RAZORPAY_KEY_SECRET=...
  ```
- Startup logging verifies `Razorpay configuration loaded ✅` without printing key secrets.
- `.gitignore` configured with `.env` and `.env.*` rules. Template file `apps/backend/.env.example` created without credentials.
- `RAZORPAY_KEY_SECRET` is kept server-side only and never exposed in frontend bundles or API payloads.

---

## Database Schema Model (`prisma/schema.prisma`)

```prisma
enum PaymentStatus {
  CREATED
  PENDING
  VERIFIED
  FAILED
}

model Payment {
  id                String        @id @default(uuid())
  orderId           String
  provider          String        @default("RAZORPAY")
  status            PaymentStatus @default(CREATED)

  razorpayOrderId   String?       @unique
  razorpayPaymentId String?

  amount            Decimal       @db.Decimal(12, 2)
  currency          String        @default("INR")

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, status])
}
```

---

## Core Rules & Strategies

1. **Authoritative Amount Conversion**:
   - Client requests send ONLY `orderId`. Frontend never submits amount or currency.
   - Backend queries database `Order.total` and converts to paise (`Math.round(order.total * 100)`).
   - Example: ₹798.00 $\rightarrow$ 79800 paise.

2. **Existing Razorpay Order Reuse (Idempotency)**:
   - Repeated requests for the same Mercora order check for an existing `Payment` record in `CREATED` or `PENDING` status.
   - If present, the backend reuses the existing `razorpayOrderId` without creating duplicate Razorpay orders.

3. **Status Preservation & Security Boundary**:
   - Phase 7A preserves `Order.status = PENDING_PAYMENT`, `Cart.status = CHECKOUT_PENDING`, and `Payment.status = CREATED/PENDING`.
   - The frontend payment callback does NOT mark orders as `PAID`. Signature verification occurs in Phase 7B.

4. **Dismissal & Retry Handling**:
   - If the user closes the Razorpay overlay, the frontend displays:
     ```text
     Payment was not completed.
     Your order is safe and still pending payment.
     [ Try Again ]
     ```
   - Clicking `[ Try Again ]` re-opens checkout reusing the same Mercora Order.

---

## API Endpoints

### `POST /api/payments/razorpay/order`
- **Request Body**: `{ "orderId": "uuid" }`
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "mercoraOrderId": "uuid",
      "mercoraOrderNumber": "MRC-20260830-282FF970",
      "razorpayOrderId": "order_TVzqIvZcsBBAZI",
      "amount": 1299800,
      "currency": "INR",
      "keyId": "rzp_test_..."
    }
  }
  ```

---

## Status

`PHASE 7A STATUS: READY`
