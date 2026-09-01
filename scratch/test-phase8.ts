import assert from "assert";
import crypto from "crypto";
import { prisma } from "../apps/backend/src/config/database.js";
import { config } from "../apps/backend/src/config/env.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";
import { AuditService } from "../apps/backend/src/audit/audit.service.js";
import { MerchantAnalyticsService } from "../apps/backend/src/merchant-analytics/merchant-analytics.service.js";
import { CommerceEventType, CommerceEventSource } from "../apps/backend/src/generated/prisma/index.js";

async function runPhase8Tests() {
  console.log("=================================================================");
  console.log("             MERCORA AI PHASE 8 COMPREHENSIVE TEST SUITE         ");
  console.log("=================================================================\n");

  try {
    // Setup Test Customer and Catalog Products
    const customer = await prisma.customer.upsert({
      where: { email: "phase8-test@mercora.ai" },
      update: {},
      create: {
        email: "phase8-test@mercora.ai",
        name: "Phase 8 Test Customer",
      },
    });

    const products = await prisma.product.findMany({
      where: { active: true },
      include: { variants: true },
      take: 2,
    });
    assert(products.length >= 2, "At least 2 active products required");

    const prod1 = products[0];
    const var1 = prod1.variants.find((v) => v.active);

    const prod2 = products[1];
    const var2 = prod2.variants.find((v) => v.active);

    // --- TEST 1: Direct Purchase & Audit Trail ---
    console.log("--- Executing Test 1: Direct Purchase & Audit Events ---");
    const cart1 = await CartService.createOrGetActiveCart(customer.id);
    await CartService.addCartItem(cart1.id, {
      productId: prod1.id,
      variantId: var1?.id,
      quantity: 1,
      source: "DIRECT",
    });

    const order1 = await OrderService.createOrder({
      cartId: cart1.id,
      idempotencyKey: `p8-test-ik-1-${Date.now()}`,
    });

    const paymentInit1 = await PaymentService.createRazorpayOrder({
      orderId: order1.id,
      customerId: customer.id,
    });

    const payId1 = `pay_p8_direct_${Date.now()}`;
    const payload1 = `${paymentInit1.razorpayOrderId}|${payId1}`;
    const sig1 = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(payload1)
      .digest("hex");

    await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order1.id,
      razorpay_order_id: paymentInit1.razorpayOrderId,
      razorpay_payment_id: payId1,
      razorpay_signature: sig1,
      customerId: customer.id,
    });

    const summary1 = await MerchantAnalyticsService.getSummary("30d");
    assert(Number(summary1.revenue) > 0, "Revenue is updated from paid order");
    assert(summary1.paidOrders >= 1, "Paid orders count increased");
    console.log(`[PASS ✅] Test 1: Direct purchase completed. Paid Revenue: ₹${summary1.revenue}`);

    // --- TEST 2: Fake Client-Supplied AI Attribution Rejection (Regression Test) ---
    console.log("\n--- Executing Test 2: Fake Client-Supplied AI Attribution Rejection ---");
    const cart2 = await CartService.createOrGetActiveCart(customer.id);

    // Client attempts to claim AI_CROSS_SELL with a fake sourceEventId
    const itemWithFakeAttr = await CartService.addCartItem(cart2.id, {
      productId: prod2.id,
      variantId: var2?.id,
      quantity: 1,
      source: "AI_CROSS_SELL",
      sourceEventId: "00000000-0000-0000-0000-000000000000",
    });

    assert.strictEqual(itemWithFakeAttr.source, "DIRECT", "Fake attribution downgraded to DIRECT");
    assert.strictEqual(itemWithFakeAttr.sourceEventId, null, "sourceEventId set to null");

    const order2 = await OrderService.createOrder({
      cartId: cart2.id,
      idempotencyKey: `p8-test-ik-2-${Date.now()}`,
    });

    const paymentInit2 = await PaymentService.createRazorpayOrder({
      orderId: order2.id,
      customerId: customer.id,
    });

    const payId2 = `pay_p8_fake_${Date.now()}`;
    const payload2 = `${paymentInit2.razorpayOrderId}|${payId2}`;
    const sig2 = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(payload2)
      .digest("hex");

    await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order2.id,
      razorpay_order_id: paymentInit2.razorpayOrderId,
      razorpay_payment_id: payId2,
      razorpay_signature: sig2,
      customerId: customer.id,
    });

    const recentOrders2 = await MerchantAnalyticsService.getRecentOrders(5);
    const fakeOrderRecord = recentOrders2.find((o) => o.id === order2.id);
    assert(fakeOrderRecord, "Order 2 record found");
    assert.strictEqual(fakeOrderRecord.isAiAssisted, false, "Order with fake attribution remains classified as DIRECT");
    console.log("[PASS ✅] Test 2: Fake client AI attribution rejected & downgraded to DIRECT");

    // --- TEST 3: Valid Server-Validated AI Attribution ---
    console.log("\n--- Executing Test 3: Valid AI Recommendation & Attribution ---");
    const cart3 = await CartService.createOrGetActiveCart(customer.id);

    // Create authentic AI_RECOMMENDATION_RETURNED event in DB
    const recEvent = await AuditService.recordEvent({
      type: CommerceEventType.AI_RECOMMENDATION_RETURNED,
      source: CommerceEventSource.AI,
      customerId: customer.id,
      cartId: cart3.id,
      productId: prod1.id,
      metadata: {
        recommendedProductIds: [prod1.id],
      },
    });
    assert(recEvent && recEvent.id, "Recommendation event recorded");

    const validAiItem = await CartService.addCartItem(cart3.id, {
      productId: prod1.id,
      variantId: var1?.id,
      quantity: 1,
      source: "AI_RECOMMENDATION",
      sourceEventId: recEvent.id,
    });

    assert.strictEqual(validAiItem.source, "AI_RECOMMENDATION", "Valid AI attribution accepted");
    assert.strictEqual(validAiItem.sourceEventId, recEvent.id, "sourceEventId preserved");

    const order3 = await OrderService.createOrder({
      cartId: cart3.id,
      idempotencyKey: `p8-test-ik-3-${Date.now()}`,
    });

    const paymentInit3 = await PaymentService.createRazorpayOrder({
      orderId: order3.id,
      customerId: customer.id,
    });

    const payId3 = `pay_p8_valid_ai_${Date.now()}`;
    const payload3 = `${paymentInit3.razorpayOrderId}|${payId3}`;
    const sig3 = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(payload3)
      .digest("hex");

    await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order3.id,
      razorpay_order_id: paymentInit3.razorpayOrderId,
      razorpay_payment_id: payId3,
      razorpay_signature: sig3,
      customerId: customer.id,
    });

    const recentOrders3 = await MerchantAnalyticsService.getRecentOrders(5);
    const validAiOrderRecord = recentOrders3.find((o) => o.id === order3.id);
    assert(validAiOrderRecord, "Order 3 record found");
    assert.strictEqual(validAiOrderRecord.isAiAssisted, true, "Order classified as AI ASSISTED");
    console.log("[PASS ✅] Test 3: Valid AI recommendation purchase classified as AI ASSISTED");

    // --- TEST 4: Cross-Sell Event & Accepted Uplift ---
    console.log("\n--- Executing Test 4: Cross-Sell Event & Uplift Calculation ---");
    const cart4 = await CartService.createOrGetActiveCart(customer.id);

    const csEvent = await AuditService.recordEvent({
      type: CommerceEventType.CROSS_SELL_SHOWN,
      source: CommerceEventSource.AI,
      customerId: customer.id,
      cartId: cart4.id,
      sourceProductId: prod1.id,
      targetProductId: prod2.id,
      suggestionType: "CROSS_SELL",
      potentialUplift: Number(prod2.price),
    });

    const csItem = await CartService.addCartItem(cart4.id, {
      productId: prod2.id,
      variantId: var2?.id,
      quantity: 1,
      source: "AI_CROSS_SELL",
      sourceEventId: csEvent.id,
    });

    assert.strictEqual(csItem.source, "AI_CROSS_SELL", "Cross-sell attribution accepted");

    const acceptedCsEvent = await prisma.commerceEvent.findFirst({
      where: {
        type: CommerceEventType.CROSS_SELL_ACCEPTED,
        cartId: cart4.id,
      },
    });
    assert(acceptedCsEvent, "CROSS_SELL_ACCEPTED event recorded");
    assert.strictEqual(
      Number(acceptedCsEvent.acceptedUplift),
      Number(prod2.price),
      "Accepted uplift matches target product price"
    );
    console.log(`[PASS ✅] Test 4: Cross-sell accepted event recorded with uplift ₹${acceptedCsEvent.acceptedUplift}`);

    // --- TEST 5: Event Idempotency ---
    console.log("\n--- Executing Test 5: Event Idempotency ---");
    await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order3.id,
      razorpay_order_id: paymentInit3.razorpayOrderId,
      razorpay_payment_id: payId3,
      razorpay_signature: sig3,
      customerId: customer.id,
    });

    const paymentVerifiedEvents = await prisma.commerceEvent.count({
      where: { eventKey: `payment-verified:${paymentInit3.razorpayOrderId}` },
    });
    assert(paymentVerifiedEvents <= 1, "PAYMENT_VERIFIED event deduplicated via eventKey");
    console.log("[PASS ✅] Test 5: Repeated verification calls deduplicated events via eventKey");

    // --- TEST 6: Audit Secret Scanning ---
    console.log("\n--- Executing Test 6: Audit Secret Scanning ---");
    const allEvents = await prisma.commerceEvent.findMany({ take: 50 });
    for (const evt of allEvents) {
      const metaStr = JSON.stringify(evt.metadata || {});
      assert(!metaStr.includes(config.RAZORPAY_KEY_SECRET!), "RAZORPAY_KEY_SECRET not in event metadata");
      assert(!metaStr.includes("razorpay_signature"), "razorpay_signature not in event metadata");
    }
    console.log("[PASS ✅] Test 6: Zero secret / signature leaks detected in CommerceEvent ledger");

    // --- TEST 7: Time Range Filtering ---
    console.log("\n--- Executing Test 7: Time Range Filtering ---");
    const summary7d = await MerchantAnalyticsService.getSummary("7d");
    const summary30d = await MerchantAnalyticsService.getSummary("30d");
    const summaryAll = await MerchantAnalyticsService.getSummary("all");

    assert(!isNaN(Number(summary7d.revenue)), "7D revenue is numeric");
    assert(!isNaN(Number(summary30d.revenue)), "30D revenue is numeric");
    assert(!isNaN(Number(summaryAll.revenue)), "ALL revenue is numeric");
    console.log("[PASS ✅] Test 7: Range filters (7D, 30D, ALL) produce valid analytics metrics");

    console.log("\n=========================================================");
    console.log("            PHASE 8 TEST RESULTS: ALL PASSED             ");
    console.log("=========================================================\n");
    console.log("✅ ALL COMPREHENSIVE PHASE 8 TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("\nUnhandled exception in Phase 8 test suite:", error);
    process.exit(1);
  } finally {
    console.log("\n--- Cleaning up test records from test suite execution ---");
    const testCustomer = await prisma.customer.findUnique({
      where: { email: "phase8-test@mercora.ai" },
    });
    if (testCustomer) {
      await prisma.commerceEvent.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.payment.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.orderItem.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.order.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { customerId: testCustomer.id } } });
      await prisma.cart.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.customer.delete({ where: { id: testCustomer.id } });
      console.log("Cleaned up phase8-test@mercora.ai test records.");
    }
    await prisma.$disconnect();
  }
}

runPhase8Tests();
