export interface Product {
  id: string;
  merchantId: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string;
  category: string;
  price: string; // Decimal returned as string
  currency: string;
  stock: number;
  rating: string; // Decimal returned as string
  features: Record<string, any>;
  imageUrl: string;
  hasVariants: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: string | null;
  stock: number;
  attributes: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
}

export interface ProductDetail extends Product {
  merchant: MerchantSummary;
  variants: ProductVariant[];
  galleryImages: string[];
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ProductDetailResponse {
  success: boolean;
  data: ProductDetail;
}
