# Phase 3: Customer Shopping Frontend

## Objective
Build a complete customer-facing React shopping interface mapped to backend catalog and cart endpoints. Customers must be able to search/filter the catalog, view detailed specs/variants, and perform cart additions, quantity updates, and removals dynamically.

## Implemented
- Installed `react-router-dom` and configured front-end routing (`/` for catalog, `/products/:productId` for detail page).
- Integrated `CartProvider` and custom `ToastProvider` to coordinate shared shopping cart state and user notifications.
- Created debounced search fields, filter widgets, product grids, spec detail templates, and variant selectors.
- Built a sliding cart drawer containing quantity controls, line totals, dynamic subtotals, and stock alert indicators.

## Frontend Architecture
```text
Customer
   ↓
React UI (Vite + TS)
   ↓
Product Service / Cart Service
   ↓
Express REST APIs (CORS Enabled)
   ↓
Commerce Services (Active validation)
   ↓
Prisma Client
   ↓
PostgreSQL Database
```

## Pages
- **`ShopPage`**: Renders catalog page title, search bar, side filters panel, and product catalog grid.
- **`ProductPage`**: Renders detailed view including spec tables, image fail placeholders, variants list, and quantity inputs.

## Components
- **ui/**: `badge`, `button`, `card`, `input`, `select`, `sheet`, `skeleton`, `separator`, `alert`.
- **layout/**: `header` (responsive menu + cart item badge count).
- **products/**: `product-card` (quick add + details navigation), `product-grid` (loader skeletons + empty state), `product-filters` (category/brand/maxPrice bounds selectors), `product-search` (300ms input debounce), `variant-selector` (custom variant prices and stock checks).
- **cart/**: `cart-drawer` (sliding item summary list), `cart-item` (quantity plus/minus controls and removal buttons).

## API Integration
Consumed backend endpoints:
- `GET /api/products` (retrieves filtered product grid)
- `GET /api/products/:id` (retrieves detail product specs and variants)
- `POST /api/carts` (fetches active cart for the demo customer)
- `GET /api/carts/:cartId` (retrieves full cart line items, pricing fallbacks, and stock availability)
- `POST /api/carts/:cartId/items` (creates/merges cart item quantities)
- `PATCH /api/carts/:cartId/items/:itemId` (mutates cart item quantity)
- `DELETE /api/carts/:cartId/items/:itemId` (removes cart item)

## Cart State Strategy
- Managed through a lightweight React `CartProvider` and `useCart()` custom hook.
- The backend remains the canonical source of truth:
  - The frontend never calculates totals or decides prices.
  - Cart modifications (add, update, delete) fetch the latest resolved cart payload from the server and replace the provider state to ensure price fallbacks and subtotal derivations are always authoritative.

## Loading and Error Handling
- Renders skeleton cards during list fetches to avoid layout jumps.
- Disables add-to-cart or quantity buttons while request operations are pending.
- Catches API errors (e.g. `INSUFFICIENT_STOCK`) and normalizes messages into clean toast notification overlays.

## Responsive Design
- Grids layout: 1 column on mobile, 2 columns on tablet, 3-4 columns on desktop.
- Responsive search fields and side-drawer slide outs fit mobile interfaces cleanly.
- Mobile filters toggle panel opens dynamically on small screens.

## Key Engineering Decisions
- **Custom Toasts & Sheets**: Wrote clean, lightweight drawer sheet and toast notification contexts in React. This keeps dependencies minimal, simplifies typing, and prevents build errors.
- **Vite client typings**: Configured `vite-env.d.ts` reference to resolve `import.meta.env` typing structures correctly.
- **Indian Standard Currency Layout**: Dropped decimal zeroes for clean price representations (e.g., `₹2,699` instead of `₹2,699.00`) on catalog grids while retaining decimals for itemized lines and subtotals (`₹5,194.00`).

## Verification
- Verified build builds successfully (`npm run build` exits with code 0).
- Ran automated browser testing traversing product searches, headphones filtering, details page variants loading, cart drawers additions/removes, and page reload persistence.
- Confirmed database stock remains unchanged after cart additions.

## Problems Encountered
- TypeScript did not resolve `ImportMeta.env` initially. Resolved by creating `src/vite-env.d.ts` with triple-slash references to Vite client typings.

## Phase Status
COMPLETED
