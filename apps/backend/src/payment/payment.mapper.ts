import { RazorpayOrderResponseData, VerifyRazorpayPaymentResponseData } from "./payment.types.js";

export class PaymentMapper {
  static toRazorpayOrderResponse(
    mercoraOrderId: string,
    mercoraOrderNumber: string,
    razorpayOrderId: string,
    amountInPaise: number,
    currency: string,
    keyId: string
  ): RazorpayOrderResponseData {
    return {
      mercoraOrderId,
      mercoraOrderNumber,
      razorpayOrderId,
      amount: amountInPaise,
      currency,
      keyId,
    };
  }

  static toVerifyPaymentResponse(
    payment: any,
    order: any,
    cart: any,
    nextCart: any
  ): VerifyRazorpayPaymentResponseData {
    return {
      verified: true,
      payment: {
        id: payment.id,
        status: payment.status,
        razorpayPaymentId: payment.razorpayPaymentId || "",
        razorpayOrderId: payment.razorpayOrderId || "",
        amount: payment.amount.toString(),
        currency: payment.currency,
        verifiedAt: payment.verifiedAt ? payment.verifiedAt.toISOString() : null,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total.toString(),
        currency: order.currency,
        paidAt: order.paidAt ? order.paidAt.toISOString() : null,
      },
      cart: {
        id: cart ? cart.id : order.cartId,
        status: cart ? cart.status : "CONVERTED",
      },
      nextCart: {
        id: nextCart.id,
        status: nextCart.status,
        items: nextCart.items || [],
      },
    };
  }
}
