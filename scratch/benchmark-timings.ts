import "dotenv/config";
import { prisma } from "../apps/backend/src/config/database.js";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";

async function runBenchmark() {
  console.log("=================================================================");
  console.log("             MERCORA AI LATENCY BENCHMARK SUITE                  ");
  console.log("=================================================================\n");

  const testCustomer = await prisma.customer.findFirstOrThrow({ where: { email: "demo@mercora.local" } });

  const testQueries = [
    { name: "Headphone Recommendation", query: "Which headphones should I buy?" },
    { name: "Smartwatch Recommendation", query: "Recommend a smartwatch." },
    { name: "Power Bank Recommendation", query: "Best power bank?" },
    { name: "Cross-sell Inquiries", query: "What accessories go well with my desk mat?" },
  ];

  const results: any[] = [];

  for (const item of testQueries) {
    console.log(`\n--- BENCHMARK: ${item.name} ---`);
    console.log(`Query: "${item.query}"`);

    const tStart = performance.now();
    const res = await AgentService.processMessage({
      message: item.query,
      customerId: testCustomer.id,
    });
    const tEnd = performance.now();

    const measuredTotal = tEnd - tStart;
    console.log(`Assistant Response:\n${res.message}\n`);
    console.log(`Actions Taken:`, res.actions);
    console.log(`Structured Products Count: ${res.products?.length || 0}`);
    console.log(`Timings Breakdown:`, res.timings);
    console.log(`Wall Clock Duration: ${measuredTotal.toFixed(1)}ms`);

    results.push({
      name: item.name,
      query: item.query,
      initialGroqMs: res.timings?.initialGroqMs || 0,
      totalToolsMs: res.timings?.totalToolsMs || 0,
      finalGroqMs: res.timings?.finalGroqMs || 0,
      totalMs: res.timings?.totalMs || measuredTotal,
      messageLength: res.message.length,
      productCount: res.products?.length || 0,
    });

    await new Promise((r) => setTimeout(r, 6000));
  }

  console.log("\n=================================================================");
  console.log("                   BENCHMARK SUMMARY TABLE                       ");
  console.log("=================================================================");
  console.table(results);
}

runBenchmark()
  .catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
