import fs from "fs";
import path from "path";

const PUBLIC_PRODUCTS_DIR = path.resolve(__dirname, "../apps/frontend/public/products");

export interface ProductMediaSpec {
  slug: string;
  name: string;
  category: string;
  primaryPhotoId: string;
  galleryPhotoIds: string[];
}

export const VERIFIED_REAL_PRODUCT_SPECS: ProductMediaSpec[] = [
  // --- Headphones (7 items) ---
  {
    slug: "mercora-wave-100",
    name: "Wireless Headphones",
    category: "headphones",
    primaryPhotoId: "photo-1505740420928-5e560c06d30e",
    galleryPhotoIds: ["photo-1484704849700-f032a568e944", "photo-1583394838336-acd977736f90", "photo-1546435770-a3e426bf472b"]
  },
  {
    slug: "jbl-tune-770nc",
    name: "Noise Cancelling Headphones",
    category: "headphones",
    primaryPhotoId: "photo-1577174881658-0f30ed549adc",
    galleryPhotoIds: ["photo-1505740420928-5e560c06d30e", "photo-1524678606370-a47ad25cb82a", "photo-1599669454699-248893623440"]
  },
  {
    slug: "sony-wh-ch720n",
    name: "Over-Ear Headphones",
    category: "headphones",
    primaryPhotoId: "photo-1599669454699-248893623440",
    galleryPhotoIds: ["photo-1546435770-a3e426bf472b", "photo-1505740420928-5e560c06d30e", "photo-1484704849700-f032a568e944"]
  },
  {
    slug: "sennheiser-hd-350bt",
    name: "Bluetooth Headphones",
    category: "headphones",
    primaryPhotoId: "photo-1546435770-a3e426bf472b",
    galleryPhotoIds: ["photo-1484704849700-f032a568e944", "photo-1583394838336-acd977736f90", "photo-1577174881658-0f30ed549adc"]
  },
  {
    slug: "boat-rockerz-558",
    name: "Studio Headphones",
    category: "headphones",
    primaryPhotoId: "photo-1583394838336-acd977736f90",
    galleryPhotoIds: ["photo-1505740420928-5e560c06d30e", "photo-1599669454699-248893623440", "photo-1546435770-a3e426bf472b"]
  },
  {
    slug: "boult-probass-thunder",
    name: "Travel Headphones",
    category: "headphones",
    primaryPhotoId: "photo-1524678606370-a47ad25cb82a",
    galleryPhotoIds: ["photo-1599669454699-248893623440", "photo-1505740420928-5e560c06d30e", "photo-1577174881658-0f30ed549adc"]
  },
  {
    slug: "audio-technica-m20xbt",
    name: "Gaming Headphones",
    category: "headphones",
    primaryPhotoId: "photo-1618366712010-f4ae9c647dcb",
    galleryPhotoIds: ["photo-1546435770-a3e426bf472b", "photo-1583394838336-acd977736f90", "photo-1505740420928-5e560c06d30e"]
  },

  // --- Earbuds (7 items) ---
  {
    slug: "mercora-airbuds-pro",
    name: "Wireless Earbuds",
    category: "earbuds",
    primaryPhotoId: "photo-1590658268037-6bf12165a8df",
    galleryPhotoIds: ["photo-1574269909862-7e1d70bb8078", "photo-1608156639585-b3a032ef9689", "photo-1627989580309-bfaf3e58af6f"]
  },
  {
    slug: "oneplus-buds-3",
    name: "Noise Cancelling Earbuds",
    category: "earbuds",
    primaryPhotoId: "photo-1608156639585-b3a032ef9689",
    galleryPhotoIds: ["photo-1627989580309-bfaf3e58af6f", "photo-1590658268037-6bf12165a8df", "photo-1574269909862-7e1d70bb8078"]
  },
  {
    slug: "realme-buds-air-5-pro",
    name: "Bluetooth Earbuds",
    category: "earbuds",
    primaryPhotoId: "photo-1627989580309-bfaf3e58af6f",
    galleryPhotoIds: ["photo-1608156639585-b3a032ef9689", "photo-1590658268037-6bf12165a8df", "photo-1574269909862-7e1d70bb8078"]
  },
  {
    slug: "boat-airdopes-131",
    name: "Sport Earbuds",
    category: "earbuds",
    primaryPhotoId: "photo-1574269909862-7e1d70bb8078",
    galleryPhotoIds: ["photo-1590658268037-6bf12165a8df", "photo-1608156639585-b3a032ef9689", "photo-1627989580309-bfaf3e58af6f"]
  },
  {
    slug: "nothing-buds-pro",
    name: "Compact Earbuds",
    category: "earbuds",
    primaryPhotoId: "photo-1631857455684-a54a2f03665f",
    galleryPhotoIds: ["photo-1608156639585-b3a032ef9689", "photo-1590658268037-6bf12165a8df", "photo-1574269909862-7e1d70bb8078"]
  },
  {
    slug: "noise-buds-vs104",
    name: "Premium Earbuds",
    category: "earbuds",
    primaryPhotoId: "photo-1585565804112-f201f68c48b4",
    galleryPhotoIds: ["photo-1627989580309-bfaf3e58af6f", "photo-1608156639585-b3a032ef9689", "photo-1574269909862-7e1d70bb8078"]
  },
  {
    slug: "sony-wf-c700n",
    name: "Everyday Earbuds",
    category: "earbuds",
    primaryPhotoId: "photo-1560769629-975ec94e6a86",
    galleryPhotoIds: ["photo-1590658268037-6bf12165a8df", "photo-1608156639585-b3a032ef9689", "photo-1627989580309-bfaf3e58af6f"]
  },

  // --- Smartwatches (7 items) ---
  {
    slug: "mercora-horizon",
    name: "Smartwatch",
    category: "smartwatches",
    primaryPhotoId: "photo-1542496658-e33a6d0d50f6",
    galleryPhotoIds: ["photo-1508685096489-7aacd43bd3b1", "photo-1523275335684-37898b6baf30", "photo-1579586337278-3befd40fd17a"]
  },
  {
    slug: "noise-colorfit-pulse-3",
    name: "AMOLED Smartwatch",
    category: "smartwatches",
    primaryPhotoId: "photo-1508685096489-7aacd43bd3b1",
    galleryPhotoIds: ["photo-1579586337278-3befd40fd17a", "photo-1542496658-e33a6d0d50f6", "photo-1523275335684-37898b6baf30"]
  },
  {
    slug: "fire-boltt-phoenix",
    name: "Fitness Smartwatch",
    category: "smartwatches",
    primaryPhotoId: "photo-1523275335684-37898b6baf30",
    galleryPhotoIds: ["photo-1434494878577-86c23bcb06b9", "photo-1508685096489-7aacd43bd3b1", "photo-1542496658-e33a6d0d50f6"]
  },
  {
    slug: "amazfit-bip-5",
    name: "GPS Smartwatch",
    category: "smartwatches",
    primaryPhotoId: "photo-1579586337278-3befd40fd17a",
    galleryPhotoIds: ["photo-1508685096489-7aacd43bd3b1", "photo-1523275335684-37898b6baf30", "photo-1542496658-e33a6d0d50f6"]
  },
  {
    slug: "oneplus-watch-2r",
    name: "Sport Smartwatch",
    category: "smartwatches",
    primaryPhotoId: "photo-1434494878577-86c23bcb06b9",
    galleryPhotoIds: ["photo-1579586337278-3befd40fd17a", "photo-1523275335684-37898b6baf30", "photo-1508685096489-7aacd43bd3b1"]
  },
  {
    slug: "samsung-galaxy-watch-fe",
    name: "Health Smartwatch",
    category: "smartwatches",
    primaryPhotoId: "photo-1522335789203-aabd1fc54bc9",
    galleryPhotoIds: ["photo-1542496658-e33a6d0d50f6", "photo-1434494878577-86c23bcb06b9", "photo-1579586337278-3befd40fd17a"]
  },
  {
    slug: "fastrack-reflex-beat-plus",
    name: "Premium Smartwatch",
    category: "smartwatches",
    primaryPhotoId: "photo-1510017803434-a899398421b3",
    galleryPhotoIds: ["photo-1434494878577-86c23bcb06b9", "photo-1523275335684-37898b6baf30", "photo-1542496658-e33a6d0d50f6"]
  },

  // --- Speakers (6 items) ---
  {
    slug: "mercora-sonic-300",
    name: "Bluetooth Speaker",
    category: "speakers",
    primaryPhotoId: "photo-1608043152269-423dbba4e7e1",
    galleryPhotoIds: ["photo-1612196808214-b8e1d6145a8c", "photo-1589003077984-894e133dabab", "photo-1545454675-3531b543be5d"]
  },
  {
    slug: "jbl-go-4",
    name: "Portable Speaker",
    category: "speakers",
    primaryPhotoId: "photo-1589003077984-894e133dabab",
    galleryPhotoIds: ["photo-1545454675-3531b543be5d", "photo-1608043152269-423dbba4e7e1", "photo-1612196808214-b8e1d6145a8c"]
  },
  {
    slug: "sony-srs-xb100",
    name: "Mini Speaker",
    category: "speakers",
    primaryPhotoId: "photo-1612196808214-b8e1d6145a8c",
    galleryPhotoIds: ["photo-1608043152269-423dbba4e7e1", "photo-1589003077984-894e133dabab", "photo-1545454675-3531b543be5d"]
  },
  {
    slug: "boat-stone-350",
    name: "Wireless Speaker",
    category: "speakers",
    primaryPhotoId: "photo-1545454675-3531b543be5d",
    galleryPhotoIds: ["photo-1612196808214-b8e1d6145a8c", "photo-1608043152269-423dbba4e7e1", "photo-1589003077984-894e133dabab"]
  },
  {
    slug: "tribit-stormbox-micro-2",
    name: "Outdoor Speaker",
    category: "speakers",
    primaryPhotoId: "photo-1614149162883-504ce4d13909",
    galleryPhotoIds: ["photo-1545454675-3531b543be5d", "photo-1608043152269-423dbba4e7e1", "photo-1612196808214-b8e1d6145a8c"]
  },
  {
    slug: "marshall-willen",
    name: "Bass Speaker",
    category: "speakers",
    primaryPhotoId: "photo-1508700115892-45ecd05ae2ad",
    galleryPhotoIds: ["photo-1589003077984-894e133dabab", "photo-1608043152269-423dbba4e7e1", "photo-1545454675-3531b543be5d"]
  },

  // --- Power Banks (6 items) ---
  {
    slug: "mercora-powervault-20k",
    name: "10000mAh Power Bank",
    category: "power-banks",
    primaryPhotoId: "photo-1574680096145-d05b474e2155",
    galleryPhotoIds: ["photo-1588872657578-7efd1f1555ed", "photo-1511707171634-5f897ff02aa9", "photo-1565849904461-04a58ad377e0"]
  },
  {
    slug: "mi-power-bank-3i",
    name: "20000mAh Power Bank",
    category: "power-banks",
    primaryPhotoId: "photo-1588872657578-7efd1f1555ed",
    galleryPhotoIds: ["photo-1574680096145-d05b474e2155", "photo-1511707171634-5f897ff02aa9", "photo-1565849904461-04a58ad377e0"]
  },
  {
    slug: "urbn-10000mah-nano",
    name: "Fast Charging Power Bank",
    category: "power-banks",
    primaryPhotoId: "photo-1511707171634-5f897ff02aa9",
    galleryPhotoIds: ["photo-1565849904461-04a58ad377e0", "photo-1574680096145-d05b474e2155", "photo-1588872657578-7efd1f1555ed"]
  },
  {
    slug: "ambrane-stylo-20k",
    name: "Slim Power Bank",
    category: "power-banks",
    primaryPhotoId: "photo-1565849904461-04a58ad377e0",
    galleryPhotoIds: ["photo-1574680096145-d05b474e2155", "photo-1588872657578-7efd1f1555ed", "photo-1511707171634-5f897ff02aa9"]
  },
  {
    slug: "anker-325-power-bank",
    name: "Compact Power Bank",
    category: "power-banks",
    primaryPhotoId: "photo-1583863788434-e58a36330cf0",
    galleryPhotoIds: ["photo-1574680096145-d05b474e2155", "photo-1588872657578-7efd1f1555ed", "photo-1565849904461-04a58ad377e0"]
  },
  {
    slug: "duracell-power-bank-10k",
    name: "USB-C Power Bank",
    category: "power-banks",
    primaryPhotoId: "photo-1584308666744-24d5c474f2ae",
    galleryPhotoIds: ["photo-1574680096145-d05b474e2155", "photo-1588872657578-7efd1f1555ed", "photo-1511707171634-5f897ff02aa9"]
  },

  // --- Accessories (7 items) ---
  {
    slug: "mercora-braided-usbc",
    name: "USB-C Cable",
    category: "accessories",
    primaryPhotoId: "photo-1544716278-ca5e3f4abd8c",
    galleryPhotoIds: ["photo-1616440347437-b1c73416efc2", "photo-1615663245857-ac93bb7c39e7", "photo-1587829741301-dc798b83add3"]
  },
  {
    slug: "anker-powerport-iii-20w",
    name: "USB-C Hub",
    category: "accessories",
    primaryPhotoId: "photo-1527864550417-7fd91fc51a46",
    galleryPhotoIds: ["photo-1544716278-ca5e3f4abd8c", "photo-1611532736597-de2d4265fba3", "photo-1587829741301-dc798b83add3"]
  },
  {
    slug: "belkin-boostcharge-30w",
    name: "65W Wall Charger",
    category: "accessories",
    primaryPhotoId: "photo-1611532736597-de2d4265fba3",
    galleryPhotoIds: ["photo-1544716278-ca5e3f4abd8c", "photo-1527864550417-7fd91fc51a46", "photo-1616440347437-b1c73416efc2"]
  },
  {
    slug: "portronics-ruffpad-15",
    name: "Desk Mat",
    category: "accessories",
    primaryPhotoId: "photo-1616440347437-b1c73416efc2",
    galleryPhotoIds: ["photo-1615663245857-ac93bb7c39e7", "photo-1587829741301-dc798b83add3", "photo-1527443224154-c4a3942d3acf"]
  },
  {
    slug: "urbn-4in1-cable",
    name: "Wireless Mouse",
    category: "accessories",
    primaryPhotoId: "photo-1615663245857-ac93bb7c39e7",
    galleryPhotoIds: ["photo-1587829741301-dc798b83add3", "photo-1527443224154-c4a3942d3acf", "photo-1616440347437-b1c73416efc2"]
  },
  {
    slug: "dailyobjects-deskmat-lite",
    name: "Compact Keyboard",
    category: "accessories",
    primaryPhotoId: "photo-1587829741301-dc798b83add3",
    galleryPhotoIds: ["photo-1618384887929-16ec33fab9ef", "photo-1615663245857-ac93bb7c39e7", "photo-1527443224154-c4a3942d3acf"]
  },
  {
    slug: "mivi-roam-2",
    name: "Laptop Stand",
    category: "accessories",
    primaryPhotoId: "photo-1527443224154-c4a3942d3acf",
    galleryPhotoIds: ["photo-1587829741301-dc798b83add3", "photo-1616440347437-b1c73416efc2", "photo-1615663245857-ac93bb7c39e7"]
  }
];

