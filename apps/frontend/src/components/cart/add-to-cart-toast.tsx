import React from "react";
import { Check, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AddToCartNotification {
  productName: string;
  variantName?: string;
}

interface AddToCartToastProps {
  notification: AddToCartNotification | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export const AddToCartToast: React.FC<AddToCartToastProps> = ({
  notification,
  onClose,
  onOpenCart,
}) => {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-[70] w-full max-w-sm bg-[#0E0C17]/95 border border-violet-500/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl shadow-black/70 text-white flex flex-col gap-3.5 select-none"
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold text-emerald-400 tracking-wide uppercase block">
                  Added to cart
                </span>
                <p className="text-xs font-semibold text-neutral-100 leading-snug line-clamp-2">
                  <span className="text-white font-bold">{notification.productName}</span>
                  {notification.variantName ? (
                    <span className="text-violet-300 font-normal"> ({notification.variantName})</span>
                  ) : (
                    ""
                  )}{" "}
                  was added successfully.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06]">
            <button
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="flex-1 h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/20 cursor-pointer transition-all active:scale-[0.98]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>View Cart</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-9 bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-white/[0.08] active:scale-[0.98]"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
