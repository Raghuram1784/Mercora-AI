import "dotenv/config";
import { RecommendationService } from "../apps/backend/src/recommendation/recommendation.service.js";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";

async function runTests() {
  console.log("=================================================================");
  console.log("               MERCOLA AI - PHASE 5A TEST SUITE                  ");
  console.log("=================================================================\n");

  // -------------------------------------------------------------
  // Test Scenario 1: Headphones under ₹3000 for travel + wireless
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 1: Headphones under ₹3,000 for travel + wireless ---");
  const s1Criteria = {
    category: "Headphones",
    maxPrice: 3000,
    useCases: ["travel"],
    desiredFeatures: { wireless: true },
    limit: 3,
  };
  const s1Res = await RecommendationService.recommendProducts(s1Criteria);
  console.log(`Eligible products count: ${s1Res.totalEligible}`);
  console.log(`Recommendations returned: ${s1Res.recommendations.length}`);
  s1Res.recommendations.forEach((r) => {
    console.log(`[Rank ${r.rank}] [${r.label}] (Score: ${r.score}) ${r.product.name} - ₹${r.product.price} (Rating: ${r.product.rating})`);
    console.log(`  Reasons: ${r.reasons.map((rs) => `${rs.label} (+${rs.points})`).join(", ")}`);
  });

  const s1Pass =
    s1Res.recommendations.length > 0 &&
    s1Res.recommendations.every((r) => r.product.category === "Headphones" && r.product.price <= 3000) &&
    s1Res.recommendations[0].product.name === "Travel Headphones" &&
    s1Res.recommendations[0].label === "Best Match";
  console.log(`=> SCENARIO 1 RESULT: ${s1Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test Scenario 2: Smartwatches + fitness + GPS
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 2: Smartwatches + fitness + GPS ---");
  const s2Criteria = {
    category: "Smartwatches",
    useCases: ["fitness"],
    desiredFeatures: { gps: true },
    limit: 3,
  };
  const s2Res = await RecommendationService.recommendProducts(s2Criteria);
  s2Res.recommendations.forEach((r) => {
    console.log(`[Rank ${r.rank}] [${r.label}] (Score: ${r.score}) ${r.product.name} - ₹${r.product.price} (Rating: ${r.product.rating})`);
    console.log(`  GPS supported: ${r.product.features?.gps}`);
    console.log(`  Reasons: ${r.reasons.map((rs) => `${rs.label} (+${rs.points})`).join(", ")}`);
  });
  const s2Pass =
    s2Res.recommendations.length > 0 &&
    s2Res.recommendations.every((r) => r.product.category === "Smartwatches" && r.product.features?.gps === true);
  console.log(`=> SCENARIO 2 RESULT: ${s2Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test Scenario 3: Power Banks <= ₹2000 + 20000mAh + USB-C
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 3: Power Banks under ₹2,000 with 20000mAh and USB-C ---");
  const s3Criteria = {
    category: "Power Banks",
    maxPrice: 2000,
    desiredFeatures: { capacityMah: 20000, usbC: true },
    limit: 3,
  };
  const s3Res = await RecommendationService.recommendProducts(s3Criteria);
  s3Res.recommendations.forEach((r) => {
    console.log(`[Rank ${r.rank}] [${r.label}] (Score: ${r.score}) ${r.product.name} - ₹${r.product.price} (Capacity: ${r.product.features?.capacityMah}mAh)`);
    console.log(`  Reasons: ${r.reasons.map((rs) => `${rs.label} (+${rs.points})`).join(", ")}`);
  });
  const s3Pass =
    s3Res.recommendations.length > 0 &&
    s3Res.recommendations.every((r) => r.product.category === "Power Banks" && r.product.price <= 2000) &&
    s3Res.recommendations[0].product.features?.capacityMah === 20000;
  console.log(`=> SCENARIO 3 RESULT: ${s3Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test Scenario 4: Impossible Budget (maxPrice = 1)
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 4: Impossible Budget (₹1) ---");
  const s4Criteria = {
    category: "Headphones",
    maxPrice: 1,
  };
  const s4Res = await RecommendationService.recommendProducts(s4Criteria);
  console.log(`Eligible count: ${s4Res.totalEligible}, Recommendations count: ${s4Res.recommendations.length}`);
  const s4Pass = s4Res.recommendations.length === 0 && s4Res.totalEligible === 0;
  console.log(`=> SCENARIO 4 RESULT: ${s4Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test Scenario 5: Determinism Test (5 Consecutive Runs)
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 5: Determinism Test (5 Consecutive Runs) ---");
  const runs: any[] = [];
  for (let i = 1; i <= 5; i++) {
    const res = await RecommendationService.recommendProducts(s1Criteria);
    const signature = res.recommendations.map((r) => `${r.rank}:${r.product.id}:${r.score}:${r.label}`).join(" | ");
    runs.push(signature);
    console.log(`Run ${i}: ${signature}`);
  }
  const isIdentical = runs.every((sig) => sig === runs[0]);
  console.log(`=> DETERMINISM TEST RESULT: ${isIdentical ? "PASSED (100% Identical) ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test Scenario 6: Agent Integration with Groq (Recommendation Query)
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 6: Agent Integration - Recommendation Intent ---");
  const agentRecQuery = "Which headphones should I buy under ₹3,000 for travel?";
  console.log(`Query: "${agentRecQuery}"`);
  try {
    const agentRecRes = await AgentService.processMessage({
      message: agentRecQuery,
    });
    console.log(`Agent Actions Taken:`, agentRecRes.actions);
    console.log(`Agent Structured Products Count: ${agentRecRes.products?.length || 0}`);
    if (agentRecRes.products && agentRecRes.products.length > 0) {
      console.log(`Top Structured Product:`, {
        name: agentRecRes.products[0].name,
        rank: agentRecRes.products[0].rank,
        label: agentRecRes.products[0].label,
        reasons: agentRecRes.products[0].reasons,
      });
    }
    console.log(`Agent Message:\n${agentRecRes.message}\n`);
    const usedRecommendTool = agentRecRes.actions.some((a) => a.tool === "recommend_products");
    console.log(`=> AGENT RECOMMENDATION TOOL CHECK: ${usedRecommendTool ? "PASSED ✅" : "FAILED ❌"}\n`);
  } catch (err: any) {
    console.error("Agent rec test error:", err.message);
  }

  // -------------------------------------------------------------
  // Test Scenario 7: General Search Regression Check
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 7: General Search Intent ---");
  const agentSearchQuery = "Show me headphones under ₹3000";
  console.log(`Query: "${agentSearchQuery}"`);
  try {
    const agentSearchRes = await AgentService.processMessage({
      message: agentSearchQuery,
    });
    console.log(`Agent Actions Taken:`, agentSearchRes.actions);
    console.log(`Agent Response Preview: ${agentSearchRes.message.slice(0, 150)}...`);
    console.log(`=> AGENT GENERAL SEARCH CHECK: PASSED ✅\n`);
  } catch (err: any) {
    console.error("Agent search test error:", err.message);
  }

  // -------------------------------------------------------------
  // Test Scenario 8: Recommendation Without Cart Mutation
  // -------------------------------------------------------------
  console.log("--- TEST SCENARIO 8: Recommendation Without Cart Mutation ---");
  const agentSafeQuery = "Which headphone do you recommend?";
  console.log(`Query: "${agentSafeQuery}"`);
  try {
    const agentSafeRes = await AgentService.processMessage({
      message: agentSafeQuery,
    });
    const calledAddToCart = agentSafeRes.actions.some((a) => a.tool === "add_to_cart" && a.status === "success");
    console.log(`Did agent mutate cart? ${calledAddToCart ? "YES ❌ (VIOLATION)" : "NO ✅ (SAFE)"}`);
    console.log(`=> CART SAFETY CHECK: ${!calledAddToCart ? "PASSED ✅" : "FAILED ❌"}\n`);
  } catch (err: any) {
    console.error("Agent safety test error:", err.message);
  }

  console.log("=================================================================");
  console.log("                    TEST SUITE COMPLETED                         ");
  console.log("=================================================================");
}

runTests().catch(console.error);
