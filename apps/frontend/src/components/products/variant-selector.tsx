import React from "react";
import { ProductVariant } from "../../types/product";
import { formatCurrency } from "../../lib/currency";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelectVariant: (variant: ProductVariant) => void;
  basePrice: string;
}

const getColorHex = (colorName: string): { bg: string; border?: string } => {
  const lower = colorName.toLowerCase().trim();

  if (lower.includes("black") || lower.includes("midnight") || lower.includes("charcoal") || lower.includes("dark")) {
    return { bg: "#0D0C13", border: "#333333" };
  }
  if (lower.includes("white") || lower.includes("cream") || lower.includes("pearl")) {
    return { bg: "#F8F7FC", border: "#CBD5E1" };
  }
  if (lower.includes("space gray") || lower.includes("space grey") || lower.includes("graphite")) {
    return { bg: "#3A3945", border: "#555555" };
  }
  if (lower.includes("silver") || lower.includes("platinum") || lower.includes("chrome")) {
    return { bg: "#E2E8F0", border: "#CBD5E1" };
  }
  if (lower.includes("gold") || lower.includes("champagne")) {
    return { bg: "#EAB308", border: "#CA8A04" };
  }
  if (lower.includes("rose gold") || lower.includes("pink")) {
    return { bg: "#F472B6", border: "#DB2777" };
  }
  if (lower.includes("navy") || lower.includes("deep blue")) {
    return { bg: "#1E3A8A", border: "#3B82F6" };
  }
  if (lower.includes("blue") || lower.includes("cyan") || lower.includes("teal")) {
    return { bg: "#2563EB", border: "#60A5FA" };
  }
  if (lower.includes("tan") || lower.includes("brown") || lower.includes("leather") || lower.includes("camel")) {
    return { bg: "#9A3412", border: "#C2410C" };
  }
  if (lower.includes("olive") || lower.includes("green") || lower.includes("forest") || lower.includes("sage")) {
    return { bg: "#15803D", border: "#22C55E" };
  }
  if (lower.includes("red") || lower.includes("crimson") || lower.includes("scarlet")) {
    return { bg: "#DC2626", border: "#EF4444" };
  }
  if (lower.includes("orange") || lower.includes("amber")) {
    return { bg: "#EA580C", border: "#F97316" };
  }
  if (lower.includes("purple") || lower.includes("violet") || lower.includes("lavender")) {
    return { bg: "#7C3AED", border: "#A855F7" };
  }

  // Default gradient for custom color names
  return { bg: "linear-gradient(135deg, #7C3AED, #2563EB)", border: "#8B5CF6" };
};

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariant,
  onSelectVariant,
  basePrice,
}) => {
  if (!variants || variants.length === 0) return null;

  // Determine if variants have a color attribute
  const colorKey = Object.keys(variants[0]?.attributes || {}).find((k) =>
    k.toLowerCase().includes("color")
  );

  const selectedColorName =
    selectedVariant && colorKey
      ? String(selectedVariant.attributes[colorKey] || selectedVariant.name)
      : selectedVariant?.name || "";

  // Check if prices differ across variants
  const firstPrice = variants[0]?.price || basePrice;
  const allPricesIdentical = variants.every((v) => (v.price || basePrice) === firstPrice);
  const showPrices = !allPricesIdentical;

  return (
    <div className="space-y-2.5 select-none w-full">
      {/* Header Row: Label, Selected Color Name & SKU */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#A39CAF]">
            {colorKey ? "CHOOSE COLOR" : "CHOOSE AN OPTION"}
          </label>
          {selectedColorName && (
            <span className="text-xs font-bold text-white bg-violet-500/15 border border-violet-500/30 px-2.5 py-0.5 rounded-full truncate max-w-[200px]">
              {selectedColorName}
            </span>
          )}
        </div>

        {selectedVariant && (
          <span className="text-[10px] text-neutral-400 font-mono shrink-0">
            SKU: <span className="text-violet-300 font-semibold">{selectedVariant.sku}</span>
          </span>
        )}
      </div>

      {/* Swatches (for Color attributes) vs Text Buttons (for non-color attributes) */}
      {colorKey ? (
        <div className="flex flex-wrap items-center gap-3 py-1">
          {variants.map((v) => {
            const isSelected = selectedVariant?.id === v.id;
            const colorVal = String(v.attributes[colorKey] || v.name);
            const { bg, border } = getColorHex(colorVal);
            const isOutOfStock = v.stock === 0;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVariant(v)}
                disabled={isOutOfStock}
                title={isOutOfStock ? `${colorVal} (Out of Stock)` : colorVal}
                aria-label={`${colorVal}${isSelected ? " (Selected)" : ""}${isOutOfStock ? " (Out of Stock)" : ""}`}
                className={`group relative h-10 w-10 min-h-[40px] min-w-[40px] rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? "ring-2 ring-[#8B5CF6] ring-offset-2 ring-offset-[#0F0D18] scale-110 shadow-lg shadow-violet-500/30"
                    : "hover:scale-105 border border-white/20 hover:border-white/50"
                } ${isOutOfStock ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                <span
                  className="h-full w-full rounded-full block border shadow-inner"
                  style={{
                    background: bg,
                    borderColor: border || "rgba(255,255,255,0.15)",
                  }}
                />

                {/* Selected Check Indicator */}
                {isSelected && (
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-xs font-black ${
                      bg === "#F8F7FC" || bg === "#E2E8F0" ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    ✓
                  </span>
                )}

                {/* Out of Stock Strikethrough */}
                {isOutOfStock && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-full h-0.5 bg-rose-500/80 rotate-45" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {variants.map((v) => {
            const isSelected = selectedVariant?.id === v.id;
            const isOutOfStock = v.stock === 0;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVariant(v)}
                disabled={isOutOfStock}
                className={`px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-center gap-0.5 relative ${
                  isSelected
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/15 text-white shadow-md shadow-violet-500/20 ring-1 ring-[#8B5CF6]/30"
                    : "border-white/[0.08] bg-white/[0.02] text-neutral-300 hover:border-white/20 hover:bg-white/[0.04]"
                } ${isOutOfStock ? "opacity-35 cursor-not-allowed" : ""}`}
              >
                <span className="font-extrabold text-xs text-white truncate">{v.name}</span>
                {showPrices && (
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {formatCurrency(v.price || basePrice)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
