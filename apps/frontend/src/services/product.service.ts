import { request } from "./api";
import { ProductListResponse, ProductDetailResponse } from "../types/product";

export class ProductService {
  static async getProducts(filters: Record<string, any> = {}): Promise<ProductListResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return request<ProductListResponse>(`/products?${queryString}`);
  }

  static async getProductById(productId: string): Promise<ProductDetailResponse> {
    return request<ProductDetailResponse>(`/products/${productId}`);
  }
}
