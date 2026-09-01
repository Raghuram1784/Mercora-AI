import { Request, Response, NextFunction } from "express";
import { OrderService } from "../order/order.service.js";
import { validateCreateOrderInput } from "../validators/order.validator.js";

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = validateCreateOrderInput(req.body);

      // Extract Idempotency-Key header if provided
      const rawIdempotencyKey =
        req.headers["idempotency-key"] || req.headers["x-idempotency-key"];
      const idempotencyKey =
        typeof rawIdempotencyKey === "string" ? rawIdempotencyKey.trim() : undefined;

      const orderData = await OrderService.createOrder({
        cartId: validated.cartId,
        idempotencyKey,
      });

      res.status(201).json({
        success: true,
        data: orderData,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const orderData = await OrderService.getOrderById(id);

      res.status(200).json({
        success: true,
        data: orderData,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOrderByNumber(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderNumber } = req.params;
      const orderData = await OrderService.getOrderByNumber(orderNumber);

      res.status(200).json({
        success: true,
        data: orderData,
      });
    } catch (err) {
      next(err);
    }
  }

  static async cancelPendingCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id || req.body.orderId;
      const result = await OrderService.cancelPendingCheckout(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
