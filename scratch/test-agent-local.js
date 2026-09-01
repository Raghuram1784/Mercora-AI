import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pkgPg from "pg";
import { PrismaClient } from "../apps/backend/src/generated/prisma/index.js";
import { AgentService } from "../apps/backend/dist/agent/agent.service.js";

// Setup global Prisma instance since apps/backend/src/config/database.ts might instantiate it
const pg = pkgPg;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const customerId = "c56b6db8-9ef7-43ae-9322-5c256d9b3b71";
  const cartId = "66e6c184-7a0e-4174-980b-80c9d4604fec";

  try {
    const result = await AgentService.processMessage({
      message: "Show me wireless earbuds.",
      customerId,
      cartId
    });
    console.log("Success! Result:", result);
  } catch (err) {
    console.error("Local execution failed:");
    console.error(err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
