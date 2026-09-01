export interface CreateRazorpayOrderInput {
  orderId: string;
  customerId?: string;
}

export interface RazorpayOrderResponseData {
  mercoraOrderId: string;
  mercoraOrderNumber: string;
  razorpayOrderId: string;
  amount: number; // amount in smallest currency unit (paise for INR)
  currency: string;
  keyId: string;
}

export interface VerifyRazorpayPaymentInput {
  mercoraOrderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  customerId?: string;
}

export interface VerifyRazorpayPaymentResponseData {
  verified: boolean;
  payment: {
    id: string;
    status: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    amount: string;
    currency: string;
    verifiedAt: string | null;
  };
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    currency: string;
    paidAt: string | null;
  };
  cart: {
    id: string | null;
    status: string;
  };
  nextCart: {
    id: string;
    status: string;
    items: any[];
  };
}
