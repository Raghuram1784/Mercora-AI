import React, { useState } from "react";
import { Star, ShoppingBag, Eye, Settings, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { formatCurrency } from "../../lib/currency";

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  imageUrl: string;
  hasVariants: boolean;
  rank?: number;
  score?: number;
  label?: string;
  reasons?: string[];
}

interface AgentMiniCardProps {
  product: ProductItem;
  onAddToCart: (productId: string) => Promise<void>;
  onSelectOptions: (product: ProductItem) => void;
  onViewDetails: (productId: string) => void;
  addingId: string | null;
}

export const AgentMiniCard: React.FC<AgentMiniCardProps> = ({
  product,
  onAddToCart,
  onSelectOptions,
  onViewDetails,
  addingId,
}) => {
  const isAdding = addingId === product.id;
  const [showReasons, setShowReasons] = useState(false);

  // Filter reasons for customer presentation
  const customerReasons = (product.reasons || []).filter(
    (r) => r.toLowerCase() !== "category match" && r.toLowerCase() !== "in stock"
  );

  const getBadgeStyle = (label?: string) => {
    switch (label) {
      case "Best Match":
        return "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
      case "Best Value":
        return "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]";
      case "Upgrade Available":
        return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
      case "Goes Well With":
      case "Accessory":
        return "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]";
      case "Strong Alternative":
      default:
        return "bg-white/[0.04] border-white/10 text-neutral-300";
    }
  };

  return (
    <div className="group rounded-xl border border-white/[0.06] bg-white/[0.01] hover:border-white/12 hover:bg-white/[0.02] transition-all overflow-hidden">
      {/* Top Banner if Label is present */}
      {product.label && (
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1 select-none">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getBadgeStyle(
              product.label
            )}`}
          >
            <Sparkles className="h-2.5 w-2.5 shrink-0" />
            <span>{product.label}</span>
          </span>

          {customerReasons.length > 0 && (
            <button
              onClick={() => setShowReasons(!showReasons)}
              className="text-[9px] font-bold text-neutral-400 hover:text-violet-300 flex items-center gap-0.5 cursor-pointer transition-colors"
            >
              <span>{product.label === "Upgrade Available" ? "Why upgrade" : "Why this fits"}</span>
              {showReasons ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            </button>
          )}
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-3 pt-1.5 flex gap-3 items-center">
        {/* Product Mini Image */}
        <div className="h-14 w-14 rounded-lg bg-white/[0.02] overflow-hidden shrink-0 border border-white/[0.06] relative">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop"}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Info Body */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2.5">
            <span className="text-[9px] font-bold text-neutral-400 uppercase truncate">
              {product.brand} • {product.category}
            </span>
            <div className="flex items-center gap-0.5 text-[9px] font-bold text-[#FBBF24] shrink-0">
              <Star className="h-2.5 w-2.5 fill-current" />
              <span>
                {(() => {
                  const parsed = typeof product.rating === "number"
                    ? product.rating
                    : typeof product.rating === "string"
                      ? parseFloat(product.rating)
                      : 0;
                  return (isNaN(parsed) ? 0 : parsed).toFixed(1);
                })()}
              </span>
            </div>
          </div>

          <h4 className="text-xs font-extrabold text-white group-hover:text-violet-300 transition-colors truncate">
            {product.name}
          </h4>

          {/* Pricing & CTA Actions */}
          <div className="flex items-center justify-between gap-3 pt-1 select-none">
            <span className="text-xs font-black text-white">{formatCurrency(product.price)}</span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onViewDetails(product.id)}
                className="h-7 w-7 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-neutral-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                title="View Product Details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              {product.hasVariants ? (
                <button
                  onClick={() => onSelectOptions(product)}
                  className="h-7 px-2.5 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/5 hover:bg-[#8B5CF6]/15 hover:border-[#8B5CF6]/50 text-violet-300 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer shrink-0"
                >
                  <Settings className="h-3 w-3" />
                  <span>Options</span>
                </button>
              ) : (
                <button
                  onClick={() => onAddToCart(product.id)}
                  disabled={isAdding}
                  className="h-7 px-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-1 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>{isAdding ? "Adding..." : "Add"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Reasons Drawer / Accordion */}
      {showReasons && customerReasons.length > 0 && (
        <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] bg-white/[0.005]">
          <div className="space-y-1">
            {customerReasons.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] text-neutral-300">
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
