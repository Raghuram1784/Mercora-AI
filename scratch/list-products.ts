import { prisma } from "../apps/backend/src/config/database.js";

async function main() {
  const prods = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, category: true, price: true, rating: true, features: true },
    orderBy: { category: "asc" }
  });
  console.log(JSON.stringify(prods, null, 2));
}

main().finally(() => prisma.$disconnect());
