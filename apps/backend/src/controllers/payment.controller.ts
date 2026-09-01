import { Request, Response } from "express";
import { PaymentService } from "../payment/payment.service.js";

export class PaymentController {
  static async createRazorpayOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;
      const demoCustomerId = process.env.VITE_DEMO_CUSTOMER_ID;

      const paymentData = await PaymentService.createRazorpayOrder({
        orderId,
        customerId: demoCustomerId,
      });

      res.status(201).json({
        success: true,
        data: paymentData,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const errorCode = error.code || "INTERNAL_ERROR";
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message || "An error occurred while creating Razorpay order.",
        },
      });
    }
  }

  static async verifyRazorpayPayment(req: Request, res: Response): Promise<void> {
    try {
      const { mercoraOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const demoCustomerId = process.env.VITE_DEMO_CUSTOMER_ID;

      const startTime = Date.now();
      const verifiedData = await PaymentService.verifyRazorpayPayment({
        mercoraOrderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        customerId: demoCustomerId,
      });
      const duration = Date.now() - startTime;
      console.log(`[PaymentVerification] Verified order ${mercoraOrderId} successfully in ${duration}ms`);

      res.status(200).json({
        success: true,
        data: verifiedData,
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      const errorCode = error.code || "INTERNAL_ERROR";
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: error.message || "An error occurred while verifying payment signature.",
        },
      });
    }
  }
}
