export interface RazorpayOrderResponseData {
  mercoraOrderId: string;
  mercoraOrderNumber: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyRazorpayPaymentInput {
  mercoraOrderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
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

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}
