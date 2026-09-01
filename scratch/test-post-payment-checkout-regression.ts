import assert from "assert";
import crypto from "crypto";
import { prisma } from "../apps/backend/src/config/database.js";
import { config } from "../apps/backend/src/config/env.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";

async function runPostPaymentCheckoutRegression() {
  console.log("=================================================================");
  console.log("    MERCORA AI POST-PAYMENT CHECKOUT REGRESSION SUITE            ");
  console.log("=================================================================\n");

  try {
    // 1. Setup Test Customer and Catalog Products
    const customer = await prisma.customer.upsert({
      where: { email: "checkout-regression@mercora.ai" },
      update: {},
      create: {
        email: "checkout-regression@mercora.ai",
        name: "Post-Payment Checkout Test Customer",
      },
    });

    const products = await prisma.product.findMany({
      where: { active: true },
      include: { variants: true },
      take: 2,
    });
    assert(products.length >= 2, "At least 2 active catalog products required for testing");

    const prodA = products[0];
    const varA = prodA.variants.find((v) => v.active);

    const prodB = products[1];
    const varB = prodB.variants.find((v) => v.active);

    // =========================================================================
    // TEST 1: Purchase Product A -> Verify -> Continue Shopping -> Add Product B -> Checkout Order B -> Verify
    // =========================================================================
    console.log("--- Executing Test 1: Sequential Different Product Checkout ---");

    // 1a. Add Product A to Cart A
    const cartA = await CartService.createOrGetActiveCart(customer.id);
    assert.strictEqual(cartA.status, "ACTIVE", "Cart A is initially ACTIVE");

    await CartService.addCartItem(cartA.id, {
      productId: prodA.id,
      variantId: varA?.id,
      quantity: 1,
    });

    // 1b. Create Order A
    const orderA = await OrderService.createOrder({
      cartId: cartA.id,
      idempotencyKey: `ik-reg-a-${Date.now()}`,
    });
    assert.strictEqual(orderA.status, "PENDING_PAYMENT", "Order A is PENDING_PAYMENT");

    const dbCartA = await prisma.cart.findUnique({ where: { id: cartA.id } });
    assert.strictEqual(dbCartA?.status, "CHECKOUT_PENDING", "Cart A transitioned to CHECKOUT_PENDING");

    // 1c. Pay Order A & Verify
    const razorpayA = await PaymentService.createRazorpayOrder({
      orderId: orderA.id,
      customerId: customer.id,
    });

    const payIdA = `pay_sim_a_${Date.now()}`;
    const payloadA = `${razorpayA.razorpayOrderId}|${payIdA}`;
    const sigA = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(payloadA)
      .digest("hex");

    const verifyA = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: orderA.id,
      razorpay_order_id: razorpayA.razorpayOrderId,
      razorpay_payment_id: payIdA,
      razorpay_signature: sigA,
      customerId: customer.id,
    });

    assert.strictEqual(verifyA.order.status, "PAID", "Order A status is PAID");
    assert.strictEqual(verifyA.cart.status, "CONVERTED", "Cart A status is CONVERTED");
    assert.strictEqual(verifyA.nextCart.status, "ACTIVE", "Fresh Cart B returned as ACTIVE");
    console.log(`[PASS ✅] Order A (${orderA.orderNumber}) PAID & Cart A CONVERTED.`);

    // 1d. Verify Cart A rejects modifications
    await assert.rejects(
      async () => {
        await CartService.addCartItem(cartA.id, {
          productId: prodB.id,
          variantId: varB?.id,
          quantity: 1,
        });
      },
      (err: any) => err.code === "CART_NOT_ACTIVE",
      "Cart A rejects modification with CART_NOT_ACTIVE"
    );

    // 1e. Continue Shopping: Add Product B to fresh Cart B
    const cartB = await CartService.createOrGetActiveCart(customer.id);
    assert.strictEqual(cartB.status, "ACTIVE", "Cart B is active for new shopping session");
    assert.notStrictEqual(cartB.id, cartA.id, "Cart B is a new distinct cart");

    const itemB = await CartService.addCartItem(cartB.id, {
      productId: prodB.id,
      variantId: varB?.id,
      quantity: 1,
    });
    assert(itemB && itemB.id, "Adding Product B to Cart B succeeds");

    // 1f. Create Order B from Cart B
    const orderB = await OrderService.createOrder({
      cartId: cartB.id,
      idempotencyKey: `ik-reg-b-${Date.now()}`,
    });

    assert.strictEqual(orderB.status, "PENDING_PAYMENT", "Order B is PENDING_PAYMENT");
    assert.notStrictEqual(orderB.id, orderA.id, "Order B is a separate new order ID");
    assert.notStrictEqual(orderB.orderNumber, orderA.orderNumber, "Order B has a distinct order number");
    console.log(`[PASS ✅] Created fresh Order B (${orderB.orderNumber}) from Cart B.`);

    // 1g. Pay Order B & Verify
    const razorpayB = await PaymentService.createRazorpayOrder({
      orderId: orderB.id,
      customerId: customer.id,
    });

    const payIdB = `pay_sim_b_${Date.now()}`;
    const payloadB = `${razorpayB.razorpayOrderId}|${payIdB}`;
    const sigB = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(payloadB)
      .digest("hex");

    const verifyB = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: orderB.id,
      razorpay_order_id: razorpayB.razorpayOrderId,
      razorpay_payment_id: payIdB,
      razorpay_signature: sigB,
      customerId: customer.id,
    });

    assert.strictEqual(verifyB.order.status, "PAID", "Order B status is PAID");
    assert.strictEqual(verifyB.cart.status, "CONVERTED", "Cart B status is CONVERTED");
    console.log(`[PASS ✅] Order B (${orderB.orderNumber}) PAID & Cart B CONVERTED.`);

    // =========================================================================
    // TEST 2: Purchase Product A again -> Quantity Increase -> Order C -> Verify
    // =========================================================================
    console.log("\n--- Executing Test 2: Repeat Purchase of Same Product with Quantity Adjustment ---");

    const cartC = await CartService.createOrGetActiveCart(customer.id);
    assert.strictEqual(cartC.status, "ACTIVE", "Cart C is active");
    assert.notStrictEqual(cartC.id, cartB.id, "Cart C is distinct from Cart B");

    // Add Product A with quantity 1
    const itemA2 = await CartService.addCartItem(cartC.id, {
      productId: prodA.id,
      variantId: varA?.id,
      quantity: 1,
    });

    // Increase quantity to 2
    await CartService.updateCartItem(cartC.id, itemA2.id, 2);

    const updatedCartC = await CartService.getCart(cartC.id);
    assert.strictEqual(updatedCartC.items[0].quantity, 2, "Cart C item quantity updated to 2");

    // Create Order C
    const orderC = await OrderService.createOrder({
      cartId: cartC.id,
      idempotencyKey: `ik-reg-c-${Date.now()}`,
    });

    assert.strictEqual(orderC.status, "PENDING_PAYMENT", "Order C is PENDING_PAYMENT");
    assert.strictEqual(orderC.items[0].quantity, 2, "Order C items snapshot contains quantity 2");
    assert.notStrictEqual(orderC.id, orderB.id, "Order C is a distinct new order ID");
    console.log(`[PASS ✅] Created Order C (${orderC.orderNumber}) with updated quantity 2.`);

    // Pay Order C & Verify
    const razorpayC = await PaymentService.createRazorpayOrder({
      orderId: orderC.id,
      customerId: customer.id,
    });

    const payIdC = `pay_sim_c_${Date.now()}`;
    const payloadC = `${razorpayC.razorpayOrderId}|${payIdC}`;
    const sigC = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(payloadC)
      .digest("hex");

    const verifyC = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: orderC.id,
      razorpay_order_id: razorpayC.razorpayOrderId,
      razorpay_payment_id: payIdC,
      razorpay_signature: sigC,
      customerId: customer.id,
    });

    assert.strictEqual(verifyC.order.status, "PAID", "Order C status is PAID");
    assert.strictEqual(verifyC.cart.status, "CONVERTED", "Cart C status is CONVERTED");
    console.log(`[PASS ✅] Order C (${orderC.orderNumber}) PAID & Cart C CONVERTED.`);

    console.log("\n=========================================================");
    console.log("    POST-PAYMENT CHECKOUT REGRESSION SUITE: ALL PASSED   ");
    console.log("=========================================================\n");
    console.log("✅ ALL REGRESSION TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("\nUnhandled exception in regression test suite:", error);
    process.exit(1);
  } finally {
    console.log("\n--- Cleaning up test records from test suite execution ---");
    const testCustomer = await prisma.customer.findUnique({
      where: { email: "checkout-regression@mercora.ai" },
    });
    if (testCustomer) {
      await prisma.commerceEvent.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.payment.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.orderItem.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.order.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { customerId: testCustomer.id } } });
      await prisma.cart.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.customer.delete({ where: { id: testCustomer.id } });
      console.log("Cleaned up checkout-regression@mercora.ai test records.");
    }
    await prisma.$disconnect();
  }
}

runPostPaymentCheckoutRegression();
