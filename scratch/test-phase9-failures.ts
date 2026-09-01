import assert from "assert";
import { prisma } from "../apps/backend/src/config/database.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { AuditService } from "../apps/backend/src/audit/audit.service.js";
import { MerchantAnalyticsService } from "../apps/backend/src/merchant-analytics/merchant-analytics.service.js";
import { CommerceEventType, CommerceEventSource } from "../apps/backend/src/generated/prisma/index.js";
import {
  InvalidPaymentSignatureError,
  PaymentOrderMismatchError,
} from "../apps/backend/src/payment/payment.errors.js";
import {
  InsufficientStockError,
  ProductUnavailableError,
  InvalidVariantError,
} from "../apps/backend/src/order/order.errors.js";
import crypto from "crypto";
import { config } from "../apps/backend/src/config/env.js";

async function runPhase9FailuresTest() {
  console.log("=================================================================");
  console.log("       PHASE 9A: AUTOMATED BACKEND FAILURE & RECOVERY TESTS       ");
  console.log("=================================================================\n");

  const testEmail = "phase9-failures@mercora.ai";
  let testCustomer: any = null;

  try {
    // 0. Pre-test cleanup of existing test identity
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
        name: "Phase 9 Failures Tester",
      },
    });

    console.log(`Created isolated test customer: ${testCustomer.id} (${testEmail})\n`);

    // Fetch an active product for testing
    const sampleProduct = await prisma.product.findFirst({
      where: { active: true },
      include: { variants: true },
    });
    assert(sampleProduct, "Sample product exists");

    // -------------------------------------------------------------------------
    // TEST 1: Invalid Razorpay Signature
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Invalid Razorpay Signature ---");
    const sampleVariant = sampleProduct.variants?.find((v) => v.active);
    const itemPayload = {
      productId: sampleProduct.id,
      variantId: sampleVariant ? sampleVariant.id : undefined,
      quantity: 1,
    };

    const cart1 = await CartService.createOrGetActiveCart(testCustomer.id);
    await CartService.addCartItem(cart1.id, itemPayload);
    const order1 = await OrderService.createOrder({ customerId: testCustomer.id, cartId: cart1.id });
    const checkout1 = await PaymentService.createRazorpayOrder({ orderId: order1.id, customerId: testCustomer.id });

    try {
      await PaymentService.verifyRazorpayPayment({
        mercoraOrderId: order1.id,
        razorpay_order_id: checkout1.razorpayOrderId,
        razorpay_payment_id: "pay_test_invalid_123",
        razorpay_signature: "invalid_signature_hash_xyz_999",
        customerId: testCustomer.id,
      });
      assert.fail("Should have thrown InvalidPaymentSignatureError");
    } catch (err: any) {
      assert(
        err instanceof InvalidPaymentSignatureError || err.code === "INVALID_PAYMENT_SIGNATURE",
        `Expected INVALID_PAYMENT_SIGNATURE error, got: ${err.message}`
      );
      console.log("✅ Invalid Razorpay Signature correctly rejected with INVALID_PAYMENT_SIGNATURE.");
    }

    // Verify database state remained unmodified
    const order1Check = await prisma.order.findUnique({ where: { id: order1.id } });
    assert.strictEqual(order1Check?.status, "PENDING_PAYMENT", "Order 1 remains PENDING_PAYMENT");
    const cart1Check = await prisma.cart.findUnique({ where: { id: cart1.id } });
    assert.strictEqual(cart1Check?.status, "CHECKOUT_PENDING", "Cart 1 remains CHECKOUT_PENDING");
    console.log("✅ Order 1 & Cart 1 states safely preserved as PENDING.\n");

    // -------------------------------------------------------------------------
    // TEST 2: Razorpay Order Mismatch
    // -------------------------------------------------------------------------
    console.log("--- TEST 2: Razorpay Order Mismatch ---");
    try {
      await PaymentService.verifyRazorpayPayment({
        mercoraOrderId: order1.id,
        razorpay_order_id: "order_fake_mismatched_order_999",
        razorpay_payment_id: "pay_test_123",
        razorpay_signature: "any_sig",
        customerId: testCustomer.id,
      });
      assert.fail("Should have thrown PaymentOrderMismatchError");
    } catch (err: any) {
      assert(
        err instanceof PaymentOrderMismatchError || err.code === "PAYMENT_ORDER_MISMATCH",
        `Expected PAYMENT_ORDER_MISMATCH error, got: ${err.message}`
      );
      console.log("✅ Razorpay Order Mismatch correctly rejected with PAYMENT_ORDER_MISMATCH.\n");
    }

    // -------------------------------------------------------------------------
    // TEST 3: 5x Duplicate Verification Idempotency
    // -------------------------------------------------------------------------
    console.log("--- TEST 3: 5x Duplicate Verification Idempotency ---");
    const secret = config.RAZORPAY_KEY_SECRET || "dummy_secret_for_test";
    const testPaymentId = "pay_test_valid_idempotent_1";
    const payloadStr = `${checkout1.razorpayOrderId}|${testPaymentId}`;
    const validSignature = crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");

    console.log("Executing 1st verification call...");
    const res1 = await PaymentService.verifyRazorpayPayment({
      mercoraOrderId: order1.id,
      razorpay_order_id: checkout1.razorpayOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: validSignature,
      customerId: testCustomer.id,
    });
    assert.strictEqual(res1.payment.status, "VERIFIED");
    assert.strictEqual(res1.order.status, "PAID");

    console.log("Executing 4 subsequent duplicate verification calls...");
    for (let i = 2; i <= 5; i++) {
      const dupRes = await PaymentService.verifyRazorpayPayment({
        mercoraOrderId: order1.id,
        razorpay_order_id: checkout1.razorpayOrderId,
        razorpay_payment_id: testPaymentId,
        razorpay_signature: validSignature,
        customerId: testCustomer.id,
      });
      assert.strictEqual(dupRes.payment.status, "VERIFIED");
      assert.strictEqual(dupRes.order.status, "PAID");
    }

    // Verify audit event & payment record counts
    const paymentsCount = await prisma.payment.count({ where: { orderId: order1.id } });
    assert.strictEqual(paymentsCount, 1, "Exactly 1 payment record created");

    const verifiedAuditEvents = await prisma.commerceEvent.count({
      where: {
        customerId: testCustomer.id,
        type: CommerceEventType.PAYMENT_VERIFIED,
      },
    });
    assert.strictEqual(verifiedAuditEvents, 1, "Exactly 1 PAYMENT_VERIFIED audit event recorded");

    const convertedAuditEvents = await prisma.commerceEvent.count({
      where: {
        customerId: testCustomer.id,
        type: CommerceEventType.CART_CONVERTED,
      },
    });
    assert.strictEqual(convertedAuditEvents, 1, "Exactly 1 CART_CONVERTED audit event recorded");

    console.log("✅ 5x Duplicate verification executed idempotently with zero record duplication.\n");

    // -------------------------------------------------------------------------
    // TEST 4: Out-of-Stock Guard Before Order Creation
    // -------------------------------------------------------------------------
    console.log("--- TEST 4: Out-of-Stock Guard Before Order Creation ---");
    const activeCart2 = await CartService.createOrGetActiveCart(testCustomer.id);
    await CartService.addCartItem(activeCart2.id, itemPayload);

    // Temporarily mutate product/variant stock to 0
    const originalStock = sampleProduct.stock;
    const originalVariantStock = sampleVariant ? sampleVariant.stock : undefined;

    await prisma.product.update({ where: { id: sampleProduct.id }, data: { stock: 0 } });
    if (sampleVariant) {
      await prisma.productVariant.update({ where: { id: sampleVariant.id }, data: { stock: 0 } });
    }

    try {
      await OrderService.createOrder({ customerId: testCustomer.id, cartId: activeCart2.id });
      assert.fail("Should have thrown InsufficientStockError");
    } catch (err: any) {
      assert(
        err instanceof InsufficientStockError || err.code === "INSUFFICIENT_STOCK",
        `Expected INSUFFICIENT_STOCK error, got: ${err.message}`
      );
      console.log("✅ Out-of-Stock condition correctly blocked order creation with INSUFFICIENT_STOCK.");
    } finally {
      // Restore original stock
      await prisma.product.update({ where: { id: sampleProduct.id }, data: { stock: originalStock } });
      if (sampleVariant && originalVariantStock !== undefined) {
        await prisma.productVariant.update({ where: { id: sampleVariant.id }, data: { stock: originalVariantStock } });
      }
    }

    // -------------------------------------------------------------------------
    // TEST 5: Product Inactivation Guard
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Product Inactivation Guard ---");
    await prisma.product.update({ where: { id: sampleProduct.id }, data: { active: false } });
    try {
      await OrderService.createOrder({ customerId: testCustomer.id, cartId: activeCart2.id });
      assert.fail("Should have thrown ProductUnavailableError");
    } catch (err: any) {
      assert(
        err instanceof ProductUnavailableError || err.code === "PRODUCT_UNAVAILABLE",
        `Expected PRODUCT_UNAVAILABLE error, got: ${err.message}`
      );
      console.log("✅ Inactive product condition correctly blocked order creation with PRODUCT_UNAVAILABLE.");
    } finally {
      await prisma.product.update({ where: { id: sampleProduct.id }, data: { active: true } });
    }

    // -------------------------------------------------------------------------
    // TEST 6: Fake AI Attribution Failure Guard
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Fake AI Attribution Failure Guard ---");
    const fakeEventId = "00000000-0000-0000-0000-000000000000";
    const attributionResult = await AuditService.validateAttribution({
      source: "AI_ACCESSORY" as any,
      sourceEventId: fakeEventId,
      customerId: testCustomer.id,
      productId: sampleProduct.id,
    });
    assert.strictEqual(attributionResult.valid, false, "Fake attribution must be invalid");
    assert.strictEqual(attributionResult.source, "DIRECT", "Fake attribution downgraded to DIRECT");
    console.log("✅ Fake AI attribution rejected and safely downgraded to DIRECT.\n");

    // -------------------------------------------------------------------------
    // TEST 7: Secret Exposure Audit
    // -------------------------------------------------------------------------
    console.log("--- TEST 7: Secret Exposure Audit ---");
    const customerEvents = await prisma.commerceEvent.findMany({ where: { customerId: testCustomer.id } });
    for (const evt of customerEvents) {
      const jsonStr = JSON.stringify(evt);
      if (config.RAZORPAY_KEY_SECRET) {
        assert(!jsonStr.includes(config.RAZORPAY_KEY_SECRET), "RAZORPAY_KEY_SECRET not in event log");
      }
      if (config.GROQ_API_KEY) {
        assert(!jsonStr.includes(config.GROQ_API_KEY), "GROQ_API_KEY not in event log");
      }
    }
    console.log("✅ Audit log secret exposure scan passed with 0 leaks.\n");

    console.log("=================================================================");
    console.log("       ALL PHASE 9A BACKEND FAILURE TESTS PASSED SUCCESSFULLY    ");
    console.log("=================================================================\n");
  } finally {
    // Teardown cleanup
    if (testCustomer) {
      console.log(`Cleaning up test data for customer ${testCustomer.id}...`);
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

runPhase9FailuresTest();
