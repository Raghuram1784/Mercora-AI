import { AgentService } from "../apps/backend/src/agent/agent.service.js";
import { groq } from "../apps/backend/src/agent/groq.client.js";
import { prisma } from "../apps/backend/src/config/database.js";
import assert from "node:assert";

// Mock Groq API calls to prevent TPD rate limit errors during intent gate regression testing
const originalCreate = groq.chat.completions.create.bind(groq.chat.completions);
(groq.chat.completions as any).create = async (params: any) => {
  const lastMsg = params.messages[params.messages.length - 1];
  const content = (lastMsg?.content || "").toLowerCase();

  // If previous turn was a tool output, return assistant completion
  if (lastMsg?.role === "tool") {
    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: "Here are the details for your request.",
          },
        },
      ],
    };
  }

  // Explicit add / cart queries -> call search_products or get_product_details
  if (content.includes("add") || content.includes("cart")) {
    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_mock_get",
                type: "function",
                function: {
                  name: "get_product_details",
                  arguments: JSON.stringify({ productId: "bffa036f-2810-402b-9f59-ec605936056f" }),
                },
              },
            ],
          },
        },
      ],
    };
  }

  // Recommendation / advice / discovery queries -> call recommend_products
  if (content.includes("recommend") || content.includes("buy") || content.includes("get") || content.includes("take") || content.includes("headphone")) {
    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_mock_rec",
                type: "function",
                function: {
                  name: "recommend_products",
                  arguments: JSON.stringify({ category: "Headphones" }),
                },
              },
            ],
          },
        },
      ],
    };
  }

  // Conversational / affirmative answers
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: "Understood. How else can I assist you?",
        },
      },
    ],
  };
};

