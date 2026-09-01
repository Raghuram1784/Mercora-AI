import React, { useState, useEffect } from "react";
import { Order } from "../../types/order";
import { formatCurrency } from "../../lib/currency";
import { CheckCircle2, Clock, ShieldCheck, X, CreditCard, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { PaymentService } from "../../services/payment.service";
import { useCart } from "../../context/cart-context";
import { RazorpaySuccessResponse, VerifyRazorpayPaymentResponseData } from "../../types/payment";

interface OrderConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { resetCartToActive } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "preparing" | "opened" | "dismissed" | "verifying" | "verified" | "verification_failed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedResult, setVerifiedResult] = useState<VerifyRazorpayPaymentResponseData | null>(null);
  const [lastCallback, setLastCallback] = useState<RazorpaySuccessResponse | null>(null);

  // Reset internal checkout & verification state whenever order ID changes or modal opens/closes
  useEffect(() => {
    setLoading(false);
    setPaymentState("idle");
    setErrorMessage(null);
    setVerifiedResult(null);
    setLastCallback(null);
  }, [order?.id, isOpen]);

  if (!isOpen || !order) return null;

  const handleModalClose = () => {
    setLoading(false);
    setPaymentState("idle");
    setErrorMessage(null);
    setVerifiedResult(null);
    setLastCallback(null);
    onClose();
  };

  const handleVerifyCallback = async (response: RazorpaySuccessResponse) => {
    setLoading(true);
    setPaymentState("verifying");
    setErrorMessage(null);
    setLastCallback(response);

    try {
      const verifyRes = await PaymentService.verifyRazorpayPayment({
        mercoraOrderId: order.id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      // Sequence requirement:
      // verify payment -> receive verified response -> await CartContext replacement with Cart B -> set verified UI & enable Continue Shopping
      await resetCartToActive(verifyRes.nextCart);

      setVerifiedResult(verifyRes);
      setPaymentState("verified");
    } catch (err: any) {
      console.error("Payment verification failed:", err);
      setPaymentState("verification_failed");
      setErrorMessage(err.message || "Payment verification failed. Your order has not been marked as paid.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToPayment = async () => {
    if (loading) return;

    setLoading(true);
    setPaymentState("preparing");
    setErrorMessage(null);

    try {
      // 1. Fetch or create Razorpay order from backend
      const checkoutData = await PaymentService.createRazorpayOrder(order.id);

      // 2. Open Razorpay Checkout modal
      setPaymentState("opened");
      await PaymentService.openRazorpayCheckout(
        checkoutData,
        (successResponse) => {
          // Backend verification
          handleVerifyCallback(successResponse);
        },
        () => {
          // Modal dismissed by user
          setPaymentState("dismissed");
          setLoading(false);
        },
        (err) => {
          // Checkout launch error
          setPaymentState("error");
          setErrorMessage(err.message || "Unable to launch payment window.");
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.error("Payment initialization error:", err);
      setPaymentState("error");
      setErrorMessage(err.message || "We couldn't start the payment right now.");
      setLoading(false);
    }
  };

  const handleRetryVerification = () => {
    if (lastCallback) {
      handleVerifyCallback(lastCallback);
    }
  };

  const isVerified = paymentState === "verified";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={handleModalClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg max-w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto bg-[#0B0912] border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200 p-5 sm:p-7 flex flex-col gap-5 text-white">
        {/* Header close button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Status Header Banner */}
        <div className="flex flex-col items-center text-center space-y-2 pt-2">
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-full blur-xl animate-pulse ${
                isVerified ? "bg-emerald-500/30" : "bg-violet-500/20"
              }`}
            />
            <div
              className={`h-14 w-14 rounded-full border flex items-center justify-center relative ${
                isVerified
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "bg-violet-500/10 border-violet-500/30 text-violet-400"
              }`}
            >
              {isVerified ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              ) : (
                <CheckCircle2 className="h-7 w-7 text-violet-400" />
              )}
            </div>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white">
            {isVerified ? "Payment Successful 🎉" : "Order Created Successfully 🎉"}
          </h2>
          <p className="text-xs text-neutral-400">
            {isVerified
              ? "Your payment has been verified and your order is confirmed."
              : "Your internal Mercora order has been generated and price-snapshotted."}
          </p>
        </div>

        {/* Dynamic Feedback Card */}
        {paymentState === "verifying" && (
          <div className="p-3.5 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center gap-3 text-violet-300">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-400" />
            <div className="space-y-0.5 text-xs">
              <span className="font-extrabold uppercase tracking-wide block">Verifying Payment</span>
              <p className="text-neutral-200 font-medium">
                Please wait while we confirm your HMAC payment signature...
              </p>
            </div>
          </div>
        )}

        {paymentState === "verification_failed" && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-extrabold uppercase tracking-wide block">Verification Pending</span>
              <p className="text-neutral-200 font-medium">
                {errorMessage || "We couldn't verify this payment yet. Your order has not been marked as paid."}
              </p>
              <button
                onClick={handleRetryVerification}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-white font-bold text-[11px] transition-all cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry Verification</span>
              </button>
            </div>
          </div>
        )}

        {paymentState === "dismissed" && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-extrabold uppercase tracking-wide block">Payment Not Completed</span>
              <p className="text-neutral-200 font-medium">
                Your order is safe and still pending payment. You can retry at any time.
              </p>
            </div>
          </div>
        )}

        {paymentState === "error" && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-extrabold uppercase tracking-wide block">Payment Initialization Error</span>
              <p className="text-neutral-200 font-medium">
                {errorMessage || "We couldn't start the payment right now. Your order is safe and still pending payment."}
              </p>
            </div>
          </div>
        )}

        {/* Order Details Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Order Number
              </span>
              <span className="text-sm font-mono font-bold text-violet-300">
                {order.orderNumber}
              </span>
            </div>
            {isVerified ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>PAID</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                <Clock className="h-3 w-3" />
                <span>PENDING PAYMENT</span>
              </div>
            )}
          </div>

          {/* Payment ID display if verified */}
          {isVerified && verifiedResult && (
            <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <span className="text-[10px] text-neutral-400 font-semibold uppercase">Razorpay Payment ID</span>
              <span className="font-mono text-emerald-300 font-bold">{verifiedResult.payment.razorpayPaymentId}</span>
            </div>
          )}

          {/* Item Breakdown */}
          <div className="space-y-2 max-h-44 overflow-y-auto no-scrollbar pr-1">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.03] last:border-0"
              >
                <div className="flex flex-col pr-2">
                  <span className="font-semibold text-neutral-200 line-clamp-1">
                    {item.productName}
                  </span>
                  {item.variantName && (
                    <span className="text-[10px] text-neutral-400">
                      Option: {item.variantName}
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-500">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </span>
                </div>
                <span className="font-bold text-white shrink-0">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Summary Calculation */}
          <div className="border-t border-white/[0.06] pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Shipping</span>
              <span className="text-emerald-400 font-medium">Free</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-1.5 border-t border-white/[0.06]">
              <span>Total</span>
              <span className="text-emerald-300">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Security & Next Steps Note */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-violet-500/5 border border-violet-500/15 text-[11px] text-neutral-300">
          <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0" />
          <span>
            {isVerified
              ? "Payment securely verified by Mercora. Your order is confirmed."
              : "Payment is securely processed via Razorpay Test Mode."}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isVerified ? (
            <Button
              onClick={handleModalClose}
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl border border-violet-500/30 cursor-pointer shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Done</span>
            </Button>
          ) : (
            <>
              <Button
                onClick={handleModalClose}
                disabled={loading}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white font-bold text-xs py-2.5 rounded-xl border border-white/10 cursor-pointer disabled:opacity-50"
              >
                Close
              </Button>

              <Button
                onClick={handleContinueToPayment}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl border border-violet-500/30 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      {paymentState === "verifying" ? "Verifying payment..." : "Preparing secure payment..."}
                    </span>
                  </>
                ) : paymentState === "dismissed" || paymentState === "error" || paymentState === "verification_failed" ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Try Again</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Continue to Payment</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
