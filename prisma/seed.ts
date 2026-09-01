import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../apps/backend/src/generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required for seeding.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const merchantData = {
  name: "Mercora Demo Store",
  slug: "mercora-demo-store",
  description: "Official demo store showcasing high-quality audio, wearables, and power accessories.",
  active: true,
};

const productsData = [
  // --- Headphones (7 items) ---
  {
    name: "Wireless Headphones",
    slug: "mercora-wave-100",
    description: "Comfortable wireless over-ear headphones for music, calls and everyday listening.",
    brand: "Mercora",
    category: "Headphones",
    price: 4999.00,
    rating: 4.7,
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, wireless: true, bestFor: ["music", "travel", "work"] },
    variants: [
      { name: "Black Edition", sku: "MCR-WV100-BLK", price: null, stock: 80, attributes: { color: "Black" } },
      { name: "Platinum Silver", sku: "MCR-WV100-SLV", price: 5299.00, stock: 40, attributes: { color: "Silver" } },
    ],
  },
  {
    name: "Noise Cancelling Headphones",
    slug: "jbl-tune-770nc",
    description: "Over-ear headphones with advanced active noise cancellation and high-fidelity sound.",
    brand: "Mercora",
    category: "Headphones",
    price: 6499.00,
    rating: 4.5,
    stock: 85,
    imageUrl: "https://images.unsplash.com/photo-1577174881658-0f30ed549adc?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, wireless: true, bestFor: ["music", "travel", "work"] },
    variants: [
      { name: "Blue Variant", sku: "JBL-T770NC-BLU", price: null, stock: 50, attributes: { color: "Blue" } },
      { name: "Black Variant", sku: "JBL-T770NC-BLK", price: null, stock: 35, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Over-Ear Headphones",
    slug: "sony-wh-ch720n",
    description: "Lightweight over-ear headphones featuring comfortable cushions and premium audio drivers.",
    brand: "Mercora",
    category: "Headphones",
    price: 7990.00,
    rating: 4.6,
    stock: 90,
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1599669454699-248893623440?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, wireless: true, bestFor: ["music", "travel", "work"] },
    variants: [
      { name: "Black Sony", sku: "SNY-CH720N-BLK", price: null, stock: 60, attributes: { color: "Black" } },
      { name: "White Sony", sku: "SNY-CH720N-WHT", price: null, stock: 30, attributes: { color: "White" } },
    ],
  },
  {
    name: "Bluetooth Headphones",
    slug: "sennheiser-hd-350bt",
    description: "Wireless Bluetooth headphones with deep dynamic bass and long-lasting battery life.",
    brand: "Mercora",
    category: "Headphones",
    price: 5490.00,
    rating: 4.2,
    stock: 65,
    imageUrl: "https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, wireless: true, bestFor: ["music", "travel", "work"] },
    variants: [
      { name: "Default Black", sku: "SEN-HD350-BLK", price: null, stock: 65, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Studio Headphones",
    slug: "boat-rockerz-558",
    description: "Studio-grade headphones engineered for clear, high-resolution monitor audio and music production.",
    brand: "Mercora",
    category: "Headphones",
    price: 1999.00,
    rating: 4.1,
    stock: 250,
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, wireless: true, bestFor: ["music", "travel", "work"] },
    variants: [
      { name: "Army Green", sku: "BOAT-R558-GRN", price: null, stock: 150, attributes: { color: "Army Green" } },
      { name: "Knight Black", sku: "BOAT-R558-BLK", price: null, stock: 100, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Travel Headphones",
    slug: "boult-probass-thunder",
    description: "Foldable travel headphones with active noise cancellation and a compact protective headband.",
    brand: "Mercora",
    category: "Headphones",
    price: 1299.00,
    rating: 3.9,
    stock: 140,
    imageUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, wireless: true, bestFor: ["music", "travel", "work"] },
    variants: [
      { name: "Red Accent", sku: "BLT-PBTH-RED", price: null, stock: 70, attributes: { color: "Red/Black" } },
      { name: "Blue Accent", sku: "BLT-PBTH-BLU", price: null, stock: 70, attributes: { color: "Blue/Black" } },
    ],
  },
  {
    name: "Gaming Headphones",
    slug: "audio-technica-m20xbt",
    description: "Immersive gaming over-ear headphones with custom audio presets and a built-in microphone.",
    brand: "Mercora",
    category: "Headphones",
    price: 7490.00,
    rating: 4.4,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, wireless: true, bestFor: ["music", "travel", "work"] },
    variants: [
      { name: "Standard Edition", sku: "ATH-M20XBT-STD", price: null, stock: 45, attributes: { color: "Black" } },
    ],
  },

  // --- Earbuds (7 items) ---
  {
    name: "Wireless Earbuds",
    slug: "mercora-airbuds-pro",
    description: "True wireless earbuds featuring deep bass drivers and active transparency controls.",
    brand: "Mercora",
    category: "Earbuds",
    price: 3499.00,
    rating: 4.4,
    stock: 150,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 32, noiseCancellation: true, waterResistance: "IPX5", wireless: true, bestFor: ["calls", "commute", "fitness"] },
    variants: [
      { name: "Chalk White", sku: "MCR-ABP-WHT", price: null, stock: 90, attributes: { color: "White" } },
      { name: "Obsidian Black", sku: "MCR-ABP-BLK", price: null, stock: 60, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Noise Cancelling Earbuds",
    slug: "oneplus-buds-3",
    description: "Compact dual-driver wireless earbuds with high definition active noise cancellation.",
    brand: "Mercora",
    category: "Earbuds",
    price: 4999.00,
    rating: 4.6,
    stock: 110,
    imageUrl: "https://images.unsplash.com/photo-1585565804112-f201f68c48b4?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 44, noiseCancellation: true, waterResistance: "IP55", wireless: true, bestFor: ["calls", "commute", "fitness"] },
    variants: [
      { name: "Metallic Gray", sku: "OP-BUDS3-GRY", price: null, stock: 60, attributes: { color: "Gray" } },
      { name: "Splendid Blue", sku: "OP-BUDS3-BLU", price: null, stock: 50, attributes: { color: "Blue" } },
    ],
  },
  {
    name: "Bluetooth Earbuds",
    slug: "realme-buds-air-5-pro",
    description: "High-performance TWS earbuds inside a round pill-shaped white charging case.",
    brand: "Mercora",
    category: "Earbuds",
    price: 4499.00,
    rating: 4.5,
    stock: 130,
    imageUrl: "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1585565804112-f201f68c48b4?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 40, noiseCancellation: true, waterResistance: "IPX5", wireless: true, bestFor: ["calls", "commute", "fitness"] },
    variants: [
      { name: "Astral Black", sku: "RME-AIR5P-BLK", price: null, stock: 80, attributes: { color: "Black" } },
      { name: "Sunrise Beige", sku: "RME-AIR5P-BGE", price: null, stock: 50, attributes: { color: "Beige" } },
    ],
  },
  {
    name: "Sport Earbuds",
    slug: "boat-airdopes-131",
    description: "True wireless earbuds inside a vertical flip case with sweatproof design.",
    brand: "Mercora",
    category: "Earbuds",
    price: 999.00,
    rating: 3.8,
    stock: 500,
    imageUrl: "https://images.unsplash.com/photo-1644982695090-89e464c247f4?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1598331668826-20cecc5967f1?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 15, noiseCancellation: false, waterResistance: "IPX4", wireless: true, bestFor: ["calls", "commute", "fitness"] },
    variants: [
      { name: "Active Black", sku: "BOAT-AD131-BLK", price: null, stock: 250, attributes: { color: "Black" } },
      { name: "Cherry Blossom", sku: "BOAT-AD131-PNK", price: null, stock: 250, attributes: { color: "Pink" } },
    ],
  },
  {
    name: "Compact Earbuds",
    slug: "nothing-buds-pro",
    description: "Smart active noise cancellation earbuds in a compact charging cradle case.",
    brand: "Mercora",
    category: "Earbuds",
    price: 2999.00,
    rating: 4.3,
    stock: 140,
    imageUrl: "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1631857455684-a54a2f03665f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 39, noiseCancellation: true, waterResistance: "IP54", wireless: true, bestFor: ["calls", "commute", "fitness"] },
    variants: [
      { name: "Dark Grey", sku: "CMF-BDS-GRY", price: null, stock: 70, attributes: { color: "Grey" } },
      { name: "Fire Orange", sku: "CMF-BDS-ORG", price: 3199.00, stock: 70, attributes: { color: "Orange" } },
    ],
  },
  {
    name: "Premium Earbuds",
    slug: "noise-buds-vs104",
    description: "Ergonomic charging case buds featuring deep bass and rapid fast charge tech.",
    brand: "Mercora",
    category: "Earbuds",
    price: 1299.00,
    rating: 4.0,
    stock: 220,
    imageUrl: "https://images.unsplash.com/photo-1631857455684-a54a2f03665f?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1644982695090-89e464c247f4?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 45, noiseCancellation: false, waterResistance: "IPX5", wireless: true, bestFor: ["calls", "commute", "fitness"] },
    variants: [
      { name: "Snow White", sku: "NOI-BVS104-WHT", price: null, stock: 110, attributes: { color: "White" } },
      { name: "Charcoal Black", sku: "NOI-BVS104-BLK", price: null, stock: 110, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Everyday Earbuds",
    slug: "sony-wf-c700n",
    description: "Compact and lightweight true wireless earbuds in a matte charging box capsule.",
    brand: "Mercora",
    category: "Earbuds",
    price: 5990.00,
    rating: 4.4,
    stock: 75,
    imageUrl: "https://images.unsplash.com/photo-1598331668826-20cecc5967f1?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1585565804112-f201f68c48b4?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 15, noiseCancellation: true, waterResistance: "IPX4", wireless: true, bestFor: ["calls", "commute", "fitness"] },
    variants: [
      { name: "Sage Green", sku: "SNY-WFC700-GRN", price: null, stock: 35, attributes: { color: "Green" } },
      { name: "Classic Black", sku: "SNY-WFC700-BLK", price: null, stock: 40, attributes: { color: "Black" } },
    ],
  },

  // --- Smartwatches (7 items) ---
  {
    name: "Smartwatch",
    slug: "mercora-horizon",
    description: "Premium smartwatch with classic leather strap and high-resolution screen.",
    brand: "Mercora",
    category: "Smartwatches",
    price: 5999.00,
    rating: 4.5,
    stock: 70,
    imageUrl: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop"
    ],
    features: { display: "AMOLED", gps: true, waterResistance: "5ATM", batteryLifeDays: 7 },
    variants: [
      { name: "Steel Black", sku: "MCR-HRZ-STL", price: null, stock: 40, attributes: { color: "Steel Black" } },
      { name: "Gold Leather", sku: "MCR-HRZ-GLD", price: 6499.00, stock: 30, attributes: { color: "Gold/Brown" } },
    ],
  },
  {
    name: "AMOLED Smartwatch",
    slug: "noise-colorfit-pulse-3",
    description: "High brightness AMOLED display fitness tracker smartwatch with white band.",
    brand: "Mercora",
    category: "Smartwatches",
    price: 1799.00,
    rating: 4.0,
    stock: 200,
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop"
    ],
    features: { display: "AMOLED", gps: true, waterResistance: "5ATM", batteryLifeDays: 7 },
    variants: [
      { name: "Jet Black", sku: "NOI-CFP3-BLK", price: null, stock: 100, attributes: { color: "Black" } },
      { name: "Rose Pink", sku: "NOI-CFP3-PNK", price: null, stock: 100, attributes: { color: "Pink" } },
    ],
  },
  {
    name: "Fitness Smartwatch",
    slug: "fire-boltt-phoenix",
    description: "Classic round dial smartwatch with premium activity tracking and calling support.",
    brand: "Mercora",
    category: "Smartwatches",
    price: 1899.00,
    rating: 3.9,
    stock: 180,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop"
    ],
    features: { display: "AMOLED", gps: true, waterResistance: "5ATM", batteryLifeDays: 7 },
    variants: [
      { name: "Silver Grey", sku: "FB-PHX-SLV", price: null, stock: 90, attributes: { color: "Silver" } },
      { name: "Classic Black", sku: "FB-PHX-BLK", price: null, stock: 90, attributes: { color: "Black" } },
    ],
  },
  {
    name: "GPS Smartwatch",
    slug: "amazfit-bip-5",
    description: "Active lifestyle fitness tracking smartwatch with built-in GPS maps tracking.",
    brand: "Mercora",
    category: "Smartwatches",
    price: 6999.00,
    rating: 4.3,
    stock: 80,
    imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop"
    ],
    features: { display: "AMOLED", gps: true, waterResistance: "5ATM", batteryLifeDays: 7 },
    variants: [
      { name: "Soft Black", sku: "AMZ-BIP5-BLK", price: null, stock: 80, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Sport Smartwatch",
    slug: "oneplus-watch-2r",
    description: "High dynamic sports tracking watch dial with active workout metrics.",
    brand: "Mercora",
    category: "Smartwatches",
    price: 11999.00,
    rating: 4.7,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop"
    ],
    features: { display: "AMOLED", gps: true, waterResistance: "5ATM", batteryLifeDays: 7 },
    variants: [
      { name: "Forest Green", sku: "OP-W2R-GRN", price: null, stock: 25, attributes: { color: "Green" } },
      { name: "Gunmetal Grey", sku: "OP-W2R-GRY", price: null, stock: 25, attributes: { color: "Grey" } },
    ],
  },
  {
    name: "Health Smartwatch",
    slug: "samsung-galaxy-watch-fe",
    description: "Advanced health monitoring smartwatch with body index scanning capabilities.",
    brand: "Mercora",
    category: "Smartwatches",
    price: 9999.00,
    rating: 4.4,
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600&auto=format&fit=crop"
    ],
    features: { display: "AMOLED", gps: true, waterResistance: "5ATM", batteryLifeDays: 7 },
    variants: [
      { name: "Silver Metal", sku: "SSG-GWFE-SLV", price: null, stock: 30, attributes: { color: "Silver" } },
      { name: "Black Metal", sku: "SSG-GWFE-BLK", price: null, stock: 30, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Premium Smartwatch",
    slug: "fastrack-reflex-beat-plus",
    description: "Sleek fitness smart tracker dial with premium screen panel overlays.",
    brand: "Mercora",
    category: "Smartwatches",
    price: 1499.00,
    rating: 3.8,
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517502884422-41eaaced0168?q=80&w=600&auto=format&fit=crop"
    ],
    features: { display: "AMOLED", gps: true, waterResistance: "5ATM", batteryLifeDays: 7 },
    variants: [
      { name: "Midnight Navy", sku: "FT-RFB-NVY", price: null, stock: 120, attributes: { color: "Navy" } },
    ],
  },

  // --- Speakers (6 items) ---
  {
    name: "Bluetooth Speaker",
    slug: "mercora-sonic-300",
    description: "Rugged waterproof Bluetooth cylinder speaker with deep bass stereo output.",
    brand: "Mercora",
    category: "Speakers",
    price: 2999.00,
    rating: 4.4,
    stock: 100,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1601944179066-297b8cd4e32a?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 12, bluetooth: true, waterResistance: "IPX5" },
    variants: [
      { name: "Deep Charcoal", sku: "MCR-S300-BLK", price: null, stock: 60, attributes: { color: "Black" } },
      { name: "Forest Camo", sku: "MCR-S300-CAM", price: null, stock: 40, attributes: { color: "Camo" } },
    ],
  },
  {
    name: "Portable Speaker",
    slug: "jbl-go-4",
    description: "Ultra-portable travel block Bluetooth speaker with colorful fresh design controls.",
    brand: "Mercora",
    category: "Speakers",
    price: 3999.00,
    rating: 4.5,
    stock: 140,
    imageUrl: "https://images.unsplash.com/photo-1589003077984-894e133dabab?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 12, bluetooth: true, waterResistance: "IPX5" },
    variants: [
      { name: "Squad Edition", sku: "JBL-GO4-SQD", price: null, stock: 70, attributes: { color: "Squad Camo" } },
      { name: "Red Edition", sku: "JBL-GO4-RED", price: null, stock: 70, attributes: { color: "Red" } },
    ],
  },
  {
    name: "Mini Speaker",
    slug: "sony-srs-xb100",
    description: "Compact wireless cylinder speaker delivering powerful, clear surround sound.",
    brand: "Mercora",
    category: "Speakers",
    price: 4990.00,
    rating: 4.6,
    stock: 80,
    imageUrl: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601944179066-297b8cd4e32a?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 12, bluetooth: true, waterResistance: "IPX5" },
    variants: [
      { name: "Blue SRS", sku: "SNY-XB100-BLU", price: null, stock: 40, attributes: { color: "Blue" } },
      { name: "Orange SRS", sku: "SNY-XB100-ORG", price: null, stock: 40, attributes: { color: "Orange" } },
    ],
  },
  {
    name: "Wireless Speaker",
    slug: "boat-stone-350",
    description: "Wireless outdoor portable speaker with dynamic sound and water isolation layers.",
    brand: "Mercora",
    category: "Speakers",
    price: 1499.00,
    rating: 4.1,
    stock: 300,
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 12, bluetooth: true, waterResistance: "IPX5" },
    variants: [
      { name: "Active Black", sku: "BOAT-ST350-BLK", price: null, stock: 150, attributes: { color: "Black" } },
      { name: "Royal Blue", sku: "BOAT-ST350-BLU", price: null, stock: 150, attributes: { color: "Blue" } },
    ],
  },
  {
    name: "Outdoor Speaker",
    slug: "tribit-stormbox-micro-2",
    description: "Pocket-sized travel speaker with high-performance audio and elastic back strap.",
    brand: "Mercora",
    category: "Speakers",
    price: 5499.00,
    rating: 4.7,
    stock: 55,
    imageUrl: "https://images.unsplash.com/photo-1601944179066-297b8cd4e32a?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 12, bluetooth: true, waterResistance: "IPX5" },
    variants: [
      { name: "Black StormBox", sku: "TRB-SBM2-BLK", price: null, stock: 55, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Bass Speaker",
    slug: "marshall-willen",
    description: "Heavy-duty outdoor party speaker with signature vintage gold sound mesh look.",
    brand: "Mercora",
    category: "Speakers",
    price: 9999.00,
    rating: 4.8,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601944179066-297b8cd4e32a?q=80&w=600&auto=format&fit=crop"
    ],
    features: { batteryLifeHours: 12, bluetooth: true, waterResistance: "IPX5" },
    variants: [
      { name: "Black and Brass", sku: "MSH-WLN-BRS", price: null, stock: 20, attributes: { color: "Black/Brass" } },
      { name: "Cream Edition", sku: "MSH-WLN-CRM", price: 10499.00, stock: 10, attributes: { color: "Cream" } },
    ],
  },

  // --- Power Banks (6 items) ---
  {
    name: "10000mAh Power Bank",
    slug: "mercora-powervault-20k",
    description: "Compact 10000mAh external charger with fast-charging dual output support.",
    brand: "Mercora",
    category: "Power Banks",
    price: 1499.00,
    rating: 4.4,
    stock: 180,
    imageUrl: "https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1622445262465-2481c857312f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600&auto=format&fit=crop"
    ],
    features: { capacityMah: 10000, fastCharging: true, usbC: true },
    variants: [
      { name: "Standard Black", sku: "MCR-PV20K-BLK", price: null, stock: 100, attributes: { color: "Black" } },
      { name: "Dark Blue", sku: "MCR-PV20K-BLU", price: null, stock: 80, attributes: { color: "Blue" } },
    ],
  },
  {
    name: "20000mAh Power Bank",
    slug: "mi-power-bank-3i",
    description: "Ultra-compact backup power bank with sandblast aluminum body casing.",
    brand: "Mercora",
    category: "Power Banks",
    price: 2149.00,
    rating: 4.3,
    stock: 220,
    imageUrl: "https://images.unsplash.com/photo-1622445262465-2481c857312f?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1585338111114-412b6b25f388?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?q=80&w=600&auto=format&fit=crop"
    ],
    features: { capacityMah: 20000, fastCharging: true, usbC: true },
    variants: [
      { name: "Sandstone Black", sku: "XI-PB3I-BLK", price: null, stock: 220, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Fast Charging Power Bank",
    slug: "urbn-10000mah-nano",
    description: "Mini nano fast charging power bank with premium carbon cover and LED screen.",
    brand: "Mercora",
    category: "Power Banks",
    price: 999.00,
    rating: 4.2,
    stock: 140,
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1619472381419-74d1a4c000bb?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1622445262465-2481c857312f?q=80&w=600&auto=format&fit=crop"
    ],
    features: { capacityMah: 10000, fastCharging: true, usbC: true },
    variants: [
      { name: "Carbon Fiber", sku: "URB-N10-CRB", price: null, stock: 70, attributes: { color: "Carbon" } },
      { name: "Camo Green", sku: "URB-N10-CAM", price: null, stock: 70, attributes: { color: "Camo Green" } },
    ],
  },
  {
    name: "Slim Power Bank",
    slug: "ambrane-stylo-20k",
    description: "Slim high density backup battery bank with multi layer charging safety protection.",
    brand: "Mercora",
    category: "Power Banks",
    price: 1599.00,
    rating: 4.1,
    stock: 160,
    imageUrl: "https://images.unsplash.com/photo-1585338111114-412b6b25f388?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600&auto=format&fit=crop"
    ],
    features: { capacityMah: 20000, fastCharging: true, usbC: true },
    variants: [
      { name: "Stylo Blue", sku: "AMB-STY20-BLU", price: null, stock: 160, attributes: { color: "Blue" } },
    ],
  },
  {
    name: "Compact Power Bank",
    slug: "anker-325-power-bank",
    description: "Standard external backup battery power bank with double USB outputs.",
    brand: "Mercora",
    category: "Power Banks",
    price: 2999.00,
    rating: 4.6,
    stock: 90,
    imageUrl: "https://images.unsplash.com/photo-1619472381419-74d1a4c000bb?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1585338111114-412b6b25f388?q=80&w=600&auto=format&fit=crop"
    ],
    features: { capacityMah: 20000, fastCharging: true, usbC: true },
    variants: [
      { name: "Anker Standard", sku: "ANK-325-BLK", price: null, stock: 90, attributes: { color: "Black" } },
    ],
  },
  {
    name: "USB-C Power Bank",
    slug: "duracell-power-bank-10k",
    description: "Reliable dual port backup battery pack for charging devices on the go.",
    brand: "Mercora",
    category: "Power Banks",
    price: 1999.00,
    rating: 4.5,
    stock: 100,
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1619472381419-74d1a4c000bb?q=80&w=600&auto=format&fit=crop"
    ],
    features: { capacityMah: 10000, fastCharging: true, usbC: true },
    variants: [
      { name: "Copper Top", sku: "DRC-PB10-CPP", price: null, stock: 100, attributes: { color: "Copper/Black" } },
    ],
  },

  // --- Accessories (7 items) ---
  {
    name: "USB-C Cable",
    slug: "mercora-braided-usbc",
    description: "Heavy-duty coiled black nylon braided USB C fast charging cable supporting up to 100W PD.",
    brand: "Mercora",
    category: "Accessories",
    price: 499.00,
    rating: 4.6,
    stock: 350,
    imageUrl: "https://images.unsplash.com/photo-1589615369069-2f22b7a3cc20?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1592832122594-c0c6bad74837?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop"
    ],
    features: { cableLengthMeters: 2, maxWattage: 100, material: "Braided Nylon" },
    variants: [
      { name: "1-Pack Slate Grey (2m)", sku: "MCR-CBL100-GRY", price: null, stock: 200, attributes: { color: "Grey", quantity: 1 } },
      { name: "2-Pack Bundle (2m)", sku: "MCR-CBL100-2PK", price: 899.00, stock: 150, attributes: { color: "Grey", quantity: 2 } },
    ],
  },
  {
    name: "USB-C Hub",
    slug: "anker-powerport-iii-20w",
    description: "Compact multi-port USB-C hub designed to expand a laptop with additional connectivity.",
    brand: "Mercora",
    category: "Accessories",
    price: 1299.00,
    rating: 4.7,
    stock: 150,
    imageUrl: "https://images.unsplash.com/photo-1592832122594-c0c6bad74837?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop"
    ],
    features: { outputPowerWatts: 60, chargingPorts: 5, type: "USB Hub" },
    variants: [
      { name: "Silver 5-in-1 Hub", sku: "ANK-PP3-WHT", price: null, stock: 80, attributes: { color: "White" } },
      { name: "Space Grey 5-in-1 Hub", sku: "ANK-PP3-BLK", price: null, stock: 70, attributes: { color: "Black" } },
    ],
  },
  {
    name: "65W Wall Charger",
    slug: "belkin-boostcharge-30w",
    description: "Premium fast charge travel wall charger brick with safety surge protectors.",
    brand: "Mercora",
    category: "Accessories",
    price: 1999.00,
    rating: 4.4,
    stock: 90,
    imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1592832122594-c0c6bad74837?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=600&auto=format&fit=crop"
    ],
    features: { outputPowerWatts: 65, chargingPorts: 2, type: "Wall Adapter" },
    variants: [
      { name: "Standard White Brick", sku: "BEL-BC30-WHT", price: null, stock: 90, attributes: { color: "White" } },
    ],
  },
  {
    name: "Desk Mat",
    slug: "portronics-ruffpad-15",
    description: "Vegan leather non-slip water-resistant office workspace protective desk mat overlay.",
    brand: "Mercora",
    category: "Accessories",
    price: 899.00,
    rating: 4.1,
    stock: 160,
    imageUrl: "https://images.unsplash.com/photo-1632292224971-0d45778b3617?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616440347895-e63bfd59c6b7?q=80&w=600&auto=format&fit=crop"
    ],
    features: { sizeCms: "80x40", material: "Vegan Leather", waterResistant: true },
    variants: [
      { name: "Midnight Black Mat", sku: "POR-RP15-GRN", price: null, stock: 160, attributes: { color: "Black/Green" } },
    ],
  },
  {
    name: "Wireless Mouse",
    slug: "urbn-4in1-cable",
    description: "Sleek wireless computer mouse with high precision optical tracker tracking.",
    brand: "Mercora",
    category: "Accessories",
    price: 399.00,
    rating: 4.0,
    stock: 180,
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1625842268584-8f329044697c?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=600&auto=format&fit=crop"
    ],
    features: { connectionType: "Wireless", dpi: 1600, buttonsCount: 4 },
    variants: [
      { name: "Matte Black", sku: "URB-4IN1-STD", price: null, stock: 180, attributes: { color: "Black" } },
    ],
  },
  {
    name: "Compact Keyboard",
    slug: "dailyobjects-deskmat-lite",
    description: "Compact wireless keyboard with mechanical feel key switches and silent typing keys.",
    brand: "Mercora",
    category: "Accessories",
    price: 999.00,
    rating: 4.5,
    stock: 75,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1625842268584-8f329044697c?q=80&w=600&auto=format&fit=crop"
    ],
    features: { connectionType: "Bluetooth", keysCount: 84, backlit: true },
    variants: [
      { name: "Navy Blue Mat", sku: "DO-DML-NVY", price: null, stock: 40, attributes: { color: "Navy Blue" } },
      { name: "Tan Brown Mat", sku: "DO-DML-TAN", price: null, stock: 35, attributes: { color: "Tan Brown" } },
    ],
  },
  {
    name: "Laptop Stand",
    slug: "mivi-roam-2",
    description: "Ergonomic laptop stand constructed from solid premium grade brushed aluminum blocks.",
    brand: "Mercora",
    category: "Accessories",
    price: 1099.00,
    rating: 3.9,
    stock: 250,
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop",
    galleryImages: [
      "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop"
    ],
    features: { material: "Aluminum", adjustable: true, coolingVent: true },
    variants: [
      { name: "Space Grey Stand", sku: "MIV-R2-NVY", price: null, stock: 250, attributes: { color: "Space Grey" } },
    ],
  },
];

