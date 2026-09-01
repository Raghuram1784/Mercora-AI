# Product Media Curation Rebuild

This document outlines the objectives, strategies, naming conventions, and verification steps implemented during the category-based visual curation phase.

## Objective
To resolve historical catalog visual noise (unrelated, repeated, or wrong-category product images) by resetting all image assignments, renaming all products to generic demo-store titles, mapping exact visual stock photos from Unsplash, and standardizing category classifications.

## Media Reset Strategy
Rather than patching existing image URLs (which contained hidden duplicates and mismatched references), all product image configurations were discarded. 
Every product has been rebuilt to reference:
1. **1 Primary Image** (clearly showing the physical object described).
2. **Exactly 2 Gallery Images** (representing alternative angles or close-ups of the same product design concept).

## Final Product Names

### Headphones (7 items)
- Wireless Headphones
- Noise Cancelling Headphones
- Over-Ear Headphones
- Bluetooth Headphones
- Studio Headphones
- Travel Headphones
- Gaming Headphones

### Earbuds (7 items)
- Wireless Earbuds
- Noise Cancelling Earbuds
- Bluetooth Earbuds
- Sport Earbuds
- Compact Earbuds
- Premium Earbuds
- Everyday Earbuds

### Smartwatches (7 items)
- Smartwatch
- AMOLED Smartwatch
- Fitness Smartwatch
- GPS Smartwatch
- Sport Smartwatch
- Health Smartwatch
- Premium Smartwatch

### Speakers (6 items)
- Bluetooth Speaker
- Portable Speaker
- Mini Speaker
- Wireless Speaker
- Outdoor Speaker
- Bass Speaker

### Power Banks (6 items)
- 10000mAh Power Bank
- 20000mAh Power Bank
- Fast Charging Power Bank
- Slim Power Bank
- Compact Power Bank
- USB-C Power Bank

### Accessories (7 items)
- USB-C Cable
- USB-C Hub
- 65W Wall Charger
- Desk Mat
- Wireless Mouse
- Compact Keyboard
- Laptop Stand

## Category Distribution
To meet the required distribution without deleting existing database records or causing orphaned reference keys, the product with slug `mivi-roam-2` (formerly `StereoCast Bookshelf Speaker` under `Speakers`) was repurposed to `Laptop Stand` under the `Accessories` category.

This achieves the exact target distribution:
- Headphones: 7
- Earbuds: 7
- Smartwatches: 7
- Speakers: 6
- Power Banks: 6
- Accessories: 7
- **Total: 40**

## Image Search Strategy
Every image URL assigned in the database was selected using strict query terms for simple physical objects (e.g. `desk mat`, `USB-C hub`, `smartwatch`, `wireless earbuds case`) and manually verified via visual inspection. No image reference is inferred from metadata, search queries, or generic landscape text. All URLs point to direct public HTTPS Unsplash paths.

## Gallery Strategy
Every single product in the catalog now contains exactly three images (1 primary and 2 gallery references). The gallery images show visually consistent configurations, color schemes, or alternate views of the same product type to ensure continuity on the detail pages.

## Database Preservation
The database seeding uses the composite unique constraint `merchantId_slug` inside Prisma `upsert` queries. 
- All original product IDs and slugs were preserved.
- Existing database relationships (e.g. `ProductVariant`, `CartItem`, `Customer`) remain fully valid.
- No duplicate records were generated.

## Verification

### 1. Database Integrity Check
Executing `npx prisma db seed` multiple times successfully preserves a count of exactly 40 products and 67 variants:
```bash
Seeding started...
Merchant seeded: Mercora Demo Store (dff84754-4d16-40e8-838d-a1b8fa85904d)
Successfully seeded 40 products and 67 variants.
```

### 2. Category Distribution Counts
```sql
SELECT category, COUNT(*) FROM "Product" GROUP BY category ORDER BY category;
```
Result:
- Accessories: 7
- Earbuds: 7
- Headphones: 7
- Power Banks: 6
- Smartwatches: 7
- Speakers: 6
- **Total: 40**

### 3. Media Allocations
Every product contains exactly 1 primary image and 2 gallery images.

## Remaining Issues
None. All 40 products successfully map to visually verified, category-correct assets.

## Status
PRODUCT MEDIA RESET STATUS: READY
