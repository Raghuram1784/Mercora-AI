import "dotenv/config";
import pg from "pg";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  imageUrl: string;
  galleryImages: string[];
}

async function checkUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) return true;
    
    // Retry GET
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), 3000);
    const res2 = await fetch(url, { method: "GET", signal: controller2.signal });
    clearTimeout(timer2);
    return res2.ok;
  } catch {
    return false;
  }
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new pg.Client({ connectionString });
  await client.connect();

  const res = await client.query('SELECT id, name, slug, brand, category, "imageUrl", "galleryImages" FROM "Product" ORDER BY category, name');
  const products: ProductRow[] = res.rows;

  console.log(`Total Products in Database: ${products.length}`);
  console.log("--------------------------------------------------");

  const results = await Promise.all(
    products.map(async (p) => {
      const gallery = Array.isArray(p.galleryImages) ? p.galleryImages : [];
      const primaryOk = await checkUrl(p.imageUrl);
      
      const galleryChecks = await Promise.all(gallery.map(g => checkUrl(g)));
      const validGalleryCount = galleryChecks.filter(Boolean).length;
      
      const uniqueGallery = new Set(gallery);
      const hasDups = uniqueGallery.size < gallery.length;

      return {
        name: p.name,
        slug: p.slug,
        category: p.category,
        imageUrl: p.imageUrl,
        primaryOk,
        galleryCount: gallery.length,
        validGalleryCount,
        hasDups,
        totalValid: (primaryOk ? 1 : 0) + validGalleryCount
      };
    })
  );

  let missingPrimary = 0;
  let brokenPrimary = 0;
  let emptyGallery = 0;
  let duplicateGallery = 0;

  for (const r of results) {
    if (!r.imageUrl) missingPrimary++;
    if (!r.primaryOk) brokenPrimary++;
    if (r.galleryCount === 0) emptyGallery++;
    if (r.hasDups) duplicateGallery++;

    console.log(`[${r.category}] ${r.name} | Primary OK: ${r.primaryOk ? "✓" : "❌"} | Gallery Valid: ${r.validGalleryCount}/${r.galleryCount} | Dups: ${r.hasDups ? "YES" : "NO"} | Total Valid: ${r.totalValid}`);
  }

  console.log("--------------------------------------------------");
  console.log(`Summary: Total=${products.length} | Missing Primary=${missingPrimary} | Broken Primary=${brokenPrimary} | Empty Gallery=${emptyGallery} | Duplicate Gallery=${duplicateGallery}`);

  await client.end();
}

main().catch(console.error);
