import React, { useState, useEffect } from "react";
import { Product } from "../types/product";
import { ProductService } from "../services/product.service";
import { ProductGrid } from "../components/products/product-grid";
import { ProductFilters } from "../components/products/product-filters";
import { ProductSearch } from "../components/products/product-search";
import { SlidersHorizontal, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";
import { Sheet } from "../components/ui/sheet";
import { useSearchParams } from "react-router-dom";

const CHIP_CATEGORIES = [
  { label: "All Products", value: "" },
  { label: "Headphones", value: "Headphones" },
  { label: "Earbuds", value: "Earbuds" },
  { label: "Smartwatches", value: "Smartwatches" },
  { label: "Speakers", value: "Speakers" },
  { label: "Power Banks", value: "Power Banks" },
  { label: "Accessories", value: "Accessories" }
];

export const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters directly from URL Search Parameters to support header search sync
  const filters = {
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minRating: searchParams.get("minRating") || "",
    inStock: searchParams.get("inStock") || "",
    search: searchParams.get("search") || "",
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ProductService.getProducts(filters);
      setProducts(response.data);
    } catch (err: any) {
      console.error("Failed to load products:", err);
      setError(err.message || "Unable to retrieve catalog products. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchParams]); // Re-fetch whenever query params change

  const handleFilterChange = (key: string, value: any) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "" || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Hero Section */}
      <div className="max-w-xl py-4 space-y-3">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Discover what <span className="bg-gradient-to-r from-[#A855F7] via-[#8B5CF6] to-[#6366F1] bg-clip-text text-transparent">fits you.</span>
        </h1>
        <p className="text-sm text-[#A39CAF] leading-relaxed max-w-md">
          Explore products selected for performance, utility and everyday use.
        </p>
      </div>

      {/* Search & Actions Control Bar - wide search shown below hero on mobile/tablet */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 md:hidden">
          <ProductSearch
            initialSearch={filters.search || ""}
            onSearchChange={(search) => handleFilterChange("search", search)}
          />
        </div>
        
        <div className="flex gap-2 ml-auto shrink-0">
          <Button
            variant="outline"
            className="lg:hidden flex items-center justify-center gap-2 border-white/[0.08] bg-[#0F0D18]/68 hover:bg-white/[0.06] hover:border-white/12 px-4 h-12 cursor-pointer rounded-xl text-[#A39CAF] hover:text-white"
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 text-[#8B5CF6]" />
            <span className="hidden sm:inline font-semibold">Filters</span>
          </Button>

          <Button
            variant="outline"
            className="border-white/[0.08] bg-[#0F0D18]/68 hover:bg-white/[0.06] hover:border-white/12 px-4 h-12 cursor-pointer rounded-xl"
            onClick={fetchProducts}
            title="Reload catalog"
          >
            <RefreshCw className={`h-4 w-4 text-[#A39CAF] ${loading ? "animate-spin text-[#8B5CF6]" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Category Pills (Chips) Selection Row */}
      <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 no-scrollbar select-none">
        {CHIP_CATEGORIES.map((chip) => {
          const isSelected = filters.category === chip.value;
          return (
            <button
              key={chip.label}
              onClick={() => handleFilterChange("category", chip.value)}
              className={`py-2 px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] border-[#8B5CF6] text-white shadow-lg shadow-violet-600/20"
                  : "bg-white/[0.02] border-white/[0.08] text-[#A39CAF] hover:border-white/12 hover:bg-white/[0.05] hover:text-neutral-200"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-24">
          <ProductFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Mobile Filters Sheet Drawer */}
        <Sheet
          isOpen={isMobileFiltersOpen}
          onClose={() => setIsMobileFiltersOpen(false)}
          title="Refine Products"
        >
          <div className="pt-4 h-full overflow-y-auto">
            <ProductFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </Sheet>

        {/* Products Grid */}
        <main className="flex-1 w-full">
          <ProductGrid
            products={products}
            loading={loading}
            error={error}
          />
        </main>
      </div>
    </div>
  );
};
