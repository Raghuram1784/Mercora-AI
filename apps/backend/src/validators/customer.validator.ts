import { CreateCustomerInput } from "../types/customer.types.js";
import { ValidationError } from "./product.validator.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateCustomer(body: any): CreateCustomerInput {
  if (!body) {
    throw new ValidationError("Request body is required.");
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();

  if (!name) {
    throw new ValidationError("Name is required and cannot be empty.");
  }

  if (!email) {
    throw new ValidationError("Email is required and cannot be empty.");
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError("Invalid email address format.");
  }

  return { name, email };
}
