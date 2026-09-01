import React, { useState } from "react";
import { Sheet } from "../ui/sheet";
import { useCart } from "../../context/cart-context";
import { CartItemRow } from "./cart-item";
import { ShoppingCart, CreditCard, ArrowRight, Loader2, AlertCircle, Lock, RefreshCw, XCircle } from "lucide-react";
import { formatCurrency } from "../../lib/currency";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { OrderService } from "../../services/order.service";
import { Order } from "../../types/order";
import { OrderConfirmationModal } from "./order-confirmation-modal";
import { useToast } from "../../context/toast-context";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, initError, refreshCart, cancelPendingCheckout } = useCart();
  const { toast } = useToast();
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [cancellingCheckout, setCancellingCheckout] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const items = cart?.items || [];
  const subtotal = cart?.summary.subtotal || "0.00";
  const isLocked = cart?.status === "CHECKOUT_PENDING";

  const handleCheckout = async () => {
    if (!cart?.id || loadingOrder) return;
    setLoadingOrder(true);
    setOrderError(null);

    // If order already created and pending, reuse it
    if (createdOrder && createdOrder.status === "PENDING_PAYMENT") {
      setLoadingOrder(false);
      return;
    }

    try {
      const res = await OrderService.createOrder(cart.id);
      if (res.success && res.data) {
        setCreatedOrder(res.data);
        await refreshCart();
      } else {
        setOrderError(res.error?.message || "Failed to create order.");
      }
    } catch (err: any) {
      setOrderError(err.message || "An unexpected error occurred.");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleCancelPendingCheckout = async () => {
    if (!cart?.id) return;
    setCancellingCheckout(true);
    setOrderError(null);

    try {
      const targetId = createdOrder?.id || cart.id;
      await cancelPendingCheckout(targetId);
      setCreatedOrder(null);
      toast("Pending checkout cancelled. Your cart is now editable.", "info");
    } catch (err: any) {
      console.error("Cancel pending checkout failed:", err);
      setOrderError(err.message || "Failed to cancel pending checkout.");
      toast(err.message || "Failed to cancel checkout.", "error");
    } finally {
      setCancellingCheckout(false);
    }
  };

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} title="Your Cart">
        {initError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
            <p className="text-sm font-medium text-rose-400 mb-1">Configuration Error</p>
            <p className="text-xs">{initError}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl animate-pulse scale-110" />
              <div className="h-16 w-16 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center relative">
                <ShoppingCart className="h-7 w-7 text-violet-400 animate-bounce" />
              </div>
            </div>
            <div className="space-y-2 max-w-[280px]">
              <h3 className="font-extrabold text-white text-lg tracking-tight">Your cart is waiting.</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Explore the catalog and add something you like.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs py-2 px-5 rounded-full cursor-pointer flex items-center gap-1.5 shadow-md shadow-black/40"
            >
              <span>Explore Products</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between h-full min-h-0">
            {/* Scrollable Cart Items list */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar space-y-3">
              {/* Locked Checkout Warning Banner */}
              {isLocked && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-extrabold uppercase tracking-wide block text-white">Checkout Pending</span>
                    <p className="text-neutral-300 font-medium leading-relaxed">
                      Your order is already prepared. Retry payment or cancel checkout to make changes.
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CartItemRow item={item} isLocked={isLocked} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Subtotal & Checkout display */}
            <div className="pt-4 border-t border-white/5 bg-[#07070a]/80 backdrop-blur-md mt-4 space-y-3 shrink-0">
              {orderError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{orderError}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400 font-semibold uppercase tracking-wider">Subtotal</span>
                <span className="text-xl font-extrabold text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              
              <p className="text-[10px] text-neutral-500 leading-relaxed font-normal">
                * Carts validate catalog stock availability dynamically. Subtotals exclude shipping and taxes.
              </p>

              {isLocked ? (
                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={handleCheckout}
                    disabled={loadingOrder || cancellingCheckout}
                    className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 border border-violet-500/30 rounded-xl shadow-lg shadow-violet-500/20 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {loadingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Preparing Payment...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Retry Payment</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleCancelPendingCheckout}
                    disabled={cancellingCheckout || loadingOrder}
                    className="w-full h-10 bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/10 rounded-xl cursor-pointer transition-all disabled:opacity-50"
                  >
                    {cancellingCheckout ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        <span>Cancelling Checkout...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Cancel Checkout & Edit Cart</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleCheckout}
                  disabled={loadingOrder}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 border border-violet-500/30 rounded-xl shadow-lg shadow-violet-500/20 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Continue to Payment</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        order={createdOrder}
        isOpen={!!createdOrder}
        onClose={() => {
          setCreatedOrder(null);
          onClose();
        }}
      />
    </>
  );
};
