import assert from "assert";
import crypto from "crypto";
import { prisma } from "../apps/backend/src/config/database.js";
import { config } from "../apps/backend/src/config/env.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";
import { AuditService } from "../apps/backend/src/audit/audit.service.js";
import { AgentService } from "../apps/backend/src/agent/agent.service.js";
import { MerchantAnalyticsService } from "../apps/backend/src/merchant-analytics/merchant-analytics.service.js";
import { CommerceEventType } from "../apps/backend/src/generated/prisma/index.js";

async function runFinalValidation() {
  console.log("=================================================================");
  console.log("          FINAL END-TO-END VALIDATION (FLOW 1, 2, 3)             ");
  console.log("=================================================================\n");

  console.log("--- RESETTING DATABASE TO BASELINE ZERO ---");
  await prisma.commerceEvent.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});

  const customer = await prisma.customer.upsert({
    where: { email: "customer@mercora.ai" },
    update: {},
    create: { email: "customer@mercora.ai", name: "Demo Customer" },
  });

  const products = await prisma.product.findMany({ where: { active: true }, include: { variants: true } });
  const mouse = products.find((p) => p.name.toLowerCase().includes("mouse")) || products[0];
  const keyboard = products.find((p) => p.name.toLowerCase().includes("keyboard")) || products[1];

  // -----------------------------------------------------------------
  // FLOW 1: Direct Purchase
  // -----------------------------------------------------------------
  console.log("--- FLOW 1: DIRECT PURCHASE ---");
  const cart1 = await CartService.createOrGetActiveCart(customer.id);
  const item1 = await CartService.addCartItem(cart1.id, {
    productId: mouse.id,
    variantId: mouse.variants[0]?.id || null,
    quantity: 1,
    source: "DIRECT",
  });
  console.log(`CartItem 1: source=${item1.source}, sourceEventId=${item1.sourceEventId}`);

  const order1 = await OrderService.createOrder({ cartId: cart1.id });
  const orderItem1 = order1.items[0];
  console.log(`OrderItem 1: source=${orderItem1.source}, sourceEventId=${orderItem1.sourceEventId}`);

  const payInit1 = await PaymentService.createRazorpayOrder({ orderId: order1.id, customerId: customer.id });
  const payId1 = `pay_direct_${Date.now()}`;
  const sig1 = crypto.createHmac("sha256", config.RAZORPAY_KEY_SECRET!).update(`${payInit1.razorpayOrderId}|${payId1}`).digest("hex");
  await PaymentService.verifyRazorpayPayment({
    mercoraOrderId: order1.id,
    razorpay_order_id: payInit1.razorpayOrderId,
    razorpay_payment_id: payId1,
    razorpay_signature: sig1,
    customerId: customer.id,
  });

  const summary1 = await MerchantAnalyticsService.getSummary("30d");
  console.log(`Dashboard Post-Flow 1: Paid Orders=${summary1.paidOrders}, AI-Assisted=${summary1.aiAssistedOrders}, Revenue=₹${summary1.revenue}`);
  assert.strictEqual(summary1.paidOrders, 1);
  assert.strictEqual(summary1.aiAssistedOrders, 0);

  // -----------------------------------------------------------------
  // FLOW 2: AI Recommendation Purchase
  // -----------------------------------------------------------------
  console.log("\n--- FLOW 2: AI RECOMMENDATION PURCHASE ---");
  const recAgentRes = await AgentService.processMessage({
    message: "Recommend a high performance mouse under 5000",
    customerId: customer.id,
  });

  console.log("recAgentRes products:", JSON.stringify(recAgentRes.products, null, 2));
  const recProd = recAgentRes.products?.find((p: any) => p.aiAttributionSource === "AI_RECOMMENDATION" || p.source === "recommendation" || (p.sourceEventId && p.id));
  assert(recProd && recProd.sourceEventId, "AI recommendation product has sourceEventId");
  console.log(`AI Recommendation Event ID: ${recProd.sourceEventId}`);

  const cart2 = await CartService.createOrGetActiveCart(customer.id);
  const recProdVariant = await prisma.productVariant.findFirst({ where: { productId: recProd.id } });
  const item2 = await CartService.addCartItem(cart2.id, {
    productId: recProd.id,
    variantId: recProd.hasVariants ? recProdVariant?.id || null : null,
    quantity: 1,
    source: "AI_RECOMMENDATION",
    sourceEventId: recProd.sourceEventId,
  });
  console.log(`CartItem 2: source=${item2.source}, sourceEventId=${item2.sourceEventId}`);
  assert.strictEqual(item2.source, "AI_RECOMMENDATION");

  const order2 = await OrderService.createOrder({ cartId: cart2.id });
  const orderItem2 = order2.items[0];
  console.log(`OrderItem 2: source=${orderItem2.source}, sourceEventId=${orderItem2.sourceEventId}`);
  assert.strictEqual(orderItem2.source, "AI_RECOMMENDATION");

  const payInit2 = await PaymentService.createRazorpayOrder({ orderId: order2.id, customerId: customer.id });
  const payId2 = `pay_rec_${Date.now()}`;
  const sig2 = crypto.createHmac("sha256", config.RAZORPAY_KEY_SECRET!).update(`${payInit2.razorpayOrderId}|${payId2}`).digest("hex");
  await PaymentService.verifyRazorpayPayment({
    mercoraOrderId: order2.id,
    razorpay_order_id: payInit2.razorpayOrderId,
    razorpay_payment_id: payId2,
    razorpay_signature: sig2,
    customerId: customer.id,
  });

  const summary2 = await MerchantAnalyticsService.getSummary("30d");
  console.log(`Dashboard Post-Flow 2: Paid Orders=${summary2.paidOrders}, AI-Assisted=${summary2.aiAssistedOrders}, AI Revenue=₹${summary2.aiAssistedRevenue}`);
  assert.strictEqual(summary2.paidOrders, 2);
  assert.strictEqual(summary2.aiAssistedOrders, 1);
  assert(Number(summary2.aiAssistedRevenue) > 0, "AI Assisted Revenue > 0");

  // -----------------------------------------------------------------
  // FLOW 3: AI Cross-Sell / Accessory Purchase
  // -----------------------------------------------------------------
  console.log("\n--- FLOW 3: AI CROSS-SELL / ACCESSORY PURCHASE ---");
  const smartwatch = products.find((p) => p.slug === "mercora-horizon") || products[0];
  const csAgentRes = await AgentService.processMessage({
    message: `Suggest cross-sell accessories for product ${smartwatch.id}`,
    customerId: customer.id,
  });

  console.log("csAgentRes products:", JSON.stringify(csAgentRes.products, null, 2));
  const csProd = csAgentRes.products?.find((p: any) => p.aiAttributionSource === "AI_CROSS_SELL" || p.aiAttributionSource === "AI_ACCESSORY" || p.source === "cross-sell" || p.source === "accessory" || p.sourceEventId);
  assert(csProd && csProd.sourceEventId, "AI cross-sell product has sourceEventId");
  console.log(`AI Cross-Sell Event ID: ${csProd.sourceEventId}`);

  const cart3 = await CartService.createOrGetActiveCart(customer.id);
  const csProdVariant = await prisma.productVariant.findFirst({ where: { productId: csProd.id } });
  const item3 = await CartService.addCartItem(cart3.id, {
    productId: csProd.id,
    variantId: csProd.hasVariants ? csProdVariant?.id || null : null,
    quantity: 1,
    source: csProd.aiAttributionSource || "AI_CROSS_SELL",
    sourceEventId: csProd.sourceEventId,
  });
  console.log(`CartItem 3: source=${item3.source}, sourceEventId=${item3.sourceEventId}`);

  const acceptedEvt = await prisma.commerceEvent.findFirst({
    where: {
      type: { in: [CommerceEventType.CROSS_SELL_ACCEPTED, CommerceEventType.ACCESSORY_ACCEPTED] },
      cartId: cart3.id,
    },
  });
  assert(acceptedEvt, "CROSS_SELL_ACCEPTED or ACCESSORY_ACCEPTED event recorded");
  console.log(`Accepted CommerceEvent ID: ${acceptedEvt.id}, Type: ${acceptedEvt.type}, Uplift: ₹${acceptedEvt.acceptedUplift}`);

  const order3 = await OrderService.createOrder({ cartId: cart3.id });
  const orderItem3 = order3.items[0];
  console.log(`OrderItem 3: source=${orderItem3.source}, sourceEventId=${orderItem3.sourceEventId}`);

  const payInit3 = await PaymentService.createRazorpayOrder({ orderId: order3.id, customerId: customer.id });
  const payId3 = `pay_cs_${Date.now()}`;
  const sig3 = crypto.createHmac("sha256", config.RAZORPAY_KEY_SECRET!).update(`${payInit3.razorpayOrderId}|${payId3}`).digest("hex");
  await PaymentService.verifyRazorpayPayment({
    mercoraOrderId: order3.id,
    razorpay_order_id: payInit3.razorpayOrderId,
    razorpay_payment_id: payId3,
    razorpay_signature: sig3,
    customerId: customer.id,
  });

  const summary3 = await MerchantAnalyticsService.getSummary("30d");
  console.log(`Dashboard Post-Flow 3: Paid Orders=${summary3.paidOrders}, AI-Assisted=${summary3.aiAssistedOrders}, Accepted Growth Uplift=₹${summary3.acceptedGrowthValue}`);
  assert.strictEqual(summary3.paidOrders, 3);
  assert.strictEqual(summary3.aiAssistedOrders, 2);
  assert(Number(summary3.acceptedGrowthValue) > 0, "Accepted Growth Uplift > 0");

  console.log("\n=========================================================");
  console.log("            ALL 3 FLOWS VERIFIED WITH 100% SUCCESS       ");
  console.log("=========================================================\n");

  await prisma.$disconnect();
}

runFinalValidation();
