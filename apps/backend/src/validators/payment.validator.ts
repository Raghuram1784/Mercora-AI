import { Request, Response, NextFunction } from "express";

export function validateCreatePaymentOrderInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { orderId } = req.body;

  if (!orderId || typeof orderId !== "string" || orderId.trim() === "") {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "orderId is required and must be a non-empty string.",
      },
    });
    return;
  }

  next();
}

export function validateVerifyPaymentInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { mercoraOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!mercoraOrderId || typeof mercoraOrderId !== "string" || mercoraOrderId.trim() === "") {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "mercoraOrderId is required and must be a non-empty string.",
      },
    });
    return;
  }

  if (!razorpay_order_id || typeof razorpay_order_id !== "string" || razorpay_order_id.trim() === "") {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "razorpay_order_id is required and must be a non-empty string.",
      },
    });
    return;
  }

  if (!razorpay_payment_id || typeof razorpay_payment_id !== "string" || razorpay_payment_id.trim() === "") {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "razorpay_payment_id is required and must be a non-empty string.",
      },
    });
    return;
  }

  if (!razorpay_signature || typeof razorpay_signature !== "string" || razorpay_signature.trim() === "") {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "razorpay_signature is required and must be a non-empty string.",
      },
    });
    return;
  }

  next();
}
