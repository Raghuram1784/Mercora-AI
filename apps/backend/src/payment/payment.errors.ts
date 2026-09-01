export class PaymentOrderNotFoundError extends Error {
  statusCode = 404;
  code = "ORDER_NOT_FOUND";
  constructor(message = "The requested Mercora order was not found.") {
    super(message);
    this.name = "PaymentOrderNotFoundError";
  }
}

export class InvalidOrderStatusForPaymentError extends Error {
  statusCode = 400;
  code = "INVALID_ORDER_STATUS";
  constructor(message = "Payment can only be initialized for orders in PENDING_PAYMENT status.") {
    super(message);
    this.name = "InvalidOrderStatusForPaymentError";
  }
}

export class RazorpayApiError extends Error {
  statusCode = 502;
  code = "RAZORPAY_API_ERROR";
  constructor(message = "Failed to communicate with Razorpay payment gateway.") {
    super(message);
    this.name = "RazorpayApiError";
  }
}

export class InvalidPaymentSignatureError extends Error {
  statusCode = 400;
  code = "INVALID_PAYMENT_SIGNATURE";
  constructor(message = "Payment verification failed due to invalid signature.") {
    super(message);
    this.name = "InvalidPaymentSignatureError";
  }
}

export class PaymentOrderMismatchError extends Error {
  statusCode = 400;
  code = "PAYMENT_ORDER_MISMATCH";
  constructor(message = "Supplied Razorpay order ID does not match internal order record.") {
    super(message);
    this.name = "PaymentOrderMismatchError";
  }
}

export class PaymentAmountMismatchError extends Error {
  statusCode = 400;
  code = "PAYMENT_AMOUNT_MISMATCH";
  constructor(message = "Payment amount does not match authoritative order total.") {
    super(message);
    this.name = "PaymentAmountMismatchError";
  }
}

export class PaymentCurrencyMismatchError extends Error {
  statusCode = 400;
  code = "PAYMENT_CURRENCY_MISMATCH";
  constructor(message = "Payment currency does not match authoritative order currency.") {
    super(message);
    this.name = "PaymentCurrencyMismatchError";
  }
}

export class PaymentVerificationConflictError extends Error {
  statusCode = 409;
  code = "PAYMENT_VERIFICATION_CONFLICT";
  constructor(message = "Payment has already been verified with a different payment identifier.") {
    super(message);
    this.name = "PaymentVerificationConflictError";
  }
}
