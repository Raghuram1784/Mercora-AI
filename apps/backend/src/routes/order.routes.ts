import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";

const router = Router();

// Order creation endpoint
router.post("/", OrderController.createOrder);

// Cancel pending checkout endpoints
router.post("/cancel-pending", OrderController.cancelPendingCheckout);
router.post("/:id/cancel-pending", OrderController.cancelPendingCheckout);

// Explicit ordering requirement: /number/:orderNumber MUST be defined before /:id
router.get("/number/:orderNumber", OrderController.getOrderByNumber);

// Order lookup by UUID id
router.get("/:id", OrderController.getOrderById);

export default router;
