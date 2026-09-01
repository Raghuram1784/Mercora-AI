import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";

interface ProductSearchProps {
  initialSearch: string;
  onSearchChange: (search: string) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  initialSearch,
  onSearchChange,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A39CAF]">
        <Search className="h-5 w-5" />
      </div>
      <Input
        type="text"
        placeholder="Search products, brands, categories..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-11 pr-12 border-white/[0.08] bg-[#0F0D18]/40 hover:bg-[#0F0D18]/60 focus-visible:ring-[#8B5CF6]/50 focus-visible:border-[#8B5CF6]/30 h-12 text-[#F8F7FC] placeholder-[#A39CAF]/40 rounded-xl transition-all text-sm shadow-inner"
      />
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#A39CAF] hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
