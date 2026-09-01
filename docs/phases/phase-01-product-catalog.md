# Phase 1: Merchant & Product Catalog

## Objective
Establish the foundational merchant and product catalog system, supporting merchants, products, and active variants with REST APIs for catalog queries.

## Implemented
- Created Prisma models for `Merchant`, `Product`, and `ProductVariant`.
- Injected database-level CHECK constraints for prices, ratings, and stock limits in the PostgreSQL migration.
- Wrote an idempotent seeding script containing 1 demo merchant and 40 detailed products.
- Created thin controllers, validators, services, and routes for retrieving/filtering products.
- Implemented `GET /api/products` (query filtering, text search, and pagination) and `GET /api/products/:id` (product and variant detail).

## Database Design
- **Merchant**: Stores stores (`id`, `name`, `slug` unique, `active`, timestamps).
- **Product**: Stores items (`id`, `merchantId`, `name`, `slug`, `brand`, `category`, `price`, `currency`, `stock`, `rating`, `features` JSON, `imageUrl`, `active`, timestamps).
  - Relationship: belongs to a Merchant (onDelete Cascade).
  - Constraints: `@@unique([merchantId, slug])` composite unique key.
- **ProductVariant**: Stores specific configurations (`id`, `productId`, `name`, `sku` unique, `price` nullable, `stock`, `attributes` JSON, `active`, timestamps).
  - Relationship: belongs to a Product (onDelete Cascade).

## API Endpoints
- `GET /api/products`: Retrieve all active products with pagination, category, brand, min/max price, minimum rating, search text, and stock queries.
- `GET /api/products/:id`: Retrieve single active product details along with its merchant info and active variants.

## Key Engineering Decisions
- **PostgreSQL Relational Model**: Enforces strong data relations and constraints (foreign keys, uniques, indexes) directly at the database level.
- **Decimal for Monetary Values**: Uses PostgreSQL numeric/decimal type mapping to Prisma Decimal to eliminate float rounding errors.
- **JSON for Flexible Features**: Utilizes JSON/JSONB fields for unstructured product features and variant attributes.
- **Merchant-Scoped Product Slug**: Enforces `[merchantId, slug]` composite uniqueness so multiple merchants can host same-slug products later.
- **Prisma 7 Driver Adapter**: Connects using the standard pg driver adapter with database-level pooling.

## Verification
- Checked schema: `npx prisma validate` returns successfully.
- Database seeding: verified idempotence across repeated seed calls (`npx prisma db seed` doesn't create duplicate values).
- API integration: tested catalog filtering and bounds checks. Compilation builds pass cleanly.

## Problems Encountered
No significant implementation issue recorded in this phase.

## Phase Status
COMPLETED
