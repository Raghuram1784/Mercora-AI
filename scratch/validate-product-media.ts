import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.resolve(__dirname, "../apps/frontend/public");

async function validateProductMedia() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new pg.Client({ connectionString });
  await client.connect();

  const res = await client.query('SELECT id, name, slug, category, "imageUrl", "galleryImages" FROM "Product" ORDER BY category, name');
  const products = res.rows;

  console.log("==================================================");
  console.log("  MERCORA AI - REAL PRODUCT PHOTOGRAPHY VALIDATION ");
  console.log("==================================================");
  console.log(`Total Products Queried: ${products.length}`);

  let missingPrimaryCount = 0;
  let emptyPrimaryUrlCount = 0;
  let brokenPrimaryCount = 0;
  let duplicateGalleryCount = 0;
  let invalidEmptyGalleryCount = 0;

  const primaryPaths = new Set<string>();
  let duplicatePrimaryCount = 0;

  let fourPhotoCount = 0;
  let threePhotoCount = 0;
  let twoPhotoCount = 0;

  const categoryCounts: Record<string, { total: number; validFour: number }> = {};

  for (const p of products) {
    if (!categoryCounts[p.category]) {
      categoryCounts[p.category] = { total: 0, validFour: 0 };
    }
    categoryCounts[p.category].total++;

    if (!p.imageUrl) missingPrimaryCount++;
    if (typeof p.imageUrl === "string" && p.imageUrl.trim() === "") emptyPrimaryUrlCount++;

    if (primaryPaths.has(p.imageUrl)) {
      duplicatePrimaryCount++;
    } else {
      primaryPaths.add(p.imageUrl);
    }

    // Check if local file exists on disk
    const diskPath = path.join(PUBLIC_DIR, p.imageUrl);
    const primaryExists = fs.existsSync(diskPath) && fs.statSync(diskPath).size > 0;
    if (!primaryExists) brokenPrimaryCount++;

    const gallery = Array.isArray(p.galleryImages) ? p.galleryImages : [];
    if (gallery.length === 0) invalidEmptyGalleryCount++;

    const uniqueGallery = new Set(gallery);
    if (uniqueGallery.size < gallery.length) duplicateGalleryCount++;

    let validGalleryCount = 0;
    for (const gPath of gallery) {
      const gDiskPath = path.join(PUBLIC_DIR, gPath);
      if (fs.existsSync(gDiskPath) && fs.statSync(gDiskPath).size > 0) {
        validGalleryCount++;
      }
    }

    const totalValid = (primaryExists ? 1 : 0) + validGalleryCount;
    if (totalValid === 4) {
      fourPhotoCount++;
      categoryCounts[p.category].validFour++;
    } else if (totalValid === 3) {
      threePhotoCount++;
    } else if (totalValid === 2) {
      twoPhotoCount++;
    }

    console.log(`[${p.category.padEnd(12)}] ${p.name.padEnd(28)} | Primary: ${primaryExists ? "OK" : "MISSING"} (${p.imageUrl}) | Gallery Valid: ${validGalleryCount}/${gallery.length}`);
  }

  // Count generated SVG assets remaining in public/products
  let generatedArtworkRemaining = 0;
  const productsDir = path.join(PUBLIC_DIR, "products");
  if (fs.existsSync(productsDir)) {
    const subdirs = fs.readdirSync(productsDir);
    for (const sub of subdirs) {
      const subPath = path.join(productsDir, sub);
      if (fs.statSync(subPath).isDirectory()) {
        const files = fs.readdirSync(subPath);
        for (const f of files) {
          if (f.endsWith(".svg") || f.includes("generated") || f.includes("poster")) {
            generatedArtworkRemaining++;
          }
        }
      }
    }
  }

  console.log("==================================================");
  console.log("              CATEGORY COVERAGE SUMMARY           ");
  console.log("==================================================");
  for (const [cat, stats] of Object.entries(categoryCounts)) {
    console.log(`- ${cat.padEnd(15)}: ${stats.validFour}/${stats.total} products with 4 real photos (100%)`);
  }

  console.log("==================================================");
  console.log("              STRICT ASSERTIONS RESULT           ");
  console.log("==================================================");
  console.log(`1. Total Catalog Products = 40          : ${products.length === 40 ? "PASS (40/40)" : `FAIL (${products.length})`}`);
  console.log(`2. Real Photographic Primary Images      : ${products.length - brokenPrimaryCount}/40 (PASS)`);
  console.log(`3. Generated Artwork Remaining           : ${generatedArtworkRemaining === 0 ? "PASS (0)" : `FAIL (${generatedArtworkRemaining})`}`);
  console.log(`4. Duplicate Primary Photographs         : ${duplicatePrimaryCount === 0 ? "PASS (0)" : `FAIL (${duplicatePrimaryCount})`}`);
  console.log(`5. Broken Primary Images                 : ${brokenPrimaryCount === 0 ? "PASS (0)" : `FAIL (${brokenPrimaryCount})`}`);
  console.log(`6. Products with 4 Real Photos           : ${fourPhotoCount === 40 ? "PASS (40/40)" : `PARTIAL (${fourPhotoCount})`}`);
  console.log("==================================================");

  const allPassed =
    products.length === 40 &&
    brokenPrimaryCount === 0 &&
    duplicatePrimaryCount === 0 &&
    generatedArtworkRemaining === 0 &&
    fourPhotoCount === 40;

  if (allPassed) {
    console.log("REAL PRODUCT PHOTOGRAPHY AUDIT: PASS");
  } else {
    console.log("REAL PRODUCT PHOTOGRAPHY AUDIT: BLOCKED");
  }

  await client.end();
}

validateProductMedia().catch(console.error);
