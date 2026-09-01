import assert from "assert";
import { prisma } from "../apps/backend/src/config/database.js";
import { config } from "../apps/backend/src/config/env.js";
import { OrderService } from "../apps/backend/src/order/order.service.js";
import { CartService } from "../apps/backend/src/services/cart.service.js";
import { PaymentService } from "../apps/backend/src/payment/payment.service.js";
import {
  InvalidOrderStatusForPaymentError,
  PaymentOrderNotFoundError,
} from "../apps/backend/src/payment/payment.errors.js";

async function runPhase7aTests() {
  console.log("=================================================================");
  console.log("             MERCORA AI PHASE 7A COMPREHENSIVE TEST SUITE        ");
  console.log("=================================================================\n");

  try {
    // --- TEST 1: Backend Environment & Credential Loading ---
    console.log("--- Executing Test 1: Backend Environment Loading ---");
    assert(config.RAZORPAY_KEY_ID, "RAZORPAY_KEY_ID is loaded in backend config");
    assert(config.RAZORPAY_KEY_SECRET, "RAZORPAY_KEY_SECRET is loaded in backend config");
    assert(!config.RAZORPAY_KEY_ID.includes("SECRET"), "Key ID does not contain secret text");
    console.log("[PASS ✅] Test 1: Razorpay configuration loaded safely without logging secrets");

    // Setup Test Customer and Catalog Product
    const customer = await prisma.customer.upsert({
      where: { email: "phase7a-test@mercora.ai" },
      update: {},
      create: {
        email: "phase7a-test@mercora.ai",
        name: "Phase 7A Test Customer",
      },
    });

    const product = await prisma.product.findFirst({
      where: { active: true },
      include: { variants: true },
    });
    assert(product, "At least one active catalog product must exist for testing");

    const variant = product.variants.find((v) => v.active);

    // --- TEST 2: Basic Payment Order Creation ---
    console.log("\n--- Executing Test 2: Basic Razorpay Order Creation ---");
    const cart = await CartService.createOrGetActiveCart(customer.id);
    await CartService.addCartItem(cart.id, {
      productId: product.id,
      variantId: variant?.id,
      quantity: 2,
    });

    const order = await OrderService.createOrder({
      cartId: cart.id,
      idempotencyKey: `p7a-test-ik-${Date.now()}`,
    });

    const paymentRes = await PaymentService.createRazorpayOrder({
      orderId: order.id,
      customerId: customer.id,
    });

    assert.strictEqual(paymentRes.mercoraOrderId, order.id, "Mercora order ID matches");
    assert.strictEqual(paymentRes.mercoraOrderNumber, order.orderNumber, "Mercora order number matches");
    assert(paymentRes.razorpayOrderId.startsWith("order_"), "Razorpay order ID has 'order_' prefix");
    assert.strictEqual(paymentRes.keyId, config.RAZORPAY_KEY_ID, "Returned keyId matches public RAZORPAY_KEY_ID");
    console.log(`[PASS ✅] Test 2: Created Razorpay order ${paymentRes.razorpayOrderId} for Mercora order ${order.orderNumber}`);

    // --- TEST 3: Amount Integrity Conversion ---
    console.log("\n--- Executing Test 3: Amount Integrity Conversion ---");
    const expectedPaise = Math.round(Number(order.total) * 100);
    assert.strictEqual(paymentRes.amount, expectedPaise, `Razorpay amount (${paymentRes.amount} paise) strictly equals Order.total * 100 (${expectedPaise})`);
    console.log(`[PASS ✅] Test 3: Authoritative amount conversion: ₹${order.total} -> ${paymentRes.amount} paise`);

    // --- TEST 4: Razorpay Order Reuse / Idempotency ---
    console.log("\n--- Executing Test 4: Existing Razorpay Order Reuse ---");
    const paymentRes2 = await PaymentService.createRazorpayOrder({
      orderId: order.id,
      customerId: customer.id,
    });

    assert.strictEqual(paymentRes2.razorpayOrderId, paymentRes.razorpayOrderId, "Repeated request returns identical Razorpay Order ID");
    
    const paymentCount = await prisma.payment.count({
      where: { orderId: order.id },
    });
    assert.strictEqual(paymentCount, 1, "Only one Payment database record exists for the Mercora Order");
    console.log("[PASS ✅] Test 4: Repeated checkout requests reuse existing Razorpay Order without duplicates");

    // --- TEST 5: Order Status Enforcement ---
    console.log("\n--- Executing Test 5: Invalid Order Status Enforcement ---");
    // Manually mark order as PAID to simulate completed state
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });

    await assert.rejects(
      async () => {
        await PaymentService.createRazorpayOrder({ orderId: order.id });
      },
      (err: any) => {
        return err instanceof InvalidOrderStatusForPaymentError && err.code === "INVALID_ORDER_STATUS";
      },
      "Attempting to create payment for PAID order fails with INVALID_ORDER_STATUS"
    );
    console.log("[PASS ✅] Test 5: Orders not in PENDING_PAYMENT status strictly reject payment creation");

    // Reset order status back to PENDING_PAYMENT for subsequent safety checks
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PENDING_PAYMENT" },
    });

    // --- TEST 6: Non-Existent Order Safety ---
    console.log("\n--- Executing Test 6: Non-Existent Order Protection ---");
    await assert.rejects(
      async () => {
        await PaymentService.createRazorpayOrder({ orderId: "00000000-0000-0000-0000-000000000000" });
      },
      (err: any) => {
        return err instanceof PaymentOrderNotFoundError && err.code === "ORDER_NOT_FOUND";
      },
      "Non-existent order ID fails with ORDER_NOT_FOUND"
    );
    console.log("[PASS ✅] Test 6: Invalid order ID correctly rejected with ORDER_NOT_FOUND");

    // --- TEST 7: Secret Exposure Guard ---
    console.log("\n--- Executing Test 7: Secret Exposure Guard ---");
    const jsonOutput = JSON.stringify(paymentRes);
    assert(!jsonOutput.includes(config.RAZORPAY_KEY_SECRET!), "Response payload does not leak RAZORPAY_KEY_SECRET");
    assert(!("keySecret" in paymentRes), "Response object has no keySecret field");
    assert(!("RAZORPAY_KEY_SECRET" in paymentRes), "Response object has no RAZORPAY_KEY_SECRET field");
    console.log("[PASS ✅] Test 7: Zero secret leaks in response DTO or JSON output");

    console.log("\n=========================================================");
    console.log("            PHASE 7A TEST RESULTS: ALL PASSED            ");
    console.log("=========================================================\n");
    console.log("✅ ALL COMPREHENSIVE PHASE 7A TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("\nUnhandled exception in Phase 7A test suite:", error);
    process.exit(1);
  } finally {
    console.log("\n--- Cleaning up test records from test suite execution ---");
    const testCustomer = await prisma.customer.findUnique({
      where: { email: "phase7a-test@mercora.ai" },
    });
    if (testCustomer) {
      await prisma.commerceEvent.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.payment.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.orderItem.deleteMany({ where: { order: { customerId: testCustomer.id } } });
      await prisma.order.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.cartItem.deleteMany({ where: { cart: { customerId: testCustomer.id } } });
      await prisma.cart.deleteMany({ where: { customerId: testCustomer.id } });
      await prisma.customer.delete({ where: { id: testCustomer.id } });
      console.log("Cleaned up phase7a-test@mercora.ai test records.");
    }
    await prisma.$disconnect();
  }
}

runPhase7aTests();
