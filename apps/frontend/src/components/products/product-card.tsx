import React, { useState } from "react";
import { Product } from "../../types/product";
import { formatCurrency } from "../../lib/currency";
import { Link, useNavigate } from "react-router-dom";
import { Star, ShoppingBag, Eye, Package } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useCart } from "../../context/cart-context";
import { useToast } from "../../context/toast-context";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.hasVariants) {
      navigate(`/products/${product.id}`);
      return;
    }

    setAdding(true);
    try {
      await addItem(product.id, null, 1, product.name);
    } catch (err: any) {
      toast(err.message || "Failed to add item to cart.", "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      whileHover={{ y: -4 }}
      className="h-full animate-none"
    >
      <Card className="overflow-hidden border-white/[0.08] bg-[#0F0D18] hover:border-white/15 transition-all duration-300 flex flex-col h-full group relative shadow-xl shadow-black/30">
        
        {/* Visual Curation - Dominant Photography Area (45%-55% height) */}
        <Link to={`/products/${product.id}`} className="block relative aspect-[4/3] w-full overflow-hidden bg-[#0B0912]/50 border-b border-white/[0.04]">
          {!imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageError(true)}
              className="object-contain w-full h-full p-4 group-hover:scale-104 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0B0912] via-[#0F0D18] to-[#120E1F] flex flex-col items-center justify-center gap-2 text-neutral-500 p-4">
              <Package className="h-8 w-8 text-[#8B5CF6]/60" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A39CAF]">Mercora Device</span>
            </div>
          )}
          
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <Badge className="bg-[#07060C]/90 backdrop-blur-md text-[#A39CAF] border-white/[0.08] font-bold capitalize text-[9px] px-2.5 py-0.5 hover:bg-[#07060C]/90">
              {product.category}
            </Badge>
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <Badge className="absolute top-3 right-3 bg-amber-500/10 border-transparent text-[#FBBF24] backdrop-blur-md text-[9px] font-bold px-2.5 py-0.5">
              Only {product.stock} Left
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge className="absolute top-3 right-3 bg-rose-500/10 border-transparent text-rose-400 backdrop-blur-md text-[9px] font-bold px-2.5 py-0.5">
              Out of Stock
            </Badge>
          )}
        </Link>

        {/* Card Metadata & Context */}
        <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9px] text-[#A39CAF] font-bold uppercase tracking-wider">{product.brand}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-[#FBBF24] text-[#FBBF24]" />
                <span className="text-xs font-bold text-[#F8F7FC]">{product.rating}</span>
              </div>
            </div>
            
            <Link to={`/products/${product.id}`} className="block">
              <h3 className="font-bold text-[#F8F7FC] group-hover:text-white transition-colors line-clamp-2 text-sm leading-snug min-h-[2.5rem]">
                {product.name}
              </h3>
            </Link>
          </div>

          {/* Pricing & CTA - Price label is changed from Authoritative to simple Price */}
          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#A39CAF] font-semibold uppercase tracking-wider">Price</span>
              <span className="font-extrabold text-white text-base">{formatCurrency(product.price)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Link to={`/products/${product.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/12 cursor-pointer text-[#A39CAF] hover:text-white"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleAction}
                disabled={adding || product.stock === 0}
                className="h-8 font-bold px-3 text-xs flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#A855F7] hover:to-[#6366F1] text-white border-none shadow-md shadow-violet-600/10 transition-all duration-200"
              >
                <ShoppingBag className="h-3 w-3" />
                <span>{product.hasVariants ? "Choose Options" : "Add"}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
