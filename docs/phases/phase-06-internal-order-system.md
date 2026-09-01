# Phase 6: Internal Order System

## Objective

Mercora's Phase 6 introduces the internal order system to convert a validated active cart into an immutable, permanent Mercora order with status `PENDING_PAYMENT` prior to Razorpay payment integration (Phase 7).

---

## Target Lifecycle

```text
ACTIVE CART
    ↓
validate everything (stock, active products, variant selection)
    ↓
prisma.$transaction
    ├── Order (PENDING_PAYMENT)
    ├── OrderItems (unitPrice snapshot)
    └── Cart → CHECKOUT_PENDING
    ↓
PENDING_PAYMENT ORDER
    ↓
Phase 7: Razorpay Payment
    ↓
verified payment
    ↓
Order → PAID
Cart  → CONVERTED
```

---

## Core Architecture & Rules

1. **Authoritative Price Snapshots**:
   - Item prices, subtotals, shipping charges, and totals are computed strictly by backend authority using `variant.price ?? product.price`.
   - `OrderItem` preserves unit price, total price, product name, SKU, and variant name snapshots independently of future catalog edits.
   - Client requests attempting to submit custom prices, totals, or statuses are strictly ignored.

2. **Order Number Strategy**:
   - Format: `MRC-YYYYMMDD-XXXXXXXX` (e.g. `MRC-20260830-33A08FA5`)
   - High-entropy cryptographic random 8-character uppercase hex suffix ($4.29\text{ billion}$ combinations per day).
   - Backed by database unique constraint `@unique`.

3. **Atomic Cart Transition & Mutation Guard**:
   - Cart status transitions from `ACTIVE` to `CHECKOUT_PENDING` atomically inside the order creation transaction.
   - `CartService` cart mutation methods (`addCartItem`, `updateCartItem`, `removeCartItem`) reject modifications on non-ACTIVE carts (`CART_NOT_ACTIVE`).

4. **Idempotency & Race Handling**:
   - `Idempotency-Key` header supported (`POST /api/orders`).
   - If an order exists with the same idempotency key or if an active `PENDING_PAYMENT` order already exists for the given cart, the existing order is returned idempotently without creating duplicates.
   - Database `P2002` unique constraint catches concurrently raced requests gracefully.

5. **AI Agent Safety Gate**:
   - Controlled tool `create_order` accepts only `cartId`.
   - Tool execution requires explicit customer order intent (e.g. "Create my order", "Proceed to checkout"). Recommendation queries NEVER trigger order creation.
   - System prompt rules forbid claiming payment success or status `PAID`.

---

## API Contracts

### `POST /api/orders`
- **Headers**: `Idempotency-Key: <uuid>` (optional)
- **Request Body**: `{ "cartId": "uuid" }`
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "orderNumber": "MRC-20260830-33A08FA5",
      "idempotencyKey": "uuid",
      "customerId": "uuid",
      "cartId": "uuid",
      "status": "PENDING_PAYMENT",
      "subtotal": "12297.00",
      "shippingCharge": "0.00",
      "total": "12297.00",
      "currency": "INR",
      "createdAt": "2026-08-30T18:20:00.000Z",
      "updatedAt": "2026-08-30T18:20:00.000Z",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "productName": "Wireless Headphones",
          "sku": "MCR-WV100-BLK",
          "variantId": "uuid",
          "variantName": "Black Edition",
          "quantity": 1,
          "unitPrice": "4999.00",
          "totalPrice": "4999.00"
        }
      ]
    }
  }
  ```

### `GET /api/orders/number/:orderNumber`
- Lookup order metadata by human-readable order number.

### `GET /api/orders/:id`
- Lookup order metadata by internal UUID.

---

## Status

`PHASE 6 STATUS: READY`
