import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Cart } from "../types/cart";
import { CartService } from "../services/cart.service";
import { OrderService } from "../services/order.service";
import { AddToCartToast, AddToCartNotification } from "../components/cart/add-to-cart-toast";

interface CartContextType {
  cart: Cart | null;
  cartId: string | null;
  loading: boolean;
  error: string | null;
  initError: string | null;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
  resetCartToActive: (nextCartData?: any) => Promise<void>;
  cancelPendingCheckout: (orderId: string) => Promise<void>;
  addItem: (
    productId: string,
    variantId?: string | null,
    quantity?: number,
    productName?: string,
    variantName?: string,
    source?: string,
    sourceEventId?: string
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearError: () => void;
  addToCartNotification: AddToCartNotification | null;
  showAddToCartConfirmation: (productName: string, variantName?: string) => void;
  dismissAddToCartNotification: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Cart Drawer open state
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Add to cart confirmation toast state & timer ref
  const [addToCartNotification, setAddToCartNotification] = useState<AddToCartNotification | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const dismissAddToCartNotification = useCallback(() => {
    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
      notificationTimer.current = null;
    }
    setAddToCartNotification(null);
  }, []);

  const showAddToCartConfirmation = useCallback((productName: string, variantName?: string) => {
    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
    }
    setAddToCartNotification({ productName, variantName });
    notificationTimer.current = setTimeout(() => {
      setAddToCartNotification(null);
      notificationTimer.current = null;
    }, 4500);
  }, []);

  const customerId = import.meta.env.VITE_DEMO_CUSTOMER_ID;

  const initCart = async () => {
    if (!customerId) {
      setInitError("VITE_DEMO_CUSTOMER_ID environment variable is missing. Please create a .env file containing a valid customer UUID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const cartInit = await CartService.createOrGetCart(customerId);
      const activeCartId = cartInit.data.id;
      setCartId(activeCartId);
      
      const fullCart = await CartService.getCart(activeCartId);
      setCart(fullCart.data);
      setInitError(null);
    } catch (err: any) {
      console.error("Cart initialization failed:", err);
      setInitError(err.message || "Failed to initialize active shopping cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initCart();
  }, [customerId]);

  const refreshCart = async () => {
    if (!cartId) return;
    try {
      setLoading(true);
      const fullCart = await CartService.getCart(cartId);
      setCart(fullCart.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to refresh cart.");
    } finally {
      setLoading(false);
    }
  };

  const resetCartToActive = useCallback(
    async (nextCartData?: any) => {
      if (!customerId) return;
      
      // Clean up any stale cart ID persisted in storage
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("cartId");
        window.localStorage.removeItem("mercora_cart_id");
      }

      try {
        setLoading(true);
        let activeCart: Cart;

        if (nextCartData && nextCartData.id) {
          console.log(`verification nextCartId: ${nextCartData.id}`);
          try {
            const fullCart = await CartService.getCart(nextCartData.id);
            activeCart = fullCart.data;
          } catch {
            const cartInit = await CartService.createOrGetCart(customerId);
            const fullCart = await CartService.getCart(cartInit.data.id);
            activeCart = fullCart.data;
          }
        } else {
          const cartInit = await CartService.createOrGetCart(customerId);
          const fullCart = await CartService.getCart(cartInit.data.id);
          activeCart = fullCart.data;
        }

        // Atomically set all CartContext states to fresh active cart
        setCartId(activeCart.id);
        setCart(activeCart);
        setError(null);
        setInitError(null);

        console.log(`CartContext after payment: ${activeCart.id}`);
      } catch (err: any) {
        console.error("Failed to reset to fresh active cart:", err);
      } finally {
        setLoading(false);
      }
    },
    [customerId]
  );

  const cancelPendingCheckout = useCallback(
    async (orderId: string) => {
      try {
        setLoading(true);
        const res = await OrderService.cancelPendingCheckout(orderId);
        if (res.success && res.data?.cart) {
          setCartId(res.data.cart.id);
          setCart(res.data.cart);
          setError(null);
        } else {
          throw new Error(res.error?.message || "Failed to cancel pending checkout.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to cancel pending checkout.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addItem = async (
    productId: string,
    variantId: string | null = null,
    quantity: number = 1,
    productName?: string,
    variantName?: string,
    source?: string,
    sourceEventId?: string
  ) => {
    let targetCartId = cartId;

    // Safety check: if targetCartId is missing or cart is not ACTIVE, rehydrate active cart first
    if (!targetCartId || (cart && cart.status !== "ACTIVE")) {
      if (customerId) {
        const cartInit = await CartService.createOrGetCart(customerId);
        targetCartId = cartInit.data.id;
        setCartId(targetCartId);
      }
    }

    if (!targetCartId) throw new Error("No active cart found.");
    console.log(`addToCart cartId: ${targetCartId}, source: ${source}, sourceEventId: ${sourceEventId}`);

    setLoading(true);
    try {
      await CartService.addCartItem(targetCartId, { productId, variantId, quantity, source, sourceEventId });
      const fullCart = await CartService.getCart(targetCartId);
      setCart(fullCart.data);
      setCartId(fullCart.data.id);
      setError(null);

      if (productName) {
        showAddToCartConfirmation(productName, variantName);
      }
    } catch (err: any) {
      if (err.code === "CART_NOT_ACTIVE" && customerId) {
        console.warn("Encountered CART_NOT_ACTIVE. Fetching active cart for customer and retrying...");
        const freshCartInit = await CartService.createOrGetCart(customerId);
        const freshActiveCartId = freshCartInit.data.id;
        setCartId(freshActiveCartId);

        console.log(`addToCart cartId: ${freshActiveCartId}`);
        await CartService.addCartItem(freshActiveCartId, { productId, variantId, quantity, source, sourceEventId });
        const fullCart = await CartService.getCart(freshActiveCartId);
        setCart(fullCart.data);
        setError(null);

        if (productName) {
          showAddToCartConfirmation(productName, variantName);
        }
        return;
      }
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!cartId) throw new Error("No active cart found.");
    setLoading(true);
    try {
      await CartService.updateCartItem(cartId, itemId, quantity);
      const fullCart = await CartService.getCart(cartId);
      setCart(fullCart.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!cartId) throw new Error("No active cart found.");
    setLoading(true);
    try {
      await CartService.removeCartItem(cartId, itemId);
      const fullCart = await CartService.getCart(cartId);
      setCart(fullCart.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartId,
        loading,
        error,
        initError,
        isCartOpen,
        openCart,
        closeCart,
        refreshCart,
        resetCartToActive,
        cancelPendingCheckout,
        addItem,
        updateQuantity,
        removeItem,
        clearError,
        addToCartNotification,
        showAddToCartConfirmation,
        dismissAddToCartNotification,
      }}
    >
      {children}

      {/* Compact Add to Cart Confirmation Toast */}
      <AddToCartToast
        notification={addToCartNotification}
        onClose={dismissAddToCartNotification}
        onOpenCart={openCart}
      />
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
