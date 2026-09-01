# Phase 7B: Payment Verification & Final Checkout Lifecycle

## Objective

Phase 7B completes Mercora's end-to-end checkout lifecycle through **backend-authoritative HMAC SHA-256 signature verification**, Razorpay SDK metadata validation, atomic database state transitions, and immediate fresh active cart generation.

```text
Razorpay Success Callback (frontend)
        ↓
POST /api/payments/razorpay/verify
        ↓
Backend HMAC SHA-256 Signature Verification (constant-time buffer compare)
        ↓
Backend Razorpay SDK Fetch & Amount/Currency Integrity Check
        ↓
prisma.$transaction
    ├── Payment  → VERIFIED (stores razorpayPaymentId, verifiedAt)
    ├── Order    → PAID (stores paidAt)
    └── Cart     → CONVERTED
        ↓
CartService creates / retrieves fresh ACTIVE Cart for customer
        ↓
Frontend CartContext resets to fresh ACTIVE Cart (badge = 0)
        ↓
Customer clicks [ Continue Shopping ] -> Ready to buy new items without CART_NOT_ACTIVE errors!
```

---

## Security Boundary & Rules

1. **Backend Verification Authority**:
   - `Razorpay frontend callback ≠ Mercora payment success`.
   - The frontend receives `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` and sends them to `POST /api/payments/razorpay/verify`.
   - The frontend NEVER directly sets `Order.status = PAID` or decides signature validity.

2. **Constant-Time HMAC SHA-256 Comparison**:
   - Generated signature: `crypto.createHmac("sha256", secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex")`.
   - Compared using `crypto.timingSafeEqual` after buffer length verification.
   - If invalid, throws `INVALID_PAYMENT_SIGNATURE` (status 400). Order remains `PENDING_PAYMENT` and Cart remains `CHECKOUT_PENDING`.

3. **Order Ownership & Amount Integrity**:
   - Verification verifies `supplied razorpay_order_id === Payment.razorpayOrderId`.
   - SDK payment fetch verifies `payment.amount === Math.round(Order.total * 100)` and `payment.currency === Order.currency`.

4. **Atomic State Transition**:
   - DB updates occur inside `prisma.$transaction`:
     - `Payment` $\rightarrow$ `VERIFIED`, `razorpayPaymentId`, `verifiedAt`.
     - `Order` $\rightarrow$ `PAID`, `paidAt`.
     - `Cart` $\rightarrow$ `CONVERTED`.

5. **Fresh Active Cart Continuity**:
   - On verified payment, `CartService.createOrGetActiveCart(order.customerId)` ensures a new `ACTIVE` cart.
   - Frontend `CartContext` resets state to the fresh active cart, resetting badge count to 0.
   - Subsequent `addCartItem` requests succeed on the new cart while rejecting mutations on converted carts (`CART_NOT_ACTIVE`).

---

## API Endpoints

### `POST /api/payments/razorpay/verify`
- **Request Body**:
  ```json
  {
    "mercoraOrderId": "uuid",
    "razorpay_order_id": "order_...",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "..."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "verified": true,
      "payment": {
        "id": "uuid",
        "status": "VERIFIED",
        "razorpayPaymentId": "pay_TVzqIv...",
        "razorpayOrderId": "order_TVzqIv...",
        "amount": "12998.00",
        "currency": "INR",
        "verifiedAt": "2026-08-30T19:11:00.000Z"
      },
      "order": {
        "id": "uuid",
        "orderNumber": "MRC-20260830-282FF970",
        "status": "PAID",
        "total": "12998.00",
        "currency": "INR",
        "paidAt": "2026-08-30T19:11:00.000Z"
      },
      "cart": {
        "id": "uuid",
        "status": "CONVERTED"
      },
      "nextCart": {
        "id": "new-cart-uuid",
        "status": "ACTIVE",
        "items": []
      }
    }
  }
  ```

---

## Status

`PHASE 7B STATUS: READY`
