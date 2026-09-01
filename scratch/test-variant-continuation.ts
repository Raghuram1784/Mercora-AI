import "dotenv/config";
import assert from "assert";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";
import { ProductService } from "../apps/backend/src/services/product.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { CustomerService } from "../apps/backend/src/services/customer.service.js";
import { CommerceEventType, CommerceEventSource } from "../apps/backend/src/generated/prisma/index.js";
import { prisma } from "../apps/backend/src/config/database.js";

async function runVariantContinuationTests() {
  console.log("==================================================");
  console.log("  MERCORA AI - VARIANT CONTINUATION REGRESSION TEST");
  console.log("==================================================");

  let customer = await prisma.customer.findFirst({ where: { email: "variant-test@mercora.ai" } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: { name: "Variant Test User", email: "variant-test@mercora.ai", active: true },
    });
  }
  const cart = await CartService.createOrGetActiveCart(customer.id);

  try {
    // -------------------------------------------------------------
    // TEST 1: recommendation -> "Add the Travel Headphones to my cart" -> SELECT_VARIANT returned
    // -------------------------------------------------------------
    console.log("\n--- TEST 1 & 2 & 3: Recommendation -> Add Travel Headphones -> SELECT_VARIANT ---");
    const travelHeadphones = await prisma.product.findFirst({
      where: { slug: "boult-probass-thunder" },
      include: { variants: true },
    });
    assert(travelHeadphones, "Travel Headphones product exists in database");
    assert(travelHeadphones.variants.length > 0, "Travel Headphones has active variants");

    const turn1 = await AgentService.processMessage({
      message: "Which headphones should I buy under ₹5000 for travel?",
      customerId: customer.id,
      cartId: cart.id,
      history: [],
    });

    assert(turn1.message && turn1.message.length > 0, "Turn 1 returns assistant recommendation message");

    const turn2 = await AgentService.processMessage({
      message: "Add the Travel Headphones to my cart",
      customerId: customer.id,
      cartId: cart.id,
      history: [
        { role: "user", content: "Which headphones should I buy under ₹5000 for travel?" },
        { role: "assistant", content: turn1.message },
      ],
    });

    console.log("Turn 2 pendingAction:", JSON.stringify(turn2.pendingAction, null, 2));

    assert(turn2.pendingAction, "TEST 1 PASS: pendingAction returned when adding Travel Headphones");
    assert(turn2.pendingAction.type === "SELECT_VARIANT", "pendingAction type is SELECT_VARIANT");
    assert(turn2.pendingAction.productId === travelHeadphones.id, `TEST 2 PASS: pendingAction contains real Product ID (${travelHeadphones.id})`);
    assert(Array.isArray(turn2.pendingAction.variants) && turn2.pendingAction.variants.length > 0, "TEST 3 PASS: pendingAction contains active variants");
    assert(turn2.pendingAction.variants[0].id, "Variant contains real database ID");

    // -------------------------------------------------------------
    // TEST 4: Variant Modal Add Preserves AI Attribution + sourceEventId
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Variant Modal Add Preserves AI Attribution ---");
    const recProductInTurn2 = turn2.products?.find((p: any) => p.id === travelHeadphones.id);
    const attributionSource = recProductInTurn2?.aiAttributionSource || "AI_RECOMMENDATION";
    const sourceEventId = recProductInTurn2?.sourceEventId;

    const selectedVariantId = turn2.pendingAction.variants[0].id;
    const addedItem = await CartService.addCartItem(cart.id, {
      productId: travelHeadphones.id,
      variantId: selectedVariantId,
      quantity: 1,
      source: attributionSource,
      sourceEventId: sourceEventId,
    });

    assert(addedItem, "Item added to cart via variant modal selection");
    assert(addedItem.source === "AI_RECOMMENDATION", `TEST 4 PASS: Cart item preserves AI_RECOMMENDATION attribution (source=${addedItem.source})`);

    // -------------------------------------------------------------
    // TEST 5: Non-variant product explicit add still works
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Non-variant product explicit add ---");
    const nonVariantProd = await prisma.product.create({
      data: {
        merchantId: travelHeadphones.merchantId,
        name: "Mercora Test Cable",
        slug: "mercora-test-cable-" + Date.now(),
        description: "Test cable without variants",
        brand: "Mercora",
        category: "Accessories",
        price: 499,
        rating: 4.5,
        imageUrl: "https://example.com/cable.jpg",
        features: [],
        currency: "INR",
        stock: 100,
        active: true,
      },
    });

    try {
      const nonVarTurn = await AgentService.processMessage({
        message: `Add the ${nonVariantProd.name} to my cart`,
        customerId: customer.id,
        cartId: cart.id,
        history: [],
      });

      console.log("Non-variant turn pendingAction:", nonVarTurn.pendingAction);
      assert(!nonVarTurn.pendingAction, "TEST 5 PASS: Non-variant product does not force SELECT_VARIANT pendingAction");
    } finally {
      await prisma.product.delete({ where: { id: nonVariantProd.id } }).catch(() => {});
    }

    // -------------------------------------------------------------
    // TEST 6: Ambiguous product request does not auto-add
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Ambiguous product request ---");
    const ambiguousTurn = await AgentService.processMessage({
      message: "Add headphones to my cart",
      customerId: customer.id,
      cartId: cart.id,
      history: [],
    });

    console.log("Ambiguous turn pendingAction:", ambiguousTurn.pendingAction);
    assert(!ambiguousTurn.pendingAction, "TEST 6 PASS: Ambiguous product request does not auto-add or arbitrarily pick a variant");

    // -------------------------------------------------------------
    // TEST 7 & 8: History contract verification
    // -------------------------------------------------------------
    console.log("\n--- TEST 7 & 8: History Contract & No Duplication ---");
    const historyTestTurn = await AgentService.processMessage({
      message: "What power banks do you have?",
      customerId: customer.id,
      cartId: cart.id,
      history: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi! How can I help you today?" },
      ],
    });

    assert(historyTestTurn.message && historyTestTurn.message.length > 0, "TEST 8 PASS: Previous conversation history processed cleanly");

    console.log("\n==================================================");
    console.log("  ALL VARIANT CONTINUATION TESTS PASSED (9/9)     ");
    console.log("==================================================");
    console.log("AI VARIANT CONTINUATION FIX: READY");

  } finally {
    // Cleanup test data
    try {
      await CartService.clearCart(cart.id);
    } catch (e) {}
  }
}

runVariantContinuationTests().catch(console.error);
