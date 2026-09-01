import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../apps/backend/src/generated/prisma/index.js";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    select: {
      name: true,
      slug: true,
      category: true,
      imageUrl: true,
    },
    orderBy: {
      category: "asc",
    },
  });
  console.log("DB_PRODUCTS:", JSON.stringify(products, null, 2));
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