async function main() {
  console.log("Seeding started...");

  // Idempotent upsert of the merchant
  const merchant = await prisma.merchant.upsert({
    where: { slug: merchantData.slug },
    update: merchantData,
    create: merchantData,
  });

  console.log(`Merchant seeded: ${merchant.name} (${merchant.id})`);

  let productsCount = 0;
  let variantsCount = 0;

  const categoryIndexMap: Record<string, number> = {};

  for (const item of productsData) {
    const { variants, ...prodDetails } = item;

    const primaryImg = `/products/${prodDetails.slug}/01.jpg`;
    const galleryImgs = [
      `/products/${prodDetails.slug}/02.jpg`,
      `/products/${prodDetails.slug}/03.jpg`,
      `/products/${prodDetails.slug}/04.jpg`,
    ];

    // Idempotent upsert of the product based on composite unique constraint
    const product = await prisma.product.upsert({
      where: {
        merchantId_slug: {
          merchantId: merchant.id,
          slug: prodDetails.slug,
        },
      },
      update: {
        ...prodDetails,
        imageUrl: primaryImg,
        galleryImages: galleryImgs,
        price: prodDetails.price.toString(), // Convert to string representation for Prisma Decimal compatibility
        rating: prodDetails.rating.toString(),
      },
      create: {
        ...prodDetails,
        imageUrl: primaryImg,
        galleryImages: galleryImgs,
        merchantId: merchant.id,
        price: prodDetails.price.toString(),
        rating: prodDetails.rating.toString(),
      },
    });

    productsCount++;

    // Idempotent upsert of the variants
    for (const vItem of variants) {
      await prisma.productVariant.upsert({
        where: { sku: vItem.sku },
        update: {
          ...vItem,
          productId: product.id,
          price: vItem.price ? vItem.price.toString() : null,
        },
        create: {
          ...vItem,
          productId: product.id,
          price: vItem.price ? vItem.price.toString() : null,
        },
      });
      variantsCount++;
    }
  }

  console.log(`Successfully seeded ${productsCount} products and ${variantsCount} variants.`);

  // Idempotent upsert of the customer
  const customerData = {
    name: "Demo Customer",
    email: "demo@mercora.local",
    active: true,
  };
  const customer = await prisma.customer.upsert({
    where: { email: customerData.email },
    update: customerData,
    create: customerData,
  });

  console.log(`Customer seeded: ${customer.name} (${customer.id})`);

  // --- Seed Product Relationships (Phase 5B - Commercially Grounded) ---
  const relationsData = [
    // 1. UPSELLS (Strictly same category, higher price <= 1.4x, grounded improvements)
    // Headphones
    { sourceSlug: "sennheiser-hd-350bt", targetSlug: "jbl-tune-770nc", type: "UPSELL" as const, priority: 1, reason: "Higher customer rating and active noise cancellation" },
    { sourceSlug: "jbl-tune-770nc", targetSlug: "sony-wh-ch720n", type: "UPSELL" as const, priority: 1, reason: "Top rated lightweight over-ear design with superior comfort" },
    
    // Earbuds
    { sourceSlug: "boat-airdopes-131", targetSlug: "noise-buds-vs104", type: "UPSELL" as const, priority: 1, reason: "Battery life jumps from 15h to 45h and higher rating" },
    { sourceSlug: "mercora-airbuds-pro", targetSlug: "realme-buds-air-5-pro", type: "UPSELL" as const, priority: 1, reason: "Battery life increases from 32h to 40h and higher rating" },
    { sourceSlug: "realme-buds-air-5-pro", targetSlug: "oneplus-buds-3", type: "UPSELL" as const, priority: 1, reason: "Dual-driver audio with 44h battery and IP55 rating" },
    { sourceSlug: "oneplus-buds-3", targetSlug: "sony-wf-c700n", type: "UPSELL" as const, priority: 1, reason: "Flagship acoustic tuning and higher rating (4.7 vs 4.6)" },

    // Smartwatches
    { sourceSlug: "fastrack-reflex-beat-plus", targetSlug: "noise-colorfit-pulse-3", type: "UPSELL" as const, priority: 1, reason: "Adds high-contrast AMOLED display panel" },
    { sourceSlug: "samsung-galaxy-watch-fe", targetSlug: "oneplus-watch-2r", type: "UPSELL" as const, priority: 1, reason: "Higher rating (4.7 vs 4.4) and advanced sports workout metrics" },

    // Power Banks
    { sourceSlug: "ambrane-stylo-20k", targetSlug: "duracell-power-bank-10k", type: "UPSELL" as const, priority: 1, reason: "Higher customer rating (4.5 vs 4.1)" },
    { sourceSlug: "duracell-power-bank-10k", targetSlug: "mi-power-bank-3i", type: "UPSELL" as const, priority: 1, reason: "Capacity doubles from 10,000mAh to 20,000mAh for ₹150 more" },
    { sourceSlug: "mi-power-bank-3i", targetSlug: "anker-325-power-bank", type: "UPSELL" as const, priority: 1, reason: "Higher build quality and top 4.6 customer rating" },

    // Speakers
    { sourceSlug: "mercora-sonic-300", targetSlug: "jbl-go-4", type: "UPSELL" as const, priority: 1, reason: "Higher rating and ultra-portable travel design" },
    { sourceSlug: "jbl-go-4", targetSlug: "sony-srs-xb100", type: "UPSELL" as const, priority: 1, reason: "Clear surround sound and higher rating (4.6 vs 4.5)" },
    { sourceSlug: "sony-srs-xb100", targetSlug: "tribit-stormbox-micro-2", type: "UPSELL" as const, priority: 1, reason: "Higher rating (4.7 vs 4.6) with integrated elastic strap" },

    // 2. CROSS-SELLS (Commercially intuitive complementary products)
    // Desk Setup (Desk Mat -> Wireless Mouse & Compact Keyboard)
    { sourceSlug: "portronics-ruffpad-15", targetSlug: "urbn-4in1-cable", type: "CROSS_SELL" as const, priority: 1, reason: "Precision optical wireless mouse for clean desk setup" },
    { sourceSlug: "portronics-ruffpad-15", targetSlug: "dailyobjects-deskmat-lite", type: "CROSS_SELL" as const, priority: 2, reason: "Compact keyboard that fits neatly on the desk mat" },

    // Laptop Stand -> Wireless Mouse & Compact Keyboard
    { sourceSlug: "mivi-roam-2", targetSlug: "urbn-4in1-cable", type: "CROSS_SELL" as const, priority: 1, reason: "Wireless optical mouse to pair with elevated laptop stand" },
    { sourceSlug: "mivi-roam-2", targetSlug: "dailyobjects-deskmat-lite", type: "CROSS_SELL" as const, priority: 2, reason: "Compact keyboard for ergonomic elevated typing" },

    // Audio & Wearables -> Portable Backup Power
    { sourceSlug: "jbl-go-4", targetSlug: "urbn-10000mah-nano", type: "CROSS_SELL" as const, priority: 1, reason: "Keep your portable speaker powered anywhere on the go" },
    { sourceSlug: "tribit-stormbox-micro-2", targetSlug: "urbn-10000mah-nano", type: "CROSS_SELL" as const, priority: 1, reason: "Compact power backup for outdoor music sessions" },
    { sourceSlug: "mercora-horizon", targetSlug: "urbn-10000mah-nano", type: "CROSS_SELL" as const, priority: 1, reason: "Portable power bank for multi-day travel" },
    { sourceSlug: "samsung-galaxy-watch-fe", targetSlug: "ambrane-stylo-20k", type: "CROSS_SELL" as const, priority: 1, reason: "High-capacity power bank for travel and fitness trips" },

    // 3. ACCESSORIES (Directly useful cables, chargers, and adapters)
    // USB-C Hub -> Braided USB-C Cable & 65W Wall Charger
    { sourceSlug: "anker-powerport-iii-20w", targetSlug: "mercora-braided-usbc", type: "ACCESSORY" as const, priority: 1, reason: "Heavy-duty 100W PD braided USB-C cable" },
    { sourceSlug: "anker-powerport-iii-20w", targetSlug: "belkin-boostcharge-30w", type: "ACCESSORY" as const, priority: 2, reason: "High-output 65W fast charger for full hub power" },

    // 65W Wall Charger -> Braided USB-C Cable
    { sourceSlug: "belkin-boostcharge-30w", targetSlug: "mercora-braided-usbc", type: "ACCESSORY" as const, priority: 1, reason: "100W power delivery cable to match charger output" },

    // Wireless Headphones -> USB-C Cable & 65W Wall Charger
    { sourceSlug: "mercora-wave-100", targetSlug: "mercora-braided-usbc", type: "ACCESSORY" as const, priority: 1, reason: "Fast charging USB-C cable for quick recharging" },
    { sourceSlug: "mercora-wave-100", targetSlug: "belkin-boostcharge-30w", type: "ACCESSORY" as const, priority: 2, reason: "Fast wall adapter for rapid headphone recharging" },

    // Smartwatch & Power Bank -> USB-C Cable
    { sourceSlug: "mercora-horizon", targetSlug: "mercora-braided-usbc", type: "ACCESSORY" as const, priority: 1, reason: "Heavy-duty braided charging cable" },
    { sourceSlug: "mi-power-bank-3i", targetSlug: "mercora-braided-usbc", type: "ACCESSORY" as const, priority: 1, reason: "Braided fast-charging USB-C cable" },
    { sourceSlug: "mi-power-bank-3i", targetSlug: "belkin-boostcharge-30w", type: "ACCESSORY" as const, priority: 2, reason: "65W charger to rapidly recharge a 20,000mAh battery" },
  ];

  // Clean slate for relationships
  await prisma.productRelation.deleteMany({});

  let relationsCount = 0;
  for (const rel of relationsData) {
    const sourceProd = await prisma.product.findFirst({ where: { slug: rel.sourceSlug } });
    const targetProd = await prisma.product.findFirst({ where: { slug: rel.targetSlug } });

    if (sourceProd && targetProd) {
      await prisma.productRelation.upsert({
        where: {
          sourceProductId_targetProductId_type: {
            sourceProductId: sourceProd.id,
            targetProductId: targetProd.id,
            type: rel.type,
          },
        },
        update: {
          priority: rel.priority,
          reason: rel.reason,
          active: true,
        },
        create: {
          sourceProductId: sourceProd.id,
          targetProductId: targetProd.id,
          type: rel.type,
          priority: rel.priority,
          reason: rel.reason,
          active: true,
        },
      });
      relationsCount++;
    }
  }

  console.log(`Successfully seeded ${relationsCount} product relationships.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
