import assert from "assert";
import crypto from "crypto";
import { prisma } from "../apps/backend/src/config/database.js";
import { config } from "../apps/backend/src/config/env.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";
import {
  InvalidPaymentSignatureError,
  PaymentOrderMismatchError,
  PaymentVerificationConflictError,
} from "../apps/backend/src/payment/payment.errors.js";

async function runPhase7bTests() {
  console.log("=================================================================");
  console.log("             MERCORA AI PHASE 7B COMPREHENSIVE TEST SUITE        ");
  console.log("=================================================================\n");

  try {
    // Setup Test Customer and Catalog Product
    const customer = await prisma.customer.upsert({
      where: { email: "phase7b-test@mercora.ai" },
      update: {},
      create: {
        email: "phase7b-test@mercora.ai",
        name: "Phase 7B Test Customer",
      },
    });

    const product = await prisma.product.findFirst({
      where: { active: true },
      include: { variants: true },
    });
    assert(product, "Active catalog product must exist for testing");
    const variant = product.variants.find((v) => v.active);

    // --- TEST 1: Successful HMAC SHA-256 Signature Verification & State Transition ---
    console.log("--- Executing Test 1: HMAC SHA-256 Verification & Atomic State Transition ---");
    const cart = await CartService.createOrGetActiveCart(customer.id);
    await CartService.addCartItem(cart.id, {
      productId: product.id,
      variantId: variant?.id,
      quantity: 1,
    });

    const order = await OrderService.createOrder({
      cartId: cart.id,
      idempotencyKey: `p7b-test-ik-1-${Date.now()}`,
    });

    const paymentInit = await PaymentService.createRazorpayOrder({
      orderId: order.id,
      customerId: customer.id,
    });

    const testPaymentId = `pay_simulated_${Date.now()}`;
    const payload = `${paymentInit.razorpayOrderId}|${testPaymentId}`;
    const validSignature = crypto
      .createHmac("sha256", config.RAZORPAY_KEY_SECRET!)
      .update(payload)
      .digest("hex");

    const startTime = Date.now();
    const verifyRes = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order.id,
      razorpay_order_id: paymentInit.razorpayOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: validSignature,
      customerId: customer.id,
    });
    const duration = Date.now() - startTime;

    assert.strictEqual(verifyRes.verified, true, "Verification response flag is true");
    assert.strictEqual(verifyRes.payment.status, "VERIFIED", "Payment status is VERIFIED");
    assert.strictEqual(verifyRes.payment.razorpayPaymentId, testPaymentId, "Payment razorpayPaymentId stored");
    assert.strictEqual(verifyRes.order.status, "PAID", "Order status transitioned to PAID");
    assert.strictEqual(verifyRes.cart.status, "CONVERTED", "Source cart status transitioned to CONVERTED");
    assert(verifyRes.nextCart && verifyRes.nextCart.status === "ACTIVE", "Fresh ACTIVE cart returned in nextCart");
    console.log(`[PASS ✅] Test 1: Verified in ${duration}ms (Payment -> VERIFIED, Order -> PAID, Cart -> CONVERTED, Fresh ACTIVE cart created)`);

    // --- TEST 2: Verification Idempotency ---
    console.log("\n--- Executing Test 2: Verification Idempotency ---");
    const verifyRes2 = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order.id,
      razorpay_order_id: paymentInit.razorpayOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: validSignature,
      customerId: customer.id,
    });

    assert.strictEqual(verifyRes2.verified, true, "Repeated verification succeeds idempotently");
    assert.strictEqual(verifyRes2.order.status, "PAID", "Order status remains PAID");
    console.log("[PASS ✅] Test 2: Repeated verification calls return existing verified status without errors");

    // --- TEST 3: Invalid Signature Rejection ---
    console.log("\n--- Executing Test 3: Invalid Signature Rejection ---");
    const cart2 = await CartService.createOrGetActiveCart(customer.id);
    await CartService.addCartItem(cart2.id, {
      productId: product.id,
      variantId: variant?.id,
      quantity: 1,
    });

    const order2 = await OrderService.createOrder({
      cartId: cart2.id,
      idempotencyKey: `p7b-test-ik-2-${Date.now()}`,
    });

    const paymentInit2 = await PaymentService.createRazorpayOrder({
      orderId: order2.id,
      customerId: customer.id,
    });

    const tamperedSignature = "a1b2c3d4e5f60000000000000000000000000000000000000000000000000000";

    await assert.rejects(
      async () => {
        await PaymentService.verifyRazorpayPayment({
          mercoraOrderId: order2.id,
          razorpay_order_id: paymentInit2.razorpayOrderId,
          razorpay_payment_id: `pay_tampered_${Date.now()}`,
          razorpay_signature: tamperedSignature,
        });
      },
      (err: any) => {
        return err instanceof InvalidPaymentSignatureError && err.code === "INVALID_PAYMENT_SIGNATURE";
      },
      "Invalid signature throws INVALID_PAYMENT_SIGNATURE"
    );

    const dbOrder2 = await prisma.order.findUnique({ where: { id: order2.id } });
    assert.strictEqual(dbOrder2?.status, "PENDING_PAYMENT", "Order status remains PENDING_PAYMENT");
    const dbCart2 = await prisma.cart.findUnique({ where: { id: cart2.id } });
    assert.strictEqual(dbCart2?.status, "CHECKOUT_PENDING", "Cart status remains CHECKOUT_PENDING");
    console.log("[PASS ✅] Test 3: Invalid signature rejected cleanly; database state remains PENDING_PAYMENT / CHECKOUT_PENDING");

    // --- TEST 4: Razorpay Order Ownership Check ---
    console.log("\n--- Executing Test 4: Razorpay Order Mismatch Rejection ---");
    await assert.rejects(
      async () => {
        await PaymentService.verifyRazorpayPayment({
          mercoraOrderId: order2.id,
          razorpay_order_id: "order_fake_mismatch_12345",
          razorpay_payment_id: `pay_mismatch_${Date.now()}`,
          razorpay_signature: validSignature,
        });
      },
      (err: any) => {
        return err instanceof PaymentOrderMismatchError && err.code === "PAYMENT_ORDER_MISMATCH";
      },
      "Mismatching Razorpay order ID throws PAYMENT_ORDER_MISMATCH"
    );
    console.log("[PASS ✅] Test 4: Mismatched Razorpay order ID rejected with PAYMENT_ORDER_MISMATCH");

    // --- TEST 5: Conflicting Payment ID Rejection ---
    console.log("\n--- Executing Test 5: Conflicting Payment ID Rejection ---");
    await assert.rejects(
      async () => {
        await PaymentService.verifyRazorpayPayment({
          mercoraOrderId: order.id,
          razorpay_order_id: paymentInit.razorpayOrderId,
          razorpay_payment_id: `pay_different_${Date.now()}`,
          razorpay_signature: validSignature,
        });
      },
      (err: any) => {
        return err instanceof PaymentVerificationConflictError && err.code === "PAYMENT_VERIFICATION_CONFLICT";
      },
      "Different payment ID for already verified payment throws PAYMENT_VERIFICATION_CONFLICT"
    );
    console.log("[PASS ✅] Test 5: Attempting to verify with conflicting payment ID rejected with PAYMENT_VERIFICATION_CONFLICT");

    // --- TEST 6: Fresh Cart Continuity ---
    console.log("\n--- Executing Test 6: Fresh Cart Continuity ---");
    // Attempting addCartItem on converted cart must be rejected
    await assert.rejects(
      async () => {
        await CartService.addCartItem(cart.id, {
          productId: product.id,
          variantId: variant?.id,
          quantity: 1,
        });
      },
      (err: any) => err.code === "CART_NOT_ACTIVE",
      "Converted cart rejects mutation with CART_NOT_ACTIVE"
    );

    // Attempting addCartItem on fresh active cart must succeed
    const currentActiveCart = await CartService.createOrGetActiveCart(customer.id);
    const newCartItem = await CartService.addCartItem(currentActiveCart.id, {
      productId: product.id,
      variantId: variant?.id,
      quantity: 1,
    });
    assert(newCartItem && newCartItem.id, "Adding item to fresh active cart succeeds");
    console.log("[PASS ✅] Test 6: Converted cart rejects modifications; fresh active cart permits new shopping actions");

    console.log("\n=========================================================");
    console.log("            PHASE 7B TEST RESULTS: ALL PASSED            ");
    console.log("=========================================================\n");
    console.log("✅ ALL COMPREHENSIVE PHASE 7B TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("\nUnhandled exception in Phase 7B test suite:", error);
    process.exit(1);
  } finally {
    console.log("\n--- Cleaning up test records from test suite execution ---");
    const testCustomer = await prisma.customer.findUnique({
      where: { email: "phase7b-test@mercora.ai" },
    });
    if (testCustomer) {
      await prisma.commerceEvent.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.payment.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.orderItem.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.order.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { customerId: testCustomer.id } } });
      await prisma.cart.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.customer.delete({ where: { id: testCustomer.id } });
      console.log("Cleaned up phase7b-test@mercora.ai test records.");
    }
    await prisma.$disconnect();
  }
}

runPhase7bTests();
