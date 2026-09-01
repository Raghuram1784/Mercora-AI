import { prisma } from "../config/database.js";
import { CreateCustomerInput } from "../types/customer.types.js";

export class ConflictError extends Error {
  statusCode = 409;
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ConflictError";
    this.code = code;
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "NotFoundError";
    this.code = code;
  }
}

export class CustomerService {
  static async createCustomer(data: CreateCustomerInput) {
    const existing = await prisma.customer.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError("CUSTOMER_EMAIL_EXISTS: A customer with this email already exists.");
    }

    return prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        active: true,
      },
    });
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundError("CUSTOMER_NOT_FOUND: Customer not found.");
    }

    return customer;
  }
}
