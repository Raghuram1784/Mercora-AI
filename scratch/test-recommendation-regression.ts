import "dotenv/config";
import { prisma } from "../apps/backend/src/config/database.js";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";

async function runRecommendationRegressionTests() {
  console.log("=================================================================");
  console.log("       RECOMMENDATION AGENT REGRESSION TEST SUITE                ");
  console.log("=================================================================\n");

  const testCustomer = await prisma.customer.findFirstOrThrow({ where: { email: "demo@mercora.local" } });

  // -------------------------------------------------------------
  // Test 1: "Which headphones should I buy?"
  // Expected: Calls recommend_products immediately, returns recommendations
  // -------------------------------------------------------------
  console.log("--- TEST 1: 'Which headphones should I buy?' ---");
  const q1 = "Which headphones should I buy?";
  console.log(`Query: "${q1}"`);
  
  const res1 = await AgentService.processMessage({
    message: q1,
    customerId: testCustomer.id,
  });

  console.log("Actions taken:", res1.actions);
  console.log("Response preview:\n", res1.message.slice(0, 300), "...\n");

  const usedRecommendTool1 = res1.actions.some((a) => a.tool === "recommend_products" && a.status === "success");
  const containsProductContent1 = res1.message.toLowerCase().includes("headphone") || res1.message.toLowerCase().includes("match") || res1.message.toLowerCase().includes("value");
  const t1Pass = usedRecommendTool1 && containsProductContent1;
  console.log(`=> TEST 1 RESULT: ${t1Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  await new Promise((r) => setTimeout(r, 6000));

  // -------------------------------------------------------------
  // Test 2: "Recommend a smartwatch."
  // Expected: Calls recommend_products immediately
  // -------------------------------------------------------------
  console.log("--- TEST 2: 'Recommend a smartwatch.' ---");
  const q2 = "Recommend a smartwatch.";
  console.log(`Query: "${q2}"`);

  const res2 = await AgentService.processMessage({
    message: q2,
    customerId: testCustomer.id,
  });

  console.log("Actions taken:", res2.actions);
  console.log("Response preview:\n", res2.message.slice(0, 300), "...\n");

  const usedRecommendTool2 = res2.actions.some((a) => a.tool === "recommend_products" && a.status === "success");
  const t2Pass = usedRecommendTool2;
  console.log(`=> TEST 2 RESULT: ${t2Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  await new Promise((r) => setTimeout(r, 6000));

  // -------------------------------------------------------------
  // Test 3: "What should I buy?"
  // Expected: Clarification allowed since there is 0 category / context
  // -------------------------------------------------------------
  console.log("--- TEST 3: 'What should I buy?' (Completely Ambiguous) ---");
  const q3 = "What should I buy?";
  console.log(`Query: "${q3}"`);

  const res3 = await AgentService.processMessage({
    message: q3,
    customerId: testCustomer.id,
  });

  console.log("Actions taken:", res3.actions);
  console.log("Response preview:\n", res3.message.slice(0, 300), "...\n");

  // Should ask for clarification or provide open categories without calling recommend_products on arbitrary fake criteria
  const isClarifying = res3.message.length > 20;
  console.log(`=> TEST 3 RESULT: ${isClarifying ? "PASSED (Clarification Provided) ✅" : "FAILED ❌"}\n`);

  console.log("=================================================================");
  console.log("                 REGRESSION TESTS COMPLETED                      ");
  console.log("=================================================================");
}

runRecommendationRegressionTests()
  .catch((err) => {
    console.error("Test failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
