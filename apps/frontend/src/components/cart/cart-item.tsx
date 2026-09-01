import React, { useState } from "react";
import { CartItem } from "../../types/cart";
import { formatCurrency } from "../../lib/currency";
import { Trash2, Plus, Minus, AlertTriangle } from "lucide-react";
import { useCart } from "../../context/cart-context";
import { useToast } from "../../context/toast-context";

interface CartItemRowProps {
  item: CartItem;
  isLocked?: boolean;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item, isLocked = false }) => {
  const { updateQuantity, removeItem } = useCart();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleUpdateQuantity = async (newQty: number) => {
    if (newQty < 1 || isLocked) return;
    setUpdating(true);
    try {
      await updateQuantity(item.id, newQty);
      toast("Cart updated successfully.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to update item quantity.", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isLocked) return;
    setRemoving(true);
    try {
      await removeItem(item.id);
      toast("Removed item from cart.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to remove item from cart.", "error");
    } finally {
      setRemoving(false);
    }
  };

  const isAvailable = item.availability.available;

  return (
    <div className={`py-4 border-b border-white/5 flex flex-col gap-2 ${!isAvailable ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white line-clamp-1">
            {item.product.name}
          </h4>
          {item.variant && (
            <p className="text-xs text-neutral-400 font-semibold mt-0.5 capitalize">
              Config: {item.variant.name}
            </p>
          )}
          
          {/* Availability Alert Badges */}
          {!isAvailable && (
            <div className="flex items-center gap-1.5 mt-1.5 text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {item.availability.reason === "OUT_OF_STOCK" && "Out of Stock"}
                {item.availability.reason === "PRODUCT_INACTIVE" && "Product Inactive"}
                {item.availability.reason === "VARIANT_INACTIVE" && "Variant Inactive"}
                {item.availability.reason === "INSUFFICIENT_STOCK" && `Only ${item.availability.stock} units left`}
              </span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-sm font-bold text-white block">
            {formatCurrency(item.lineTotal)}
          </span>
          <span className="text-[10px] text-neutral-500 font-semibold mt-0.5 block">
            {formatCurrency(item.unitPrice)} each
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-2">
        <div className={`flex items-center border border-white/5 rounded-lg bg-[#0d0d12] ${isLocked ? "opacity-40 pointer-events-none" : ""}`}>
          <button
            onClick={() => handleUpdateQuantity(item.quantity - 1)}
            disabled={updating || removing || item.quantity <= 1 || !isAvailable || isLocked}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 cursor-pointer"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-2.5 text-xs font-bold text-neutral-200 select-none w-8 text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => handleUpdateQuantity(item.quantity + 1)}
            disabled={updating || removing || !isAvailable || item.quantity >= item.availability.stock || isLocked}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 disabled:opacity-30 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {!isLocked && (
          <button
            onClick={handleRemove}
            disabled={removing || updating || isLocked}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-rose-400 transition-colors py-1 px-2 border border-transparent rounded-lg hover:border-white/5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>
    </div>
  );
};
