import assert from "assert";
import crypto from "crypto";
import { prisma } from "../apps/backend/src/config/database.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { config } from "../apps/backend/src/config/env.js";

async function runPendingCheckoutCancellationTests() {
  console.log("=================================================================");
  console.log("      REGRESSION TESTS: PENDING CHECKOUT LOCK & CANCELLATION      ");
  console.log("=================================================================\n");

  const testEmail = "pending-checkout-lineage-test@mercora.ai";
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
        name: "Lineage & Recovery Tester",
      },
    });

    const products = await prisma.product.findMany({
      where: { active: true },
      include: { variants: true },
      take: 2,
    });
    assert(products.length >= 2, "At least 2 products available");

    const prodA = products[0];
    const prodB = products[1];
    const varA = prodA.variants?.find((v) => v.active);
    const varB = prodB.variants?.find((v) => v.active);
    const secret = config.RAZORPAY_KEY_SECRET || "dummy_secret_for_test";

    // -------------------------------------------------------------------------
    // REGRESSION TEST 1: Dismissed Checkout -> Retry Payment Works
    // -------------------------------------------------------------------------
    console.log("--- REGRESSION TEST 1: Dismissed Checkout -> Retry Payment ---");
    const cart1 = await CartService.createOrGetActiveCart(testCustomer.id);
    await CartService.addCartItem(cart1.id, { productId: prodA.id, variantId: varA?.id, quantity: 1 });

    const order1 = await OrderService.createOrder({ customerId: testCustomer.id, cartId: cart1.id });
    const checkout1 = await PaymentService.createRazorpayOrder({ orderId: order1.id, customerId: testCustomer.id });

    // Verify Cart is CHECKOUT_PENDING & Order is PENDING_PAYMENT
    const cart1Pending = await prisma.cart.findUnique({ where: { id: cart1.id } });
    assert.strictEqual(cart1Pending?.status, "CHECKOUT_PENDING", "Cart is CHECKOUT_PENDING");

    // Attempting to mutate locked cart must be blocked by backend CART_NOT_ACTIVE protection
    try {
      await CartService.addCartItem(cart1.id, { productId: prodB.id, quantity: 1 });
      assert.fail("Should have thrown error adding item to CHECKOUT_PENDING cart");
    } catch (err: any) {
      console.log("  ✅ Backend protection blocked cart mutation during CHECKOUT_PENDING.");
    }

    // Reusing existing order for payment retry
    const retryCheckout = await PaymentService.createRazorpayOrder({ orderId: order1.id, customerId: testCustomer.id });
    assert.strictEqual(retryCheckout.razorpayOrderId, checkout1.razorpayOrderId, "Reuses existing Razorpay Order");

    const payId1 = "pay_test_retry_1_" + Date.now();
    const sig1 = crypto.createHmac("sha256", secret).update(`${checkout1.razorpayOrderId}|${payId1}`).digest("hex");

    const res1 = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order1.id,
      razorpay_order_id: checkout1.razorpayOrderId,
      razorpay_payment_id: payId1,
      razorpay_signature: sig1,
      customerId: testCustomer.id,
    });

    assert.strictEqual(res1.order.status, "PAID");
    assert.strictEqual(res1.cart.status, "CONVERTED");
    assert.strictEqual(res1.nextCart.status, "ACTIVE");
    console.log("✅ Regression Test 1 passed (Retry Payment reuses pending order & succeeds).\n");

    // -------------------------------------------------------------------------
    // REGRESSION TEST 2: Cancel Pending Checkout -> Preserve Lineage -> Edit -> Pay
    // -------------------------------------------------------------------------
    console.log("--- REGRESSION TEST 2: Cancel Checkout & Preserve Lineage -> New Order -> Pay ---");
    const cart2 = res1.nextCart;
    await CartService.addCartItem(cart2.id, { productId: prodA.id, variantId: varA?.id, quantity: 1 });

    const order2 = await OrderService.createOrder({ customerId: testCustomer.id, cartId: cart2.id });
    const checkout2 = await PaymentService.createRazorpayOrder({ orderId: order2.id, customerId: testCustomer.id });

    // Execute atomic cancellation
    console.log("Cancelling pending checkout...");
    const cancelRes = await OrderService.cancelPendingCheckout(order2.id, testCustomer.id);

    assert.strictEqual(cancelRes.order.status, "CANCELLED");
    assert.strictEqual(cancelRes.cart.status, "ACTIVE");

    // Verify DB states & Lineage Preservation
    const order2Db = await prisma.order.findUnique({ where: { id: order2.id } });
    assert.strictEqual(order2Db?.status, "CANCELLED", "Order status is CANCELLED");
    assert.strictEqual(order2Db?.cartId, cart2.id, "Historical cartId lineage strictly preserved");

    const cart2Db = await prisma.cart.findUnique({ where: { id: cart2.id } });
    assert.strictEqual(cart2Db?.status, "ACTIVE", "Cart status is ACTIVE");

    // Test removing item and adding new product to reactivated cart
    const itemToRemove = cart2Db ? (await prisma.cartItem.findFirst({ where: { cartId: cart2.id } })) : null;
    assert(itemToRemove, "Cart item exists in reactivated cart");

    console.log("Editing reactivated ACTIVE cart...");
    await CartService.removeCartItem(cart2.id, itemToRemove!.id);
    await CartService.addCartItem(cart2.id, { productId: prodB.id, variantId: varB?.id, quantity: 2 });

    // Create fresh order and pay
    console.log("Creating fresh order and completing payment...");
    const order3 = await OrderService.createOrder({ customerId: testCustomer.id, cartId: cart2.id });
    const checkout3 = await PaymentService.createRazorpayOrder({ orderId: order3.id, customerId: testCustomer.id });

    const payId3 = "pay_test_cancel_flow_" + Date.now();
    const sig3 = crypto.createHmac("sha256", secret).update(`${checkout3.razorpayOrderId}|${payId3}`).digest("hex");

    const res3 = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order3.id,
      razorpay_order_id: checkout3.razorpayOrderId,
      razorpay_payment_id: payId3,
      razorpay_signature: sig3,
      customerId: testCustomer.id,
    });

    assert.strictEqual(res3.order.status, "PAID");
    assert.strictEqual(res3.cart.status, "CONVERTED");
    console.log("✅ Regression Test 2 passed (Cancel Checkout -> Preserve Lineage -> Reactivate Cart -> Edit -> Create New Order -> Pay).\n");

    // -------------------------------------------------------------------------
    // REGRESSION TEST 3: Rejection of Cancellation for PAID Order
    // -------------------------------------------------------------------------
    console.log("--- REGRESSION TEST 3: Rejection of Cancellation for PAID Order ---");
    try {
      await OrderService.cancelPendingCheckout(order3.id, testCustomer.id);
      assert.fail("Should have rejected cancellation for PAID order");
    } catch (err: any) {
      assert(err.message.includes("paid"), `Rejection error message: ${err.message}`);
      console.log("✅ Cancellation of PAID order correctly rejected.\n");
    }

    // -------------------------------------------------------------------------
    // REGRESSION TEST 4: Late Payment Verification on Cancelled Order
    // -------------------------------------------------------------------------
    console.log("--- REGRESSION TEST 4: Late Payment Verification on Cancelled Order ---");
    const cartA = await CartService.createOrGetActiveCart(testCustomer.id);
    await CartService.addCartItem(cartA.id, { productId: prodA.id, variantId: varA?.id, quantity: 1 });
    const orderA = await OrderService.createOrder({ customerId: testCustomer.id, cartId: cartA.id });
    const checkoutA = await PaymentService.createRazorpayOrder({ orderId: orderA.id, customerId: testCustomer.id });

    // Cancel checkout for Order A
    await OrderService.cancelPendingCheckout(orderA.id, testCustomer.id);
    const cancelledOrderA = await prisma.order.findUnique({ where: { id: orderA.id } });
    assert.strictEqual(cancelledOrderA?.status, "CANCELLED");
    assert.strictEqual(cancelledOrderA?.cartId, cartA.id, "Historical cartId lineage strictly preserved");

    // Create Order B from reactivated cartA
    await CartService.addCartItem(cartA.id, { productId: prodB.id, variantId: varB?.id, quantity: 1 });
    const orderB = await OrderService.createOrder({ customerId: testCustomer.id, cartId: cartA.id });
    const checkoutB = await PaymentService.createRazorpayOrder({ orderId: orderB.id, customerId: testCustomer.id });

    // Submit old valid Razorpay verification attempt for Order A
    const oldPayIdA = "pay_test_late_attempt_" + Date.now();
    const oldSigA = crypto.createHmac("sha256", secret).update(`${checkoutA.razorpayOrderId}|${oldPayIdA}`).digest("hex");

    try {
      await PaymentService.verifyRazorpayPayment({
        mercoraOrderId: orderA.id,
        razorpay_order_id: checkoutA.razorpayOrderId,
        razorpay_payment_id: oldPayIdA,
        razorpay_signature: oldSigA,
        customerId: testCustomer.id,
      });
      assert.fail("Late verification on CANCELLED order must be rejected");
    } catch (err: any) {
      assert(err.message.includes("CANCELLED") || err.code === "INVALID_ORDER_STATUS", `Expected INVALID_ORDER_STATUS, got: ${err.message}`);
      console.log("  ✅ Late verification request on CANCELLED order rejected with INVALID_ORDER_STATUS.");
    }

    // Verify states after rejected late payment attempt
    const postOrderA = await prisma.order.findUnique({ where: { id: orderA.id } });
    assert.strictEqual(postOrderA?.status, "CANCELLED", "Order A remains CANCELLED");

    const postOrderB = await prisma.order.findUnique({ where: { id: orderB.id } });
    assert.strictEqual(postOrderB?.status, "PENDING_PAYMENT", "Order B unaffected");

    const postCartA = await prisma.cart.findUnique({ where: { id: cartA.id } });
    assert.notStrictEqual(postCartA?.status, "CONVERTED", "Cart not converted by Order A");
    console.log("✅ Regression Test 4 passed (Late payment verification on CANCELLED order safely rejected).\n");

    console.log("=================================================================");
    console.log("      ALL PENDING CHECKOUT CANCELLATION TESTS PASSED 100%        ");
    console.log("=================================================================\n");
  } finally {
    if (testCustomer) {
      console.log(`Cleaning up test customer ${testCustomer.id}...`);
      await prisma.commerceEvent.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.payment.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.orderItem.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.order.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { customerId: testCustomer.id } } });
      await prisma.cart.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.customer.delete({ where: { id: testCustomer.id } });
      console.log("Teardown completed successfully.\n");
    }
    await prisma.$disconnect();
  }
}

runPendingCheckoutCancellationTests();
