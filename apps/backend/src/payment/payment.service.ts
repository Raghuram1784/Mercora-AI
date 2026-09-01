import crypto from "crypto";
import { prisma } from "../config/database.js";
import { config } from "../config/env.js";
import { getRazorpayClient } from "./razorpay.client.js";
import {
  CreateRazorpayOrderInput,
  RazorpayOrderResponseData,
  VerifyRazorpayPaymentInput,
  VerifyRazorpayPaymentResponseData,
} from "./payment.types.js";
import { PaymentMapper } from "./payment.mapper.js";
import {
  PaymentOrderNotFoundError,
  InvalidOrderStatusForPaymentError,
  RazorpayApiError,
  InvalidPaymentSignatureError,
  PaymentOrderMismatchError,
  PaymentAmountMismatchError,
  PaymentCurrencyMismatchError,
  PaymentVerificationConflictError,
} from "./payment.errors.js";
import { CartService } from "../services/cart.service.js";
import { AuditService } from "../audit/audit.service.js";
import { CommerceEventType, CommerceEventSource } from "../generated/prisma/index.js";

export class PaymentService {
  /**
   * Creates or reuses a Razorpay order for an active Mercora PENDING_PAYMENT order.
   * Authoritative amount is retrieved strictly from Order.total.
   */
  static async createRazorpayOrder(
    input: CreateRazorpayOrderInput
  ): Promise<RazorpayOrderResponseData> {
    const { orderId, customerId } = input;

    // 1. Fetch Mercora Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { cart: true },
    });

    if (!order) {
      throw new PaymentOrderNotFoundError();
    }

    if (customerId && order.customerId !== customerId) {
      throw new PaymentOrderNotFoundError("Order does not belong to the specified customer.");
    }

    // 2. Verify Order.status === PENDING_PAYMENT
    if (order.status !== "PENDING_PAYMENT") {
      throw new InvalidOrderStatusForPaymentError(
        `Cannot create payment session for order with status '${order.status}'. Only PENDING_PAYMENT orders can be paid.`
      );
    }

    // 3. Verify Order.total > 0
    const numericTotal = Number(order.total);
    if (numericTotal <= 0) {
      throw new InvalidOrderStatusForPaymentError("Order total must be greater than zero.");
    }

    // 4. Calculate authoritative amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(numericTotal * 100);
    const keyId = config.RAZORPAY_KEY_ID || "";

    // 5. Check for existing reusable Razorpay Payment record
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
        status: { in: ["CREATED", "PENDING"] },
        razorpayOrderId: { not: null },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingPayment && existingPayment.razorpayOrderId) {
      return PaymentMapper.toRazorpayOrderResponse(
        order.id,
        order.orderNumber,
        existingPayment.razorpayOrderId,
        amountInPaise,
        order.currency,
        keyId
      );
    }

    // 6. Create Razorpay Order via SDK
    try {
      const razorpay = getRazorpayClient();
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: order.currency,
        receipt: order.orderNumber,
        notes: {
          mercoraOrderId: order.id,
          mercoraOrderNumber: order.orderNumber,
        },
      });

      // 7. Persist Payment Record in DB
      const newPayment = await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "RAZORPAY",
          status: "CREATED",
          razorpayOrderId: razorpayOrder.id,
          amount: order.total,
          currency: order.currency,
        },
      });

      // 8. Record PAYMENT_STARTED audit event
      await AuditService.recordEvent({
        eventKey: `payment-started:${order.id}`,
        type: CommerceEventType.PAYMENT_STARTED,
        source: CommerceEventSource.PAYMENT,
        customerId: order.customerId,
        cartId: order.cartId || undefined,
        orderId: order.id,
        paymentId: newPayment.id,
        metadata: {
          razorpayOrderId: razorpayOrder.id,
          amount: order.total.toString(),
          currency: order.currency,
        },
      });

      return PaymentMapper.toRazorpayOrderResponse(
        order.id,
        order.orderNumber,
        razorpayOrder.id,
        amountInPaise,
        order.currency,
        keyId
      );
    } catch (err: any) {
      console.error("Razorpay SDK Order Creation Failed:", err);
      throw new RazorpayApiError(
        err.message || "Failed to initialize Razorpay payment session."
      );
    }
  }

  /**
   * Performs backend HMAC SHA-256 signature verification, SDK payment metadata checks,
   * atomic database lifecycle updates (Payment -> VERIFIED, Order -> PAID, Cart -> CONVERTED),
   * and creates a fresh ACTIVE cart for the customer.
   */
  static async verifyRazorpayPayment(
    input: VerifyRazorpayPaymentInput
  ): Promise<VerifyRazorpayPaymentResponseData> {
    const { mercoraOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, customerId } = input;

    // 1. Fetch Mercora Order & linked Payment
    const order = await prisma.order.findUnique({
      where: { id: mercoraOrderId },
      include: { cart: true, payments: true },
    });

    if (!order) {
      throw new PaymentOrderNotFoundError();
    }

    if (customerId && order.customerId !== customerId) {
      throw new PaymentOrderNotFoundError("Order does not belong to the specified customer.");
    }

    // 2. Fetch associated Payment record
    const payment = await prisma.payment.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      throw new PaymentOrderNotFoundError("No payment session found for this Mercora order.");
    }

    // Idempotency check: if already VERIFIED
    if (payment.status === "VERIFIED" && order.status === "PAID") {
      if (payment.razorpayPaymentId === razorpay_payment_id) {
        // Return existing verified payment result idempotently
        const nextCart = await CartService.createOrGetActiveCart(order.customerId);
        return PaymentMapper.toVerifyPaymentResponse(payment, order, order.cart, nextCart);
      } else {
        throw new PaymentVerificationConflictError(
          "Payment has already been verified with a different payment ID."
        );
      }
    }

    // Ensure Order is in PENDING_PAYMENT
    if (order.status !== "PENDING_PAYMENT") {
      throw new InvalidOrderStatusForPaymentError(
        `Cannot verify payment for order with status '${order.status}'.`
      );
    }

    // 3. Razorpay Order Ownership Check
    if (payment.razorpayOrderId !== razorpay_order_id) {
      throw new PaymentOrderMismatchError(
        `Supplied Razorpay order ID ('${razorpay_order_id}') does not match internal record ('${payment.razorpayOrderId}').`
      );
    }

    // 4. HMAC SHA-256 Signature Verification
    const secret = config.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is not configured on the server.");
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Secure constant-time comparison
    const sigBuffer = Buffer.from(razorpay_signature);
    const genBuffer = Buffer.from(generatedSignature);

    let isSignatureValid = false;
    if (sigBuffer.length === genBuffer.length) {
      isSignatureValid = crypto.timingSafeEqual(sigBuffer, genBuffer);
    }

    if (!isSignatureValid) {
      throw new InvalidPaymentSignatureError("HMAC SHA-256 signature verification failed.");
    }

    // 5. Razorpay SDK Payment Fetch & Amount / Currency Integrity Check
    try {
      const razorpay = getRazorpayClient();
      const sdkPayment: any = await razorpay.payments.fetch(razorpay_payment_id);

      if (sdkPayment) {
        if (sdkPayment.order_id && sdkPayment.order_id !== razorpay_order_id) {
          throw new PaymentOrderMismatchError("SDK payment order ID mismatch.");
        }

        const expectedAmountInPaise = Math.round(Number(order.total) * 100);
        if (sdkPayment.amount && Number(sdkPayment.amount) !== expectedAmountInPaise) {
          throw new PaymentAmountMismatchError(
            `SDK payment amount (${sdkPayment.amount} paise) does not match order total (${expectedAmountInPaise} paise).`
          );
        }

        if (sdkPayment.currency && sdkPayment.currency.toUpperCase() !== order.currency.toUpperCase()) {
          throw new PaymentCurrencyMismatchError(
            `SDK payment currency (${sdkPayment.currency}) does not match order currency (${order.currency}).`
          );
        }
      }
    } catch (err: any) {
      if (
        err instanceof PaymentAmountMismatchError ||
        err instanceof PaymentCurrencyMismatchError ||
        err instanceof PaymentOrderMismatchError
      ) {
        throw err;
      }
      console.warn("Razorpay SDK payment fetch check notice:", err.message || err);
    }

    // 6. Atomic Database Transaction: Payment -> VERIFIED, Order -> PAID, Cart -> CONVERTED
    const now = new Date();
    const [updatedPayment, updatedOrder, updatedCart] = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "VERIFIED",
          razorpayPaymentId: razorpay_payment_id,
          verifiedAt: now,
        },
      });

      const o = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: now,
        },
      });

      let c = null;
      if (order.cartId) {
        c = await tx.cart.update({
          where: { id: order.cartId },
          data: {
            status: "CONVERTED",
          },
        });

        // Record CART_CONVERTED audit event
        await AuditService.recordEvent(
          {
            eventKey: `cart-converted:${order.cartId}`,
            type: CommerceEventType.CART_CONVERTED,
            source: CommerceEventSource.SYSTEM,
            customerId: order.customerId,
            cartId: order.cartId,
            orderId: order.id,
          },
          tx
        );
      }

      // Record PAYMENT_VERIFIED audit event
      await AuditService.recordEvent(
        {
          eventKey: `payment-verified:${payment.id}`,
          type: CommerceEventType.PAYMENT_VERIFIED,
          source: CommerceEventSource.PAYMENT,
          customerId: order.customerId,
          cartId: order.cartId || undefined,
          orderId: order.id,
          paymentId: payment.id,
          metadata: {
            amount: order.total.toString(),
            currency: order.currency,
            razorpayPaymentId: razorpay_payment_id,
          },
        },
        tx
      );

      return [p, o, c];
    });

    const finalCart = updatedCart || order.cart;

    // 7. Instantly ensure a fresh ACTIVE cart for the customer
    const nextCart = await CartService.createOrGetActiveCart(order.customerId);

    return PaymentMapper.toVerifyPaymentResponse(
      updatedPayment,
      updatedOrder,
      finalCart,
      nextCart
    );
  }
}
