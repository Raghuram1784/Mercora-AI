import React from "react";
import { Product } from "../../types/product";
import { ProductCard } from "./product-card";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle, ShoppingBag } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border border-white/[0.08] rounded-2xl p-4 bg-[#0F0D18] space-y-4">
            <Skeleton className="aspect-square w-full rounded-xl bg-white/[0.02]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3 bg-white/[0.02]" />
              <Skeleton className="h-6 w-3/4 bg-white/[0.02]" />
              <Skeleton className="h-4 w-full bg-white/[0.02]" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-6 w-1/4 bg-white/[0.02]" />
              <Skeleton className="h-8 w-1/3 bg-white/[0.02]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl bg-[#0F0D18]/40 p-6 max-w-md mx-auto space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-neutral-200">Catalog Loading Failed</h3>
          <p className="text-sm text-neutral-500">{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl bg-[#0F0D18]/40 p-6 max-w-md mx-auto space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0F0D18] border border-white/[0.08] text-neutral-500">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-semibold text-neutral-200">No Products Found</h3>
          <p className="text-sm text-neutral-500">Try modifying your filters or search string.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};
