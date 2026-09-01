import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import {
  validateCreatePaymentOrderInput,
  validateVerifyPaymentInput,
} from "../validators/payment.validator.js";

const router = Router();

router.post("/razorpay/order", validateCreatePaymentOrderInput, PaymentController.createRazorpayOrder);
router.post("/razorpay/verify", validateVerifyPaymentInput, PaymentController.verifyRazorpayPayment);

export default router;
