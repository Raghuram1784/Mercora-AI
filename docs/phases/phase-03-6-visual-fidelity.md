# Phase 3.6: Visual Fidelity & Product Media Overhaul

## Objective
To bring the Mercora interface to exact visual parity with the approved design mockup, resolving product-image mismatches, adding product detail gallery carousels, implementing the exact color/gradient system, and aligning layout proportions.

## Root Causes
1. **Independent Curation**: Product names and stock images were curated in isolation rather than mapping object definitions together, leading to mismatches (e.g. desk mats showing computer setups, accessories cables showing headphones).
2. **Schema Limitation**: Storing only a single `imageUrl` prevented rendering detailed gallery thumbnails.
3. **Implicit Design Specification**: Design tokens (specific HSL colors, layered gradients, and glass values) were not fully defined, causing a flat black background appearance.

## Product Data Redesign
Replaced all 40 demo products with generic demo names (e.g., `Auralite X5 ANC Headphones`, `PulseBuds Pro TWS`, `VoltCore 20K Power Bank`, `CanvasPad XL Desk Mat`, `NoteSlate 15 Writing Tablet`) while keeping their database composite slugs (`merchantId` + `slug`) intact. This preserves existing database row IDs and protects `CartItem` foreign-key relationships.

## Image Curation Strategy
- Visually checked every Unsplash direct image URL beforehand to confirm the visible object matches the name and category exactly.
- Assured that all generic stock photo items look visually consistent and represent realistic products.

## Product Gallery Architecture
- Added `galleryImages String[] @default([])` to the `Product` model in `schema.prisma`.
- Re-generated the Prisma Client and executed database migration `add_product_gallery_images`.
- Stored 3 additional matching gallery URLs per product inside `galleryImages`.
- Excluded `galleryImages` from the catalog list query `GET /api/products` using Prisma `select` options to keep response payloads lean.
- Returned the full `galleryImages` on detailed lookups `GET /api/products/:id`.

## Color System
Defined the exact color palette in `:root` and `@theme` definitions within `index.css`:
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

## Gradient System
Implemented the required background gradient:
```css
background:
  radial-gradient(circle at 18% 12%, rgba(139, 92, 246, 0.20), transparent 30%),
  radial-gradient(circle at 78% 18%, rgba(79, 70, 229, 0.15), transparent 28%),
  radial-gradient(circle at 85% 78%, rgba(79, 124, 255, 0.08), transparent 32%),
  linear-gradient(135deg, #07060c 0%, #0b0814 48%, #06070d 100%);
```
Added three pointers-events-none decorative glowing spots for deep background lighting.

## Layout Changes
- **Content Container Width**: Centered container with `max-width: 1360px` with responsive horizontal padding.
- **Header**: Styled as sticky glass, height ~70px. Integrates a wide desktop search input.
- **Shop Page Grid**: Renders up to 4 columns on very wide screens (`2xl`), 3 columns on desktop, 2 on tablet, and 1-2 on mobile.
- **Category Pills**: Selected pills show a violet gradient surface with white text, and unselected show a dark glass border.
- **Filter Panel**: Styled as a true glass panel with soft borders and drop-down selectors.
- **Product Cards**: Photography occupies 45%-55% height using `object-contain` on a dark elevated background. Price label is changed from "Authoritative Price" to "Price".
- **Product Details Page**: Formatted into a responsive split Stage / Info panel:
  - `< 768px`: 1 column stack.
  - `768px to 1199px`: 1 column stack (avoiding layout clipping).
  - `1200px to 1439px`: approximately 42% image / 58% content using `minmax(360px, 0.85fr) minmax(0, 1.15fr)`.
  - `>= 1440px`: approximately 46% image / 54% content using `minmax(400px, 0.92fr) minmax(0, 1.08fr)`.
  - Left: Premium stage (containment max-height: 500px, image max-height: 380px) with product centered inside and surrounding breathing space. Compact thumbnails row (68px).
  - Right: Brand, name, rating star, simple price tag, overview, variant choices (1-2 columns grid), and quantity mutators.
  - Actions: Qty control (fixed 128px width) and Add to Cart button (flex-1) aligned side-by-side (sm+) or stacked on mobile.
  - Features: Rendered below both columns as card panels with custom icons.

## Cart Drawer
Proportioned to 420px-460px width. Displays item row thumbnails, subtotals, and a disabled checkout button labeled "Checkout (Coming Soon)".

## Verification
- Verified build compiles with zero errors (`npm run build` exited with code 0).
- Seeding runs idempotently. Row counts are verified and stable:
  - Merchant Count: `1`
  - Product Count: `40`
  - ProductVariant Count: `67`
  - Customer Count: `1`

## Actual Problems Encountered
None. Rebuilding the Prisma Client using `npx prisma generate` was required after adding the schema column so the seed client types compile successfully.

## Status
READY
