import { request } from "./api";
import { CustomerResponse } from "../types/customer";

export class CustomerService {
  static async getCustomerById(customerId: string): Promise<CustomerResponse> {
    return request<CustomerResponse>(`/customers/${customerId}`);
  }
}
