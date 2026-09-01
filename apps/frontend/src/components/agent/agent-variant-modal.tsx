import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Loader2, Check } from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { ProductService } from "../../services/product.service";
import { useCart } from "../../context/cart-context";
import { useToast } from "../../context/toast-context";

interface ProductItem {
  id: string;
  name: string;
  brand?: string;
  price: number;
  source?: string;
  sourceEventId?: string;
  aiAttributionSource?: string;
}

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: string | null;
  stock: number;
  attributes: Record<string, any>;
}

interface AgentVariantModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

export const AgentVariantModal: React.FC<AgentVariantModalProps> = ({ product, onClose }) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;

    const fetchFreshDetails = async () => {
      setLoading(true);
      try {
        const details = await ProductService.getProductById(product.id);
        if (details?.data && Array.isArray(details.data.variants)) {
          setVariants(details.data.variants);
          if (details.data.variants.length > 0) {
            setSelectedVariant(details.data.variants[0]);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch fresh variant details:", err);
        toast("Failed to load current product options.", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchFreshDetails();
  }, [product]);

  if (!product) return null;

  const handleAdd = async () => {
    if (!selectedVariant) return;
    setSubmitting(true);

    let source: string | undefined = product?.aiAttributionSource;
    if (!source && product?.source) {
      if (product.source === "recommendation") source = "AI_RECOMMENDATION";
      else if (product.source === "upsell") source = "AI_UPSELL";
      else if (product.source === "cross-sell" || product.source === "cross_sell") source = "AI_CROSS_SELL";
      else if (product.source === "accessory") source = "AI_ACCESSORY";
      else source = product.source;
    }
    const sourceEventId = product?.sourceEventId;

    try {
      await addItem(product.id, selectedVariant.id, quantity, product.name, selectedVariant.name, source, sourceEventId);
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to add item to cart.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const activePrice = selectedVariant?.price ? parseFloat(selectedVariant.price) : product.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[#07060C]/80 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md max-w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#120E1F]/95 backdrop-blur-xl p-5 sm:p-6 shadow-2xl flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#8B5CF6]">Configure Options</span>
            <h3 className="text-base font-black text-white leading-tight">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="h-44 flex flex-col items-center justify-center space-y-2 text-[#A39CAF]">
            <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
            <span className="text-xs font-bold uppercase tracking-wider">Syncing stock data...</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Options List */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#A39CAF]">Choose Variant</label>
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {Array.isArray(variants) && variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const vPrice = v.price ? parseFloat(v.price) : product.price;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#8B5CF6] bg-[#8B5CF6]/5"
                          : "border-white/[0.06] bg-transparent hover:border-white/12"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{v.name}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#8B5CF6]" />}
                        </div>
                        <span className="text-[10px] text-neutral-400 block font-mono">SKU: {v.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-white block">{formatCurrency(vPrice)}</span>
                        <span className={`text-[9px] font-bold ${v.stock > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Control */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] select-none">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A39CAF]">Quantity</span>
              <div className="flex items-center gap-1 bg-[#07060C]/60 border border-white/[0.08] rounded-xl h-9 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-7 h-full flex items-center justify-center font-black text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={selectedVariant ? quantity >= selectedVariant.stock : true}
                  className="w-7 h-full flex items-center justify-center font-black text-neutral-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Summary Price & Action CTA */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] select-none">
              <div>
                <span className="text-[9px] font-bold text-[#A39CAF]/60 uppercase tracking-widest block">Estimated Total</span>
                <span className="text-lg font-black text-white">{formatCurrency(activePrice * quantity)}</span>
              </div>

              <button
                onClick={handleAdd}
                disabled={submitting || !selectedVariant || selectedVariant.stock <= 0}
                className="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-500/10 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
