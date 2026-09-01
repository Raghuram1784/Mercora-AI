import { Router } from "express";
import {
  createOrGetActiveCart,
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
} from "../controllers/cart.controller.js";

const router = Router();

router.post("/", createOrGetActiveCart);
router.get("/:cartId", getCart);
router.post("/:cartId/items", addCartItem);
router.patch("/:cartId/items/:itemId", updateCartItem);
router.delete("/:cartId/items/:itemId", removeCartItem);

export default router;
