import { Request, Response, NextFunction } from "express";
import { validateCreateCustomer } from "../validators/customer.validator.js";
import { validateUuid } from "../validators/cart.validator.js";
import { CustomerService } from "../services/customer.service.js";

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = validateCreateCustomer(req.body);
    const customer = await CustomerService.createCustomer(input);
    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = validateUuid(req.params.id, "customerId");
    const customer = await CustomerService.getCustomerById(id);
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};
