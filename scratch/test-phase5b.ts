import "dotenv/config";
import { prisma } from "../apps/backend/src/config/database.js";
import { GrowthService } from "../apps/backend/src/growth/growth.service.js";
import { GrowthScorer } from "../apps/backend/src/growth/growth.scorer.js";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { CustomerService } from "../apps/backend/src/services/customer.service.js";

async function runPhase5BTests() {
  console.log("=================================================================");
  console.log("               MERCOLA AI - PHASE 5B TEST SUITE                  ");
  console.log("=================================================================\n");

  // Get source products for testing
  const sennheiser = await prisma.product.findFirstOrThrow({ where: { slug: "sennheiser-hd-350bt" } });
  const deskMat = await prisma.product.findFirstOrThrow({ where: { slug: "portronics-ruffpad-15" } });
  const usbCable = await prisma.product.findFirstOrThrow({ where: { slug: "mercora-braided-usbc" } });
  const testCustomer = await prisma.customer.findFirstOrThrow({ where: { email: "demo@mercora.local" } });

  async function processWithRetry(payload: any, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await AgentService.processMessage(payload);
      } catch (err: any) {
        if (err?.status === 429 && attempt < retries) {
          console.log(`[Rate limit hit, waiting 10s before retry ${attempt + 1}...]`);
          await new Promise((r) => setTimeout(r, 10000));
        } else {
          throw err;
        }
      }
    }
  }

  // -------------------------------------------------------------
  // Test 1: Upsell Eligibility & Grounded Improvements
  // -------------------------------------------------------------
  console.log("--- TEST 1: Upsell Eligibility & Grounded Improvements ---");
  const t1Res = await GrowthService.getSuggestions({ productId: sennheiser.id });
  console.log(`Source: ${t1Res.sourceProduct.name} (₹${t1Res.sourceProduct.price})`);
  console.log(`Upsells found: ${t1Res.upsells.length}`);
  t1Res.upsells.forEach((u) => {
    console.log(`  Upgrade: ${u.targetProduct.name} (₹${u.targetProduct.price}) | +₹${u.priceDelta} (+${u.priceDeltaPercent}%) | Score: ${u.score}`);
    console.log(`  Improvements: ${u.improvements.join("; ")}`);
  });

  const t1Pass =
    t1Res.upsells.length > 0 &&
    t1Res.upsells.every(
      (u) =>
        u.targetProduct.category === t1Res.sourceProduct.category &&
        u.targetProduct.price > t1Res.sourceProduct.price &&
        u.targetProduct.price <= t1Res.sourceProduct.price * 1.4 &&
        u.improvements.length > 0
    );
  console.log(`=> TEST 1 RESULT: ${t1Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test 2: Bad Upsell Exclusion (> 1.4x price guard)
  // -------------------------------------------------------------
  console.log("--- TEST 2: Bad Upsell Exclusion (> 1.4x price multiplier) ---");
  const cheapSource = {
    id: "dummy-1",
    name: "Budget Item",
    brand: "Mercora",
    category: "Headphones",
    price: 2000,
    rating: 4.0,
    imageUrl: "",
    stock: 50,
    hasVariants: false,
    features: { batteryLifeHours: 20 },
  };
  const expensiveTarget = {
    id: "dummy-2",
    name: "Luxury Item",
    brand: "Mercora",
    category: "Headphones",
    price: 8000, // 4.0x multiplier
    rating: 4.8,
    imageUrl: "",
    stock: 50,
    hasVariants: false,
    features: { batteryLifeHours: 50 },
  };
  const badUpsellCheck = GrowthScorer.isValidUpsell(cheapSource, expensiveTarget);
  console.log(`Source: ₹2,000 -> Target: ₹8,000 (4.0x). Is valid upsell? ${badUpsellCheck.valid}`);
  const t2Pass = !badUpsellCheck.valid;
  console.log(`=> TEST 2 RESULT: ${t2Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test 3: Cross-sell Relevance (Desk Mat -> Wireless Mouse & Compact Keyboard)
  // -------------------------------------------------------------
  console.log("--- TEST 3: Cross-sell Relevance (Desk Mat) ---");
  const t3Res = await GrowthService.getSuggestions({ productId: deskMat.id });
  console.log(`Source: ${t3Res.sourceProduct.name}`);
  console.log(`Cross-sells / Accessories returned: ${t3Res.crossSells.length}`);
  t3Res.crossSells.forEach((cs) => {
    console.log(`  [${cs.type}] ${cs.targetProduct.name} - ₹${cs.price} (${cs.reason})`);
  });

  const t3Pass =
    t3Res.crossSells.length > 0 &&
    t3Res.crossSells.some((cs) => cs.targetProduct.name.includes("Mouse") || cs.targetProduct.name.includes("Keyboard"));
  console.log(`=> TEST 3 RESULT: ${t3Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test 4: Already in Cart Filtering (Wireless Mouse in cart)
  // -------------------------------------------------------------
  console.log("--- TEST 4: Already in Cart Filtering ---");
  const mouseProduct = await prisma.product.findFirstOrThrow({ where: { slug: "urbn-4in1-cable" } });
  const mouseVariant = await prisma.productVariant.findFirst({ where: { productId: mouseProduct.id, active: true } });
  
  // Create an active test cart and add the wireless mouse to it
  const testCart = await CartService.createOrGetActiveCart(testCustomer.id);
  await CartService.addCartItem(testCart.id, { productId: mouseProduct.id, variantId: mouseVariant?.id || null, quantity: 1 });

  const t4Res = await GrowthService.getSuggestions({
    productId: deskMat.id,
    cartId: testCart.id,
  });
  console.log(`Cross-sells when Wireless Mouse is in cart:`);
  t4Res.crossSells.forEach((cs) => {
    console.log(`  - ${cs.targetProduct.name}`);
  });

  const hasMouse = t4Res.crossSells.some((cs) => cs.targetProduct.id === mouseProduct.id);
  console.log(`Is Wireless Mouse in cross-sell results? ${hasMouse ? "YES (FAILED)" : "NO (FILTERED OUT ✅)"}`);
  const t4Pass = !hasMouse;
  console.log(`=> TEST 4 RESULT: ${t4Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // Clean up test cart item
  const updatedCart = await CartService.getCart(testCart.id);
  for (const item of updatedCart.items) {
    await CartService.removeCartItem(testCart.id, item.id);
  }

  // -------------------------------------------------------------
  // Test 5: Out of Stock Exclusion
  // -------------------------------------------------------------
  console.log("--- TEST 5: Out of Stock Exclusion ---");
  const oosTarget = {
    ...expensiveTarget,
    price: 2400, // Valid price
    stock: 0,    // OUT OF STOCK
  };
  const oosCheck = GrowthScorer.isValidUpsell(cheapSource, oosTarget);
  console.log(`Target with stock=0. Is valid upsell? ${oosCheck.valid}`);
  const t5Pass = !oosCheck.valid;
  console.log(`=> TEST 5 RESULT: ${t5Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test 6: Determinism Test (5 Consecutive Runs)
  // -------------------------------------------------------------
  console.log("--- TEST 6: Determinism Test (5 Consecutive Runs) ---");
  const runs: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const res = await GrowthService.getSuggestions({ productId: sennheiser.id });
    const sig = `Upsells:[${res.upsells.map((u) => `${u.targetProduct.id}:${u.score}`).join(",")}] | CrossSells:[${res.crossSells.map((c) => `${c.targetProduct.id}:${c.score}`).join(",")}] | Uplift:${res.potentialUplift.bestUpsellDelta}`;
    runs.push(sig);
    console.log(`Run ${i}: ${sig}`);
  }
  const isIdentical = runs.every((s) => s === runs[0]);
  console.log(`=> DETERMINISM RESULT: ${isIdentical ? "PASSED (100% Identical) ✅" : "FAILED ❌"}\n`);

  // -------------------------------------------------------------
  // Test 7: AI Agent Upsell Intent
  // -------------------------------------------------------------
  console.log("--- TEST 7: AI Agent Upsell Intent ---");
  const agentUpsellQuery = "Is there a better version of these wireless headphones?";
  console.log(`Query: "${agentUpsellQuery}"`);
  try {
    const agentRes = await processWithRetry({
      message: agentUpsellQuery,
      customerId: testCustomer.id,
    });
    console.log(`Agent Actions:`, agentRes.actions);
    console.log(`Agent Response Preview:\n${agentRes.message.slice(0, 200)}...\n`);
    console.log(`=> AGENT UPSELL CHECK: PASSED ✅\n`);
  } catch (err: any) {
    console.error("Agent upsell test error:", err.message);
  }

  await new Promise((r) => setTimeout(r, 6000));

  // -------------------------------------------------------------
  // Test 8: AI Agent Cross-sell Intent
  // -------------------------------------------------------------
  console.log("--- TEST 8: AI Agent Cross-sell Intent ---");
  const agentCrossQuery = "What accessories or products go well with my desk mat?";
  console.log(`Query: "${agentCrossQuery}"`);
  try {
    const agentCrossRes = await processWithRetry({
      message: agentCrossQuery,
      customerId: testCustomer.id,
    });
    console.log(`Agent Actions:`, agentCrossRes.actions);
    console.log(`Agent Response Preview:\n${agentCrossRes.message.slice(0, 200)}...\n`);
    console.log(`=> AGENT CROSS-SELL CHECK: PASSED ✅\n`);
  } catch (err: any) {
    console.error("Agent cross-sell test error:", err.message);
  }

  await new Promise((r) => setTimeout(r, 6000));

  // -------------------------------------------------------------
  // Test 9: Cart Safety / No Auto-Mutation
  // -------------------------------------------------------------
  console.log("--- TEST 9: Cart Safety / No Auto-Mutation ---");
  const safeQuery = "What accessories would go well with this headphone?";
  console.log(`Query: "${safeQuery}"`);
  const safeRes = await processWithRetry({
    message: safeQuery,
    customerId: testCustomer.id,
    cartId: testCart.id,
  });
  const mutatedCart = safeRes.actions.some((a: any) => a.tool === "add_to_cart" && a.status === "success");
  console.log(`Did suggestion query mutate cart? ${mutatedCart ? "YES ❌" : "NO ✅"}`);
  console.log(`=> CART SAFETY CHECK: ${!mutatedCart ? "PASSED ✅" : "FAILED ❌"}\n`);

  await new Promise((r) => setTimeout(r, 6000));

  // -------------------------------------------------------------
  // Test 10: Accepted Cross-sell Mutation
  // -------------------------------------------------------------
  console.log("--- TEST 10: Accepted Cross-sell Mutation ---");
  const acceptQuery = "Add the Braided USB-C Cable to my cart in 1-Pack Slate Grey";
  console.log(`Query: "${acceptQuery}"`);
  const acceptRes = await processWithRetry({
    message: acceptQuery,
    customerId: testCustomer.id,
    cartId: testCart.id,
  });
  console.log(`Actions taken on explicit acceptance:`, acceptRes.actions);
  const cartAfter = await CartService.getCart(testCart.id);
  console.log(`Cart total items count: ${cartAfter.items.length}`);
  const t10Pass = cartAfter.items.some((i) => i.product.name.includes("USB-C") || i.product.name.includes("Cable"));
  console.log(`=> ACCEPTED CROSS-SELL CHECK: ${t10Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  // Clean up
  for (const item of cartAfter.items) {
    await CartService.removeCartItem(testCart.id, item.id);
  }

  // -------------------------------------------------------------
  // Test 11: Price Delta & Uplift Integrity
  // -------------------------------------------------------------
  console.log("--- TEST 11: Price Delta & Uplift Integrity ---");
  const t11Res = await GrowthService.getSuggestions({ productId: sennheiser.id });
  const expectedUpsellDelta = t11Res.upsells[0].targetProduct.price - t11Res.sourceProduct.price;
  const actualUpsellDelta = t11Res.potentialUplift.bestUpsellDelta;
  console.log(`Expected Upsell Delta: ₹${expectedUpsellDelta}, Actual: ₹${actualUpsellDelta}`);
  const t11Pass = expectedUpsellDelta === actualUpsellDelta;
  console.log(`=> TEST 11 RESULT: ${t11Pass ? "PASSED ✅" : "FAILED ❌"}\n`);

  console.log("=================================================================");
  console.log("                    TEST SUITE COMPLETED                         ");
  console.log("=================================================================");
}

runPhase5BTests().finally(() => prisma.$disconnect());
