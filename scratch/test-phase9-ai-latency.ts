import { AgentService } from "../apps/backend/src/agent/agent.service.js";
import { prisma } from "../apps/backend/src/config/database.js";

const QUERIES = [
  "Which headphones should I buy?",
  "Recommend wireless headphones under ₹5,000 for travel.",
  "Recommend a smartwatch for fitness with GPS.",
];

async function runAILatencyBenchmark() {
  console.log("=================================================================");
  console.log("      PHASE 9: AI RECOMMENDATION LATENCY BENCHMARK (5 RUNS)      ");
  console.log("=================================================================\n");

  const testCustomer = await prisma.customer.findFirst({ where: { email: { contains: "@" } } });
  const customerId = testCustomer ? testCustomer.id : undefined;

  for (let qIdx = 0; qIdx < QUERIES.length; qIdx++) {
    const query = QUERIES[qIdx];
    console.log(`\nQuery [${qIdx + 1}/3]: "${query}"`);
    const timings: number[] = [];

    for (let run = 1; run <= 5; run++) {
      const start = performance.now();
      try {
        const res = await AgentService.processMessage({
          message: query,
          customerId,
        });
        const duration = Math.round(performance.now() - start);
        timings.push(duration);
        console.log(`  Run ${run}: ${duration}ms (Products: ${res.products?.length || 0}, Tools: ${res.actions?.length || 0})`);
      } catch (err: any) {
        console.error(`  Run ${run} failed: ${err.message}`);
      }
    }

    if (timings.length > 0) {
      const avg = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
      const min = Math.min(...timings);
      const max = Math.max(...timings);
      console.log(`  Summary for Query ${qIdx + 1}: Average = ${avg}ms | Min = ${min}ms | Max = ${max}ms`);
    }
  }

  console.log("\n=========================================================");
  console.log("       AI RECOMMENDATION LATENCY BENCHMARK COMPLETE      ");
  console.log("=========================================================\n");

  await prisma.$disconnect();
}

runAILatencyBenchmark();
