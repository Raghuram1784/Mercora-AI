import assert from "assert";
import crypto from "crypto";
import { prisma } from "../apps/backend/src/config/database.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { AuditService } from "../apps/backend/src/audit/audit.service.js";
import { MerchantAnalyticsService } from "../apps/backend/src/merchant-analytics/merchant-analytics.service.js";
import { CommerceEventType, CommerceEventSource } from "../apps/backend/src/generated/prisma/index.js";
import { config } from "../apps/backend/src/config/env.js";

async function runPhase9E2ETests() {
  console.log("=================================================================");
  console.log("       PHASE 9B: AUTOMATED BACKEND END-TO-END REGRESSION TESTS    ");
  console.log("=================================================================\n");

  const testEmail = "phase9-e2e@mercora.ai";
  let testCustomer: any = null;

  try {
    // 0. Pre-test cleanup
    const existing = await prisma.customer.findUnique({ where: { email: testEmail } });
    if (existing) {
      await prisma.commerceEvent.deleteMany({ where: { customerId: existing.id } });
      await prisma.payment.deleteMany({ where: { order: { customerId: existing.id } } });
      await prisma.orderItem.deleteMany({ where: { order: { customerId: existing.id } } });
      await prisma.order.deleteMany({ where: { customerId: existing.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { customerId: existing.id } } });
      await prisma.cart.deleteMany({ where: { customerId: existing.id } });
      await prisma.customer.delete({ where: { id: existing.id } });
    }

    testCustomer = await prisma.customer.create({
      data: {
        email: testEmail,
        name: "Phase 9 E2E Tester",
      },
    });

    console.log(`Created isolated E2E test customer: ${testCustomer.id} (${testEmail})\n`);

    // Fetch sample active products
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { variants: true },
      take: 3,
    });
    assert(products.length >= 2, "At least 2 products available for E2E tests");

    const prodA = products[0];
    const prodB = products[1];

    const varA = prodA.variants?.find((v) => v.active);
    const varB = prodB.variants?.find((v) => v.active);

    const secret = config.RAZORPAY_KEY_SECRET || "dummy_secret_for_test";

    // -------------------------------------------------------------------------
    // FLOW A: Direct Purchase
    // -------------------------------------------------------------------------
    console.log("--- FLOW A: Direct Purchase ---");
    const cartA = await CartService.createOrGetActiveCart(testCustomer.id);
    await CartService.addCartItem(cartA.id, {
      productId: prodA.id,
      variantId: varA?.id,
      quantity: 1,
      source: "DIRECT",
    });

    const orderA = await OrderService.createOrder({ customerId: testCustomer.id, cartId: cartA.id });
    const checkoutA = await PaymentService.createRazorpayOrder({ orderId: orderA.id, customerId: testCustomer.id });

    const payIdA = "pay_test_flow_a_" + Date.now();
    const sigA = crypto.createHmac("sha256", secret).update(`${checkoutA.razorpayOrderId}|${payIdA}`).digest("hex");

    const resA = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: orderA.id,
      razorpay_order_id: checkoutA.razorpayOrderId,
      razorpay_payment_id: payIdA,
      razorpay_signature: sigA,
      customerId: testCustomer.id,
    });

    assert.strictEqual(resA.order.status, "PAID");
    assert.strictEqual(resA.cart.status, "CONVERTED");
    assert.strictEqual(resA.nextCart.status, "ACTIVE");

    const orderItemA = await prisma.orderItem.findFirst({ where: { orderId: orderA.id } });
    assert.strictEqual(orderItemA?.source, "DIRECT");
    console.log("✅ Flow A (Direct Purchase) verified with status PAID & CONVERTED.\n");

    // -------------------------------------------------------------------------
    // FLOW B: AI Recommendation Purchase
    // -------------------------------------------------------------------------
    console.log("--- FLOW B: AI Recommendation Purchase ---");
    const recEvent = await AuditService.recordEvent({
      type: CommerceEventType.AI_RECOMMENDATION_RETURNED,
      source: CommerceEventSource.AI,
      customerId: testCustomer.id,
      cartId: resA.nextCart.id,
      targetProductId: prodB.id,
      metadata: { query: "Which headphones should I buy?", recommendedProductIds: [prodB.id] },
    });

    await CartService.addCartItem(resA.nextCart.id, {
      productId: prodB.id,
      variantId: varB?.id,
      quantity: 1,
      source: "AI_RECOMMENDATION",
      sourceEventId: recEvent.id,
    });

    const orderB = await OrderService.createOrder({ customerId: testCustomer.id, cartId: resA.nextCart.id });
    const checkoutB = await PaymentService.createRazorpayOrder({ orderId: orderB.id, customerId: testCustomer.id });

    const payIdB = "pay_test_flow_b_" + Date.now();
    const sigB = crypto.createHmac("sha256", secret).update(`${checkoutB.razorpayOrderId}|${payIdB}`).digest("hex");

    const resB = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: orderB.id,
      razorpay_order_id: checkoutB.razorpayOrderId,
      razorpay_payment_id: payIdB,
      razorpay_signature: sigB,
      customerId: testCustomer.id,
    });

    assert.strictEqual(resB.order.status, "PAID");
    const orderItemB = await prisma.orderItem.findFirst({ where: { orderId: orderB.id } });
    assert.strictEqual(orderItemB?.source, "AI_RECOMMENDATION");
    assert.strictEqual(orderItemB?.sourceEventId, recEvent.id);
    console.log("✅ Flow B (AI Recommendation Purchase) verified with AI_RECOMMENDATION attribution.\n");

    // -------------------------------------------------------------------------
    // FLOW C: Sequential Purchases & Handoff
    // -------------------------------------------------------------------------
    console.log("--- FLOW C: Sequential Purchase Handoff ---");
    assert.notStrictEqual(cartA.id, resA.nextCart.id, "Cart A converted, Cart B is active");
    assert.notStrictEqual(resA.nextCart.id, resB.nextCart.id, "Cart B converted, Cart C is active");

    const activeCartFinal = await CartService.createOrGetActiveCart(testCustomer.id);
    assert.strictEqual(activeCartFinal.id, resB.nextCart.id, "Fresh Cart C rehydrated successfully");
    console.log("✅ Flow C (Sequential Purchase Handoff) verified without browser refresh.\n");

    // -------------------------------------------------------------------------
    // FLOW D: Analytics Reconciliation Test
    // -------------------------------------------------------------------------
    console.log("--- FLOW D: Analytics Reconciliation ---");
    const totalPaidOrders = await prisma.order.count({
      where: { customerId: testCustomer.id, status: "PAID" },
    });
    assert.strictEqual(totalPaidOrders, 2, "Exactly 2 paid orders for test customer");

    const convertedCarts = await prisma.cart.count({
      where: { customerId: testCustomer.id, status: "CONVERTED" },
    });
    assert.strictEqual(convertedCarts, 2, "Exactly 2 converted carts for test customer");

    const activeCarts = await prisma.cart.count({
      where: { customerId: testCustomer.id, status: "ACTIVE" },
    });
    assert.strictEqual(activeCarts, 1, "Exactly 1 active cart for test customer");

    console.log("✅ Flow D (Analytics & Database Reconciliation) passed 100%.\n");

    console.log("=================================================================");
    console.log("       ALL PHASE 9B AUTOMATED E2E TESTS PASSED SUCCESSFULLY      ");
    console.log("=================================================================\n");
  } finally {
    if (testCustomer) {
      console.log(`Cleaning up test data for customer ${testCustomer.id}...`);
      await prisma.commerceEvent.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.payment.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.orderItem.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.order.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { customerId: testCustomer.id } } });
      await prisma.cart.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.customer.delete({ where: { id: testCustomer.id } });
      console.log("E2E Teardown completed successfully.\n");
    }
    await prisma.$disconnect();
  }
}

runPhase9E2ETests();
