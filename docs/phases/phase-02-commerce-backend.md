# Phase 2: Customer & Cart Commerce Backend

## Objective
Establish a deterministic customer and shopping cart backend. Customers must be able to manage a single active shopping cart, add items (including optional product variants), update quantities, and retrieve computed subtotals with active stock and relationship checks.

## Implemented
- Added `Customer`, `Cart`, and `CartItem` models with database-level restrict and cascade delete behaviors.
- Added a `CartItem.quantity > 0` CHECK constraint in PostgreSQL.
- Updated database seeding with an idempotent Demo Customer insertion.
- Created service layers, query validators, and controllers for customers and carts.
- Exposed routes for customer operations, cart creation, adding items, updating quantities, and removing items.

## Database Design
```text
Customer
   ↓
Cart
   ↓
CartItem
   ├── Product
   └── ProductVariant (optional)
```
- **Customer**: Links to a list of carts.
- **Cart**: Associated with a Customer (`onDelete: Cascade`). Has a status field (`ACTIVE`, `ABANDONED`, `CONVERTED`). Deleting a customer cascade-deletes their carts.
- **CartItem**: Linked to `Cart` (`onDelete: Cascade`) and restricted references to `Product` (`onDelete: Restrict`) and `ProductVariant` (`onDelete: Restrict`). Prevents deleting catalog items if they are currently in any user's cart.

## API Endpoints
### Customers
* `POST /api/customers` - Create customer
* `GET /api/customers/:id` - Get customer detail

### Carts
* `POST /api/carts` - Create or retrieve customer's ACTIVE cart
* `GET /api/carts/:cartId` - Get cart metadata, resolved items, totals, and stock availability
* `POST /api/carts/:cartId/items` - Add product/variant to cart (or merge quantity)
* `PATCH /api/carts/:cartId/items/:itemId` - Update item quantity
* `DELETE /api/carts/:cartId/items/:itemId` - Remove item from cart

## Pricing Strategy
- Catalog prices are the absolute source of truth. The backend does not trust any price sent by the client.
- When an item is queried:
  - If a variant is selected and contains a custom non-null price, use `ProductVariant.price`.
  - Otherwise, fall back to the base `Product.price`.
- Calculated dynamically at retrieval:
  - `unitPrice * quantity = lineTotal`
  - `sum(lineTotal) = subtotal`
  - Computed using precise decimal operations (`decimal.js` mapped to Prisma Decimal) to avoid floating-point loss.

## Inventory Strategy
- Carts validate current stock availability but **do not reserve inventory** or decrement catalog stock quantities.
- Reservations and inventory decrement transactions are reserved for the future Order phase.
- Active validations include:
  - If a variant is selected, validate quantity against `ProductVariant.stock`.
  - Otherwise, validate against base `Product.stock`.
  - Quantity merges (adding existing item again) check stock for the *combined* quantity.

## Validation & Error Handling
- Validates all incoming ID parameters (`customerId`, `cartId`, `productId`, `variantId`, `itemId`) as valid UUID strings before querying.
- Rejects invalid formats immediately with `400 Bad Request`.
- Returns controlled error payloads:
  - `400`: invalid quantity format, negative values, decimals, or mismatched variants.
  - `404`: customer, product, variant, cart, or item not found.
  - `409`: inactive customer/product/variant, duplicate email conflict, or insufficient stock.

## Key Engineering Decisions
- **Restrictive Referentials**: Block product/variant deletions if currently referenced in active carts to maintain data referential integrity.
- **Service-Level Duplicate Handling**: Explicitly merge item quantities for base products and variant products to bypass nullable column indexing constraints.
- **Derivation on Retrieval**: Recalculate totals dynamically on GET requests to ensure pricing updates reflect immediately without database staling.

## Verification
- Verified build and database validations pass.
- Verified cart creation returns the same active cart on repeated requests (idempotence).
- Tested item addition, duplicate item merging, quantity updates, stock checks, and removal.
- Checked validation blocks for malformed UUIDs, negative values, and out-of-stock items.

## Problems Encountered
No significant implementation issue recorded in this phase.

## Phase Status
COMPLETED
