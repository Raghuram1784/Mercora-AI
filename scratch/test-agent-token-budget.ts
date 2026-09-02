import { getToolsForIntent, getGroqToolsConfigForNames } from "../apps/backend/src/agent/tool-registry.js";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";
import { groq } from "../apps/backend/src/agent/groq.client.js";
import { prisma } from "../apps/backend/src/config/database.js";
import assert from "node:assert";

async function runTokenBudgetTests() {
  console.log("==================================================");
  console.log("  MERCORA AI - GROQ TOKEN BUDGET REGRESSION TEST  ");
  console.log("==================================================\n");

  // -------------------------------------------------------------
  // TEST 1: Recommendation tool filtering
  // -------------------------------------------------------------
  console.log("--- TEST 1: Recommendation Tool Filtering ---");
  const recMsg = "Which headphones should I buy under ₹5000 for travel?";
  const recTools = getToolsForIntent(recMsg);
  console.log("Exposed tools for recommendation:", recTools);

  assert(recTools.includes("recommend_products"), "recommend_products must be present");
  assert(!recTools.includes("add_to_cart"), "add_to_cart must NOT be present for recommendation");
  assert(!recTools.includes("create_order"), "create_order must NOT be present for recommendation");
  assert(!recTools.includes("get_upsell_suggestions"), "get_upsell_suggestions must NOT be present for recommendation");
  assert(!recTools.includes("get_cross_sell_suggestions"), "get_cross_sell_suggestions must NOT be present for recommendation");
  console.log("✅ TEST 1 PASS: Irrelevant commerce tools excluded from recommendation query");

  // -------------------------------------------------------------
  // TEST 2: Explicit Cart Request tool filtering
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Explicit Cart Request Tool Filtering ---");
  const cartMsg = "Add the Travel Headphones to my cart";
  const cartTools = getToolsForIntent(cartMsg);
  console.log("Exposed tools for explicit add:", cartTools);

  assert(cartTools.includes("add_to_cart"), "add_to_cart must be present for explicit add");
  assert(cartTools.includes("get_product_details"), "get_product_details must be present for explicit add");
  assert(!cartTools.includes("create_order"), "create_order must NOT be present for explicit add");
  assert(!cartTools.includes("recommend_products"), "recommend_products must NOT be present for explicit add");
  assert(!cartTools.includes("get_upsell_suggestions"), "get_upsell_suggestions must NOT be present for explicit add");
  console.log("✅ TEST 2 PASS: Only cart/product tools exposed for explicit add request");

  // -------------------------------------------------------------
  // TEST 3: Upsell tool filtering
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: Upsell Tool Filtering ---");
  const upsellMsg = "Show me upgrade options for this product";
  const upsellTools = getToolsForIntent(upsellMsg);
  console.log("Exposed tools for upsell:", upsellTools);

  assert(upsellTools.includes("get_upsell_suggestions"), "get_upsell_suggestions must be present for upsell");
  assert(!upsellTools.includes("add_to_cart"), "add_to_cart must NOT be present for upsell");
  assert(!upsellTools.includes("create_order"), "create_order must NOT be present for upsell");
  console.log("✅ TEST 3 PASS: Only upsell/product tools exposed for upsell request");

  // -------------------------------------------------------------
  // TEST 4: Checkout tool filtering
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Checkout Tool Filtering ---");
  const checkoutMsg = "Proceed to checkout";
  const checkoutTools = getToolsForIntent(checkoutMsg);
  console.log("Exposed tools for checkout:", checkoutTools);

  assert(checkoutTools.includes("create_order"), "create_order must be present for checkout");
  assert(checkoutTools.includes("get_cart"), "get_cart must be present for checkout");
  assert(!checkoutTools.includes("recommend_products"), "recommend_products must NOT be present for checkout");
  assert(!checkoutTools.includes("get_upsell_suggestions"), "get_upsell_suggestions must NOT be present for checkout");
  console.log("✅ TEST 4 PASS: Only cart/order tools exposed for checkout request");

  // -------------------------------------------------------------
  // TEST 5: Post-tool synthesis call tool schema omission check
  // -------------------------------------------------------------
  console.log("\n--- TEST 5: Tool Schema Omission in Post-Tool Synthesis ---");
  const recordedPayloads: any[] = [];
  const originalCreate = groq.chat.completions.create.bind(groq.chat.completions);
  
  (groq.chat.completions as any).create = async (params: any) => {
    recordedPayloads.push(params);
    const lastMsg = params.messages[params.messages.length - 1];

    if (lastMsg?.role === "tool") {
      return {
        choices: [
          {
            message: {
              role: "assistant",
              content: "Here is your updated cart.",
            },
          },
        ],
      };
    }

    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_mock_cart",
                type: "function",
                function: {
                  name: "get_cart",
                  arguments: JSON.stringify({}),
                },
              },
            ],
          },
        },
      ],
    };
  };

  const merchant = await prisma.merchant.findFirst();
  assert(merchant, "Merchant must exist");
  const customer = await prisma.customer.findFirst();
  assert(customer, "Customer must exist");

  const cart = await prisma.cart.create({
    data: { customerId: customer.id, status: "ACTIVE" },
  });

  try {
    await AgentService.processMessage({
      customerId: customer.id,
      cartId: cart.id,
      message: "Check my cart",
      history: [],
    });

    console.log(`Recorded Groq payload rounds: ${recordedPayloads.length}`);
    if (recordedPayloads.length > 1) {
      const round2Payload = recordedPayloads[1];
      assert.strictEqual(round2Payload.tools, undefined, "TEST 5 FAIL: tools must be undefined in post-tool synthesis payload");
      assert.strictEqual(round2Payload.tool_choice, undefined, "TEST 5 FAIL: tool_choice must be undefined in post-tool synthesis payload");
      console.log("✅ TEST 5 PASS: Secondary post-tool synthesis payload omits tool definitions");
    } else {
      console.log("✅ TEST 5 PASS: Skipped post-tool synthesis call entirely (terminal fast path active)");
    }
  } finally {
    (groq.chat.completions as any).create = originalCreate;
    await prisma.cart.delete({ where: { id: cart.id } });
  }

  console.log("\n==================================================");
  console.log("  ALL TOKEN BUDGET TESTS PASSED (5/5)             ");
  console.log("==================================================");
}

runTokenBudgetTests().catch((err) => {
  console.error("Token budget test failed:", err);
  process.exit(1);
});
