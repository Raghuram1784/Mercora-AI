import "dotenv/config";
import pg from "pg";
import { VERIFIED_REAL_PRODUCT_SPECS } from "./download-real-product-photos.js";

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new pg.Client({ connectionString });
  await client.connect();

  console.log("==================================================");
  console.log("  UPDATING NEON DB WITH LOCAL PRODUCT PHOTOGRAPHY ");
  console.log("==================================================");

  let updatedCount = 0;

  for (const item of VERIFIED_REAL_PRODUCT_SPECS) {
    const primaryLocalPath = `/products/${item.slug}/01.jpg`;
    const galleryLocalPaths = [
      `/products/${item.slug}/02.jpg`,
      `/products/${item.slug}/03.jpg`,
      `/products/${item.slug}/04.jpg`
    ];

    const res = await client.query(
      'UPDATE "Product" SET "imageUrl" = $1, "galleryImages" = $2 WHERE slug = $3 RETURNING id, name',
      [primaryLocalPath, galleryLocalPaths, item.slug]
    );

    if (res.rowCount && res.rowCount > 0) {
      updatedCount++;
      console.log(`[${item.category.padEnd(12)}] ${item.name.padEnd(28)} (${item.slug}) -> ${primaryLocalPath} + 3 gallery images`);
    } else {
      console.warn(`Product slug not found in DB: ${item.slug}`);
    }
  }

  console.log("==================================================");
  console.log(`Successfully updated ${updatedCount}/${VERIFIED_REAL_PRODUCT_SPECS.length} products in Neon database.`);

  await client.end();
}

main().catch(console.error);
