import { Request, Response, NextFunction } from "express";
import {
  validateCreateCart,
  validateAddCartItem,
  validateUpdateCartItem,
  validateUuid,
} from "../validators/cart.validator.js";
import { CartService } from "../services/cart.service.js";

export const createOrGetActiveCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = validateCreateCart(req.body);
    const cart = await CartService.createOrGetActiveCart(input.customerId);
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cartId = validateUuid(req.params.cartId, "cartId");
    const cart = await CartService.getCart(cartId);
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cartId = validateUuid(req.params.cartId, "cartId");
    const input = validateAddCartItem(req.body);
    const item = await CartService.addCartItem(cartId, input);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cartId = validateUuid(req.params.cartId, "cartId");
    const itemId = validateUuid(req.params.itemId, "itemId");
    const input = validateUpdateCartItem(req.body);
    const item = await CartService.updateCartItem(cartId, itemId, input.quantity);
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cartId = validateUuid(req.params.cartId, "cartId");
    const itemId = validateUuid(req.params.itemId, "itemId");
    await CartService.removeCartItem(cartId, itemId);
    res.status(200).json({
      success: true,
      message: "Cart item successfully removed.",
    });
  } catch (error) {
    next(error);
  }
};
