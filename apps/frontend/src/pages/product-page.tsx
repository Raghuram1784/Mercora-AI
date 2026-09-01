import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProductDetail, ProductVariant } from "../types/product";
import { ProductService } from "../services/product.service";
import { useCart } from "../context/cart-context";
import { useToast } from "../context/toast-context";
import { formatCurrency } from "../lib/currency";
import { ArrowLeft, Star, ShoppingBag, Loader2, AlertCircle, Sparkles, Package, Battery, Radio, Wifi, Layers } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { VariantSelector } from "../components/products/variant-selector";
import { motion, AnimatePresence } from "framer-motion";

export const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [activeImage, setActiveImage] = useState<string>("");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const allImages = product ? [product.imageUrl, ...product.galleryImages] : [];
  const visibleImages = allImages.filter(img => !brokenImages[img]);

  useEffect(() => {
    if (visibleImages.length > 0 && !visibleImages.includes(activeImage)) {
      setActiveImage(visibleImages[0]);
    }
  }, [brokenImages, visibleImages, activeImage]);

  const fetchProductDetail = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await ProductService.getProductById(productId);
      setProduct(response.data);
      setActiveImage(response.data.imageUrl);
      if (response.data.variants && response.data.variants.length > 0) {
        const firstActive = response.data.variants.find(v => v.active);
        if (firstActive) {
          setSelectedVariant(firstActive);
        }
      }
    } catch (err: any) {
      console.error("Failed to load product detail:", err);
      setError(err.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="h-6 w-24 bg-[#0F0D18] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
          <div className="aspect-square w-full bg-[#0F0D18] rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-1/4 bg-[#0F0D18] rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-[#0F0D18] rounded animate-pulse" />
            <div className="h-6 w-1/3 bg-[#0F0D18] rounded animate-pulse" />
            <div className="h-20 w-full bg-[#0F0D18] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center space-y-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-100">Product Unavailable</h2>
          <p className="text-sm text-neutral-400">
            {error || "The requested product could not be loaded or is currently inactive."}
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" className="border-white/[0.08] bg-[#0B0912] hover:bg-neutral-900 mt-4 cursor-pointer rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>Back to Shop</span>
          </Button>
        </Link>
      </div>
    );
  }

  const hasVariants = product.variants && product.variants.length > 0;
  const resolvedPrice = selectedVariant?.price || product.price;
  const maxStock = selectedVariant ? selectedVariant.stock : product.stock;
  
  const handleAddToCart = async () => {
    if (hasVariants && !selectedVariant) {
      toast("Please choose an option before adding this product.", "error");
      return;
    }

    setAdding(true);
    try {
      await addItem(
        product.id,
        selectedVariant?.id || null,
        quantity,
        product.name,
        selectedVariant?.name
      );
    } catch (err: any) {
      if (err.code === "VARIANT_REQUIRED") {
        toast("Please choose an option before adding this product.", "error");
      } else {
        toast(err.message || "Failed to add item.", "error");
      }
    } finally {
      setAdding(false);
    }
  };
  const getProductBadges = (cat: string, feats: any) => {
    const badges: { icon: React.ReactNode; label: string }[] = [];
    if (!feats) return [];
    
    Object.entries(feats).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase();
      if (val === null || val === undefined || val === false) return;
      
      if (lowerKey.includes("battery")) {
        badges.push({ 
          icon: <Battery className="h-3.5 w-3.5" />, 
          label: `${val}${lowerKey.includes("days") ? " Days" : "H"} Battery` 
        });
      } else if (lowerKey.includes("noise") || lowerKey.includes("anc")) {
        badges.push({ 
          icon: <Radio className="h-3.5 w-3.5" />, 
          label: "ANC Active" 
        });
      } else if (lowerKey.includes("wireless") || lowerKey.includes("bluetooth") || lowerKey.includes("connection")) {
        const valStr = String(val);
        badges.push({ 
          icon: <Wifi className="h-3.5 w-3.5" />, 
          label: valStr.toLowerCase() === "true" ? "Wireless" : valStr
        });
      } else if (lowerKey.includes("dpi")) {
        badges.push({ 
          icon: <Sparkles className="h-3.5 w-3.5" />, 
          label: `${val} DPI` 
        });
      } else if (lowerKey.includes("buttons")) {
        badges.push({ 
          icon: <Layers className="h-3.5 w-3.5" />, 
          label: `${val} Buttons` 
        });
      } else if (lowerKey.includes("watt") || lowerKey.includes("power")) {
        badges.push({ 
          icon: <Sparkles className="h-3.5 w-3.5" />, 
          label: `${val}W Power` 
        });
      } else if (lowerKey.includes("ports")) {
        badges.push({ 
          icon: <Layers className="h-3.5 w-3.5" />, 
          label: `${val} Ports` 
        });
      } else if (lowerKey.includes("capacity")) {
        badges.push({ 
          icon: <Battery className="h-3.5 w-3.5" />, 
          label: `${val} mAh` 
        });
      } else if (lowerKey.includes("water") || lowerKey.includes("ipx")) {
        badges.push({ 
          icon: <Layers className="h-3.5 w-3.5" />, 
          label: String(val)
        });
      } else if (lowerKey.includes("length")) {
        badges.push({ 
          icon: <Layers className="h-3.5 w-3.5" />, 
          label: `${val}m Length` 
        });
      } else if (lowerKey.includes("material")) {
        badges.push({ 
          icon: <Sparkles className="h-3.5 w-3.5" />, 
          label: String(val) 
        });
      } else if (lowerKey.includes("display")) {
        badges.push({ 
          icon: <Sparkles className="h-3.5 w-3.5" />, 
          label: String(val) 
        });
      } else if (lowerKey.includes("keys")) {
        badges.push({ 
          icon: <Layers className="h-3.5 w-3.5" />, 
          label: `${val} Keys` 
        });
      }
    });

    if (badges.length < 4) {
      if (cat === "Headphones" || cat === "Earbuds") {
        if (!badges.some(b => b.label.includes("Hi-Fi"))) badges.push({ icon: <Sparkles className="h-3.5 w-3.5" />, label: "Hi-Fi Audio" });
        if (!badges.some(b => b.label.includes("Fit"))) badges.push({ icon: <Layers className="h-3.5 w-3.5" />, label: "Ergonomic Fit" });
      } else {
        if (!badges.some(b => b.label.includes("Premium"))) badges.push({ icon: <Sparkles className="h-3.5 w-3.5" />, label: "Premium Build" });
        if (!badges.some(b => b.label.includes("Travel"))) badges.push({ icon: <Package className="h-3.5 w-3.5" />, label: "Travel Friendly" });
      }
    }
    
    return badges.filter(b => b.label !== "").slice(0, 4);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1500px] mx-auto px-8 py-2 md:py-4 w-full relative z-10 select-none min-h-[calc(100vh-120px)] flex flex-col justify-center"
    >
      <Link to="/" className="inline-flex items-center text-xs font-semibold text-[#A39CAF] hover:text-[#F8F7FC] transition-colors mb-2">
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        <span>Back to Shop</span>
      </Link>

      {/* Main two-column details split grid */}
      <div className="product-details-grid pt-1 items-start gap-4 md:gap-6 xl:gap-8">
        
        {/* Left Column: Product Image Gallery */}
        <div className="flex flex-col md:flex-row gap-4 w-full items-start">
          
          {/* Thumbnails Strip (Vertical on desktop, horizontal on mobile) */}
          {visibleImages.length > 1 && (
            <div className="flex md:flex-col flex-row gap-2 shrink-0 md:w-[68px] w-full max-h-[285px] overflow-auto select-none order-2 md:order-1 no-scrollbar pb-1 md:pb-0">
              {visibleImages.map((imgUrl, idx) => {
                const isSelected = activeImage === imgUrl;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`h-[60px] w-[60px] md:h-[64px] md:w-[64px] rounded-xl overflow-hidden border shrink-0 bg-[#0B0912]/50 p-1 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-[#8B5CF6] ring-2 ring-[#8B5CF6]/10"
                        : "border-white/[0.08] hover:border-white/20"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} gallery ${idx}`}
                      onError={() => setBrokenImages(prev => ({ ...prev, [imgUrl]: true }))}
                      className="w-full h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Large Image Card Stage */}
          <div className="flex-1 w-full flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0F0D18]/40 shadow-2xl overflow-hidden order-1 md:order-2 h-[340px] min-[480px]:h-[400px] xl:h-[calc(100vh-210px)] xl:min-h-[420px] xl:max-h-[500px] min-[1600px]:max-h-[560px]">
            <div className="w-full h-full flex items-center justify-center relative p-6">
              <AnimatePresence mode="wait">
                {!imageError ? (
                  <motion.img
                    key={activeImage}
                    src={activeImage}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onError={() => setImageError(true)}
                    className="max-h-[280px] min-[480px]:max-h-[340px] xl:max-h-[390px] min-[1600px]:max-h-[440px] w-full h-full object-contain mx-auto"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-[#0f0e15] to-[#1a142e] flex flex-col items-center justify-center gap-2 text-neutral-500">
                    <Package className="h-12 w-12 text-violet-500/60" />
                    <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">Mercora Device</span>
                  </div>
                )}
              </AnimatePresence>
              
              {maxStock <= 5 && maxStock > 0 && (
                <Badge className="absolute top-4 right-4 bg-amber-500/10 border-transparent text-[#FBBF24] font-bold px-2.5 py-0.5 hover:bg-amber-500/10 rounded-full text-xs animate-pulse">
                  Only {maxStock} left
                </Badge>
              )}
              {maxStock === 0 && (
                <Badge className="absolute top-4 right-4 bg-rose-500/10 border-transparent text-rose-400 font-bold px-2.5 py-0.5 hover:bg-rose-500/10 rounded-full text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>

            {/* Dynamic premium feature badges inside card bottom area */}
            <div className="w-full grid grid-cols-2 min-[400px]:grid-cols-4 gap-1.5 p-2 bg-white/[0.02] border-t border-white/[0.06] select-none">
              {getProductBadges(product.category, product.features).map((badge, idx) => (
                <div key={idx} className="flex items-center gap-1.5 justify-center py-1 bg-white/[0.01] border border-white/[0.04] rounded-lg">
                  <span className="text-[#8B5CF6] shrink-0">{badge.icon}</span>
                  <span className="text-[9px] md:text-[10px] text-neutral-300 font-bold uppercase tracking-wider">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Product Details & Purchase Summary Panel */}
        <div className="p-5 md:p-6 rounded-2xl border border-white/[0.08] bg-[#120E1F]/20 backdrop-blur-md space-y-3.5 w-full overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-[#8B5CF6] font-extrabold uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight break-words">
              {product.name}
            </h1>
            
            {/* Rating row compactly aligned directly below title */}
            <div className="flex items-center gap-2.5 text-xs text-neutral-400 pt-0.5">
              <div className="flex items-center gap-1 bg-[#0F0D18] border border-white/[0.08] rounded-lg px-2 py-0.5">
                <Star className="h-3 w-3 fill-[#FBBF24] text-[#FBBF24]" />
                <span className="font-bold text-[#F8F7FC]">{product.rating}</span>
                <span className="text-[10px] opacity-60 ml-0.5">(120 Reviews)</span>
              </div>
              <span className="opacity-40">•</span>
              <span>Seller: <span className="text-[#8B5CF6] font-semibold">{product.merchant.name}</span></span>
            </div>
          </div>

          <hr className="border-white/[0.06] my-0.5" />

          {/* Pricing + Stock row */}
          <div className="flex items-center justify-between gap-4 select-none">
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-black text-white">{formatCurrency(resolvedPrice)}</span>
              <span className="text-[11px] text-neutral-500 line-through">{formatCurrency(Number(resolvedPrice) * 1.25)}</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.2 rounded-md border border-emerald-500/20">20% OFF</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={maxStock > 0 ? "text-emerald-400" : "text-rose-400"}>
                {maxStock > 0 ? `● In Stock` : "● Out of Stock"}
              </span>
            </div>
          </div>

          {/* Short Description (2 lines max) */}
          <p className="text-xs text-neutral-400 leading-relaxed max-w-xl line-clamp-2">
            {product.description || "Premium high-performance device designed for exceptional performance and daily comfort."}
          </p>

          {/* Bullet Highlights (2-column layout) */}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-semibold text-neutral-300 select-none">
            {product.category === "Headphones" && (
              <>
                <li className="flex items-center gap-1.5">✓ Hybrid Active ANC</li>
                <li className="flex items-center gap-1.5">✓ 40mm Hi-Res Drivers</li>
                <li className="flex items-center gap-1.5">✓ 40 Hours Playback</li>
                <li className="flex items-center gap-1.5">✓ Bluetooth 5.3 Link</li>
              </>
            )}
            {product.category === "Earbuds" && (
              <>
                <li className="flex items-center gap-1.5">✓ Smart Active ANC</li>
                <li className="flex items-center gap-1.5">✓ IPX5 Sweat Proof</li>
                <li className="flex items-center gap-1.5">✓ 32 Hours Total Play</li>
                <li className="flex items-center gap-1.5">✓ Ergo Fit Casing</li>
              </>
            )}
            {product.category === "Smartwatches" && (
              <>
                <li className="flex items-center gap-1.5">✓ AMOLED Smart Screen</li>
                <li className="flex items-center gap-1.5">✓ GPS Route Mapping</li>
                <li className="flex items-center gap-1.5">✓ 5ATM Water Proof</li>
                <li className="flex items-center gap-1.5">✓ 7 Days Battery Life</li>
              </>
            )}
            {product.category === "Speakers" && (
              <>
                <li className="flex items-center gap-1.5">✓ 30W Stereo Bass</li>
                <li className="flex items-center gap-1.5">✓ IPX7 Outdoor Waterproof</li>
                <li className="flex items-center gap-1.5">✓ 24 Hours Battery</li>
                <li className="flex items-center gap-1.5">✓ Bluetooth 5.1 Link</li>
              </>
            )}
            {product.category === "Power Banks" && (
              <>
                <li className="flex items-center gap-1.5">✓ 20000mAh Battery</li>
                <li className="flex items-center gap-1.5">✓ 22.5W Fast Charging</li>
                <li className="flex items-center gap-1.5">✓ Dual USB-C Interface</li>
                <li className="flex items-center gap-1.5">✓ Multi-Layer Safety</li>
              </>
            )}
            {product.category === "Accessories" && (
              <>
                <li className="flex items-center gap-1.5">✓ Heavy-Duty Nylon Build</li>
                <li className="flex items-center gap-1.5">✓ High Charging Speed</li>
                <li className="flex items-center gap-1.5">✓ Travel Ready Compact</li>
                <li className="flex items-center gap-1.5">✓ Universal Connectivity</li>
              </>
            )}
          </ul>

          {/* Option Selector */}
          {hasVariants && (
            <div className="mb-4 select-none">
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onSelectVariant={(v) => {
                  setSelectedVariant(v);
                  setQuantity(1);
                }}
                basePrice={product.price}
              />
            </div>
          )}

          {/* Quantity Selector + Add to Cart Call to Action Row */}
          <div className="space-y-3 pt-3 border-t border-white/[0.06] select-none">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Responsive Qty control (w-full on mobile, 140px on sm+) */}
              <div className="flex items-center justify-between border border-white/[0.08] rounded-xl bg-[#0B0912] h-11 sm:h-10 w-full sm:w-[140px] shrink-0 px-2 sm:px-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || maxStock === 0 || adding}
                  className="w-12 sm:w-10 text-[#A39CAF] hover:text-white disabled:opacity-30 h-full cursor-pointer font-bold text-base flex items-center justify-center min-h-[44px] min-w-[44px]"
                  aria-label="Decrease Quantity"
                >
                  -
                </button>
                <span className="text-xs font-bold text-[#F8F7FC] flex-1 text-center font-mono">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  disabled={quantity >= maxStock || maxStock === 0 || adding}
                  className="w-12 sm:w-10 text-[#A39CAF] hover:text-white disabled:opacity-30 h-full cursor-pointer font-bold text-base flex items-center justify-center min-h-[44px] min-w-[44px]"
                  aria-label="Increase Quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button (w-full on mobile, flex-1 on sm+) */}
              <Button
                onClick={handleAddToCart}
                disabled={adding || maxStock === 0}
                className="w-full sm:flex-1 h-11 sm:h-10 text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 rounded-xl shadow-lg transition-all hover:brightness-110 active:scale-[0.98] text-sm border-transparent"
                style={{ background: "linear-gradient(90deg, #7C3AED, #9333EA)" }}
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
                <span>Add to Cart</span>
              </Button>
            </div>

            {/* Compact Benefits Bar inside Right Panel Card bottom */}
            <div className="flex flex-wrap items-center justify-around sm:justify-between gap-2 pt-3 border-t border-white/[0.06] text-[10px] font-bold text-[#A39CAF]">
              <span className="flex items-center gap-1">↻ Replacement</span>
              <span className="flex items-center gap-1">🛡️ Warranty</span>
              <span className="flex items-center gap-1">🔒 Secure</span>
              <span className="flex items-center gap-1">✓ Genuine</span>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};