async function runIntentGateTests() {
  console.log("==================================================");
  console.log("  MERCORA AI - AGENT INTENT GATE REGRESSION TEST  ");
  console.log("==================================================\n");

  const merchant = await prisma.merchant.findFirst();
  assert(merchant, "Merchant must exist in database");

  const customer = await prisma.customer.findFirst();
  assert(customer, "Customer must exist in database");

  const cart = await prisma.cart.create({
    data: {
      customerId: customer.id,
      status: "ACTIVE",
    },
  });

  const reqBase = {
    customerId: customer.id,
    cartId: cart.id,
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: "Which headphones should I buy under ₹5000 for travel?"
    // -------------------------------------------------------------
    console.log("--- TEST 1: Buy query should NOT authorize cart mutation or variant modal ---");
    const res1 = await AgentService.processMessage({
      ...reqBase,
      message: "Which headphones should I buy under ₹5000 for travel?",
      history: [],
    });

    const addActions1 = res1.actions.filter((a) => a.tool === "add_to_cart" && a.status === "success");
    assert.strictEqual(addActions1.length, 0, "TEST 1 FAIL: add_to_cart must NOT succeed on recommendation query");
    assert.strictEqual(res1.pendingAction, null, "TEST 1 FAIL: pendingAction must be null on recommendation query");
    console.log("✅ TEST 1 PASS: Buy recommendation query returned recommendations only, no pendingAction & no cart mutation");

    // -------------------------------------------------------------
    // TEST 2: "What headphones can I get under ₹5000?"
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Get query should NOT authorize cart mutation ---");
    const res2 = await AgentService.processMessage({
      ...reqBase,
      message: "What headphones can I get under ₹5000?",
      history: [],
    });

    const addActions2 = res2.actions.filter((a) => a.tool === "add_to_cart" && a.status === "success");
    assert.strictEqual(addActions2.length, 0, "TEST 2 FAIL: add_to_cart must NOT succeed on get query");
    assert.strictEqual(res2.pendingAction, null, "TEST 2 FAIL: pendingAction must be null on get query");
    console.log("✅ TEST 2 PASS: Get discovery query returned recommendations only");

    // -------------------------------------------------------------
    // TEST 3: "Which headphone should I take for travel?"
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Take query should NOT authorize cart mutation ---");
    const res3 = await AgentService.processMessage({
      ...reqBase,
      message: "Which headphone should I take for travel?",
      history: [],
    });

    const addActions3 = res3.actions.filter((a) => a.tool === "add_to_cart" && a.status === "success");
    assert.strictEqual(addActions3.length, 0, "TEST 3 FAIL: add_to_cart must NOT succeed on take query");
    assert.strictEqual(res3.pendingAction, null, "TEST 3 FAIL: pendingAction must be null on take query");
    console.log("✅ TEST 3 PASS: Take query returned recommendations only");

    // -------------------------------------------------------------
    // TEST 4: "Add the Travel Headphones to my cart"
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Explicit add request SHOULD authorize cart intent & return SELECT_VARIANT ---");
    const res4 = await AgentService.processMessage({
      ...reqBase,
      message: "Add the Travel Headphones to my cart",
      history: [
        { role: "user", content: "Which headphones should I buy under ₹5000 for travel?" },
        { role: "assistant", content: res1.message },
      ],
    });

    assert.notStrictEqual(res4.pendingAction, null, "TEST 4 FAIL: pendingAction must be returned for explicit add");
    assert.strictEqual(res4.pendingAction?.type, "SELECT_VARIANT", "TEST 4 FAIL: pendingAction type must be SELECT_VARIANT");
    console.log("✅ TEST 4 PASS: Explicit add request returned SELECT_VARIANT pendingAction for Travel Headphones");

    // -------------------------------------------------------------
    // TEST 5: "Add this to cart" with prior context
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Add this to cart with prior context ---");
    const res5 = await AgentService.processMessage({
      ...reqBase,
      message: "Add this to cart",
      history: [
        { role: "user", content: "Which headphones should I buy under ₹5000 for travel?" },
        { role: "assistant", content: "I recommend the Travel Headphones for ₹3,499." },
      ],
    });

    assert.notStrictEqual(res5.pendingAction, null, "TEST 5 FAIL: pendingAction must be returned for 'Add this to cart'");
    assert.strictEqual(res5.pendingAction?.type, "SELECT_VARIANT", "TEST 5 FAIL: pendingAction type must be SELECT_VARIANT");
    console.log("✅ TEST 5 PASS: 'Add this to cart' with prior context authorized variant selection");

    // -------------------------------------------------------------
    // TEST 6: "Which headphone do you recommend?"
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Recommend query should NOT authorize cart mutation ---");
    const res6 = await AgentService.processMessage({
      ...reqBase,
      message: "Which headphone do you recommend?",
      history: [],
    });

    const addActions6 = res6.actions.filter((a) => a.tool === "add_to_cart" && a.status === "success");
    assert.strictEqual(addActions6.length, 0, "TEST 6 FAIL: add_to_cart must NOT succeed on recommend query");
    assert.strictEqual(res6.pendingAction, null, "TEST 6 FAIL: pendingAction must be null on recommend query");
    console.log("✅ TEST 6 PASS: Recommend query returned recommendations only");

    // -------------------------------------------------------------
    // TEST 7: Standalone "yes" in fresh chat
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Standalone 'yes' in fresh chat without prior context ---");
    const res7 = await AgentService.processMessage({
      ...reqBase,
      message: "yes",
      history: [],
    });

    const addActions7 = res7.actions.filter((a) => a.tool === "add_to_cart" && a.status === "success");
    assert.strictEqual(addActions7.length, 0, "TEST 7 FAIL: add_to_cart must NOT succeed on standalone 'yes'");
    assert.strictEqual(res7.pendingAction, null, "TEST 7 FAIL: pendingAction must be null on standalone 'yes'");
    console.log("✅ TEST 7 PASS: Standalone 'yes' without confirmation prompt rejected");

    // -------------------------------------------------------------
    // TEST 8: Contextual "yes" following assistant confirmation prompt
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Contextual 'yes' following assistant confirmation prompt ---");
    const res8 = await AgentService.processMessage({
      ...reqBase,
      message: "yes",
      history: [
        { role: "user", content: "Show me headphones" },
        { role: "assistant", content: "Would you like me to add the Travel Headphones to your cart?" },
      ],
    });

    assert.notStrictEqual(res8.pendingAction, null, "TEST 8 FAIL: pendingAction must be returned for contextual 'yes'");
    assert.strictEqual(res8.pendingAction?.type, "SELECT_VARIANT", "TEST 8 FAIL: pendingAction type must be SELECT_VARIANT");
    console.log("✅ TEST 8 PASS: Contextual 'yes' authorized variant selection");

    // -------------------------------------------------------------
    // TEST 9: "Should I buy the Travel Headphones?"
    // -------------------------------------------------------------
    console.log("\n--- TEST 9: 'Should I buy the Travel Headphones?' advice query ---");
    const res9 = await AgentService.processMessage({
      ...reqBase,
      message: "Should I buy the Travel Headphones?",
      history: [],
    });

    const addActions9 = res9.actions.filter((a) => a.tool === "add_to_cart" && a.status === "success");
    assert.strictEqual(addActions9.length, 0, "TEST 9 FAIL: add_to_cart must NOT succeed on advice query");
    assert.strictEqual(res9.pendingAction, null, "TEST 9 FAIL: pendingAction must be null for 'Should I buy the Travel Headphones?'");
    console.log("✅ TEST 9 PASS: 'Should I buy the Travel Headphones?' returned advice only without modal/cart mutation");

    // -------------------------------------------------------------
    // TEST 10: "Should I buy this?" with previous recommendation context
    // -------------------------------------------------------------
    console.log("\n--- TEST 10: 'Should I buy this?' advice query with prior context ---");
    const res10 = await AgentService.processMessage({
      ...reqBase,
      message: "Should I buy this?",
      history: [
        { role: "user", content: "Which headphones should I buy under ₹5000 for travel?" },
        { role: "assistant", content: "I recommend the Travel Headphones for ₹3,499." },
      ],
    });

    const addActions10 = res10.actions.filter((a) => a.tool === "add_to_cart" && a.status === "success");
    assert.strictEqual(addActions10.length, 0, "TEST 10 FAIL: add_to_cart must NOT succeed on 'Should I buy this?'");
    assert.strictEqual(res10.pendingAction, null, "TEST 10 FAIL: pendingAction must be null for 'Should I buy this?'");
    console.log("✅ TEST 10 PASS: 'Should I buy this?' with prior context returned advice only without modal/cart mutation");

    // -------------------------------------------------------------
    // TEST 11: Explicit "Add the Travel Headphones to my cart"
    // -------------------------------------------------------------
    console.log("\n--- TEST 11: Explicit add command after advice query ---");
    const res11 = await AgentService.processMessage({
      ...reqBase,
      message: "Add the Travel Headphones to my cart",
      history: [
        { role: "user", content: "Should I buy the Travel Headphones?" },
        { role: "assistant", content: res9.message },
      ],
    });

    assert.notStrictEqual(res11.pendingAction, null, "TEST 11 FAIL: pendingAction must be returned for explicit add command");
    assert.strictEqual(res11.pendingAction?.type, "SELECT_VARIANT", "TEST 11 FAIL: pendingAction type must be SELECT_VARIANT");
    console.log("✅ TEST 11 PASS: Explicit add command after advice query returned SELECT_VARIANT pendingAction");

    console.log("\n==================================================");
    console.log("  ALL AGENT INTENT GATE TESTS PASSED (11/11)     ");
    console.log("==================================================");
  } finally {
    // Clean up temporary test cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });
  }
}

runIntentGateTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
