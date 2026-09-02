import { AgentService } from "../apps/backend/src/agent/agent.service.js";
import { prisma } from "../apps/backend/src/config/database.js";
import assert from "node:assert";

async function runAttributionFastPathTests() {
  console.log("==================================================");
  console.log("  MERCORA AI - FAST-PATH ATTRIBUTION REGRESSION TEST");
  console.log("==================================================\n");

  const merchant = await prisma.merchant.findFirst();
  assert(merchant, "Merchant must exist");
  const customer = await prisma.customer.findFirst();
  assert(customer, "Customer must exist");

  const cart = await prisma.cart.create({
    data: { customerId: customer.id, status: "ACTIVE" },
  });

  const reqBase = {
    customerId: customer.id,
    cartId: cart.id,
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Recommendation flow -> Explicit Add preserves sourceEventId
    // -------------------------------------------------------------
    console.log("--- TEST 1: Recommendation Flow -> Explicit Add Attribution Preservation ---");
    
    // Step 1: Recommendation query
    const res1 = await AgentService.processMessage({
      ...reqBase,
      message: "Which headphones should I buy under ₹5000 for travel?",
      history: [],
    });

    assert(res1.products && res1.products.length > 0, "Recommendation must return products");
    const recEventId = res1.products[0].sourceEventId;
    console.log("Recorded recommendation sourceEventId:", recEventId);
    assert(recEventId, "Recommendation product must include sourceEventId");

    // Step 2: Explicit add fast-path query
    const res2 = await AgentService.processMessage({
      ...reqBase,
      message: "Add the Travel Headphones to my cart",
      history: [
        { role: "user", content: "Which headphones should I buy under ₹5000 for travel?" },
        { role: "assistant", content: res1.message },
      ],
    });

    assert.strictEqual(res2.pendingAction?.type, "SELECT_VARIANT", "Explicit add must return SELECT_VARIANT");
    assert(res2.products && res2.products.length > 0, "Explicit add response must include resolved product");
    
    const targetProdCard = res2.products[0];
    console.log("Resolved product card attribution:", {
      aiAttributionSource: targetProdCard.aiAttributionSource,
      sourceEventId: targetProdCard.sourceEventId,
    });

    assert.strictEqual(targetProdCard.aiAttributionSource, "AI_RECOMMENDATION", "Attribute source must be AI_RECOMMENDATION");
    assert.strictEqual(targetProdCard.sourceEventId, recEventId, "sourceEventId must match prior recommendation event ID");
    console.log("✅ TEST 1 PASS: Prior AI recommendation attribution and sourceEventId correctly preserved!");

    // -------------------------------------------------------------
    // TEST 2: Direct Add in Fresh Chat -> NO Fabricated Attribution
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Direct Add in Fresh Chat -> DIRECT / Unattributed ---");
    
    const freshCart = await prisma.cart.create({
      data: { customerId: customer.id, status: "ACTIVE" },
    });

    try {
      const resDirect = await AgentService.processMessage({
        customerId: customer.id,
        cartId: freshCart.id,
        message: "Add the Travel Headphones to my cart",
        history: [],
      });

      assert.strictEqual(resDirect.pendingAction?.type, "SELECT_VARIANT", "Direct add must return SELECT_VARIANT");
      const directProdCard = resDirect.products[0];
      console.log("Direct add product card attribution:", {
        aiAttributionSource: directProdCard.aiAttributionSource,
        sourceEventId: directProdCard.sourceEventId,
      });

      assert.strictEqual(directProdCard.aiAttributionSource, "DIRECT", "Fresh direct add must be DIRECT");
      assert.strictEqual(directProdCard.sourceEventId, undefined, "Fresh direct add must NOT fabricate sourceEventId");
      console.log("✅ TEST 2 PASS: Fresh direct add correctly treated as DIRECT without fabricating AI attribution!");
    } finally {
      await prisma.cart.delete({ where: { id: freshCart.id } });
    }

    console.log("\n==================================================");
    console.log("  ALL FAST-PATH ATTRIBUTION TESTS PASSED (2/2)     ");
    console.log("==================================================");
  } finally {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });
  }
}

runAttributionFastPathTests().catch((err) => {
  console.error("Attribution test failed:", err);
  process.exit(1);
});
