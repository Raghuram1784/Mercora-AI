import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pkgPg from "pg";
import { PrismaClient } from "../apps/backend/src/generated/prisma/index.js";
const pg = pkgPg;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const customer = await prisma.customer.findFirst({
    where: { active: true }
  });

  const cart = await prisma.cart.findFirst({
    where: { status: "ACTIVE" }
  });

  const productWithVariants = await prisma.product.findFirst({
    where: {
      active: true,
      variants: { some: { active: true } }
    },
    include: { variants: true }
  });

  const productWithoutVariants = await prisma.product.findFirst({
    where: {
      active: true,
      variants: { none: {} }
    }
  });

  console.log("Customer ID:", customer?.id);
  console.log("Cart ID:", cart?.id);
  if (productWithVariants) {
    console.log("Product with variants ID:", productWithVariants.id, `(${productWithVariants.name})`);
    console.log("  Variant IDs:", productWithVariants.variants.map(v => `${v.name}: ${v.id}`));
  }
  if (productWithoutVariants) {
    console.log("Product without variants ID:", productWithoutVariants.id, `(${productWithoutVariants.name})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
