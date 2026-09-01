import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pkgPg from "pg";
import { PrismaClient } from "../apps/backend/src/generated/prisma/index.js";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";

const pg = pkgPg;
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const customerId = "c56b6db8-9ef7-43ae-9322-5c256d9b3b71";
  const cartId = "66e6c184-7a0e-4174-980b-80c9d4604fec";

  console.log("=== Diagnosing Test 7: Variant Addition ===");
  try {
    const result = await AgentService.processMessage({
      message: "Add the Astral Black variant of Bluetooth Earbuds.",
      customerId,
      cartId,
      history: [
        { role: "user", content: "Add the Bluetooth Earbuds to my cart." },
        { role: "assistant", content: "Please choose a variant: Astral Black or Sunrise Beige." }
      ]
    });
    console.log("Result:", result);
  } catch (err) {
    console.error("Failed:", err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
