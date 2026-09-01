import {
  RazorpayOrderResponseData,
  RazorpaySuccessResponse,
  RazorpayOptions,
  VerifyRazorpayPaymentInput,
  VerifyRazorpayPaymentResponseData,
} from "../types/payment";
import { loadRazorpayScript } from "../lib/razorpay";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export class PaymentService {
  /**
   * Requests backend to create or retrieve a Razorpay Order for a Mercora order ID.
   */
  static async createRazorpayOrder(orderId: string): Promise<RazorpayOrderResponseData> {
    const response = await fetch(`${API_BASE_URL}/payments/razorpay/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    const body = await response.json();

    if (!response.ok || !body.success) {
      throw new Error(body.error?.message || "Failed to initialize payment session with server.");
    }

    return body.data;
  }

  /**
   * Verifies a Razorpay payment with the Mercora backend via HMAC signature comparison.
   */
  static async verifyRazorpayPayment(
    input: VerifyRazorpayPaymentInput
  ): Promise<VerifyRazorpayPaymentResponseData> {
    const response = await fetch(`${API_BASE_URL}/payments/razorpay/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const body = await response.json();

    if (!response.ok || !body.success) {
      const err = new Error(body.error?.message || "Payment verification failed.");
      (err as any).code = body.error?.code || "VERIFICATION_FAILED";
      throw err;
    }

    return body.data;
  }

  /**
   * Opens the Razorpay Checkout modal with the provided parameters.
   */
  static async openRazorpayCheckout(
    checkoutData: RazorpayOrderResponseData,
    onSuccess: (response: RazorpaySuccessResponse) => void,
    onDismiss?: () => void,
    onError?: (err: Error) => void
  ): Promise<void> {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      const err = new Error("Unable to load Razorpay payment SDK. Please check your internet connection.");
      if (onError) onError(err);
      throw err;
    }

    const options: RazorpayOptions = {
      key: checkoutData.keyId,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      name: "Mercora AI",
      description: `Payment for Order ${checkoutData.mercoraOrderNumber}`,
      order_id: checkoutData.razorpayOrderId,
      theme: {
        color: "#8B5CF6", // Mercora signature violet
      },
      handler: (response: RazorpaySuccessResponse) => {
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }
}