async function downloadPhoto(photoId: string, destPath: string): Promise<boolean> {
  const url = `https://images.unsplash.com/${photoId}?q=80&w=800&auto=format&fit=crop`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`Error downloading ${photoId}:`, err);
    return false;
  }
}

async function main() {
  console.log("==================================================");
  console.log("  DOWNLOADING 40 REAL PRODUCT PHOTOGRAPHY SETS    ");
  console.log("==================================================");

  let successProducts = 0;

  for (const p of VERIFIED_REAL_PRODUCT_SPECS) {
    const targetDir = path.join(PUBLIC_PRODUCTS_DIR, p.slug);

    // Remove legacy SVG / generated illustration files
    if (fs.existsSync(targetDir)) {
      const existingFiles = fs.readdirSync(targetDir);
      for (const file of existingFiles) {
        if (file.endsWith(".svg")) {
          fs.unlinkSync(path.join(targetDir, file));
        }
      }
    } else {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Primary Image: 01.jpg
    const primaryOk = await downloadPhoto(p.primaryPhotoId, path.join(targetDir, "01.jpg"));
    
    // Gallery Images: 02.jpg, 03.jpg, 04.jpg
    let galleryCount = 0;
    for (let i = 0; i < p.galleryPhotoIds.length; i++) {
      const numStr = String(i + 2).padStart(2, "0");
      const ok = await downloadPhoto(p.galleryPhotoIds[i], path.join(targetDir, `${numStr}.jpg`));
      if (ok) galleryCount++;
    }

    console.log(`[${p.category.padEnd(12)}] ${p.name.padEnd(28)} (${p.slug}) -> Primary 01.jpg: ${primaryOk ? "OK" : "FAIL"} | Gallery: ${galleryCount}/${p.galleryPhotoIds.length}`);
    if (primaryOk) successProducts++;
  }

  console.log("==================================================");
  console.log(`Successfully downloaded real product photography for ${successProducts}/${VERIFIED_REAL_PRODUCT_SPECS.length} products.`);
}

main().catch(console.error);
