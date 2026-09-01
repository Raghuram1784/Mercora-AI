import { Router } from "express";
import { createCustomer, getCustomerById } from "../controllers/customer.controller.js";

const router = Router();

router.post("/", createCustomer);
router.get("/:id", getCustomerById);

export default router;
