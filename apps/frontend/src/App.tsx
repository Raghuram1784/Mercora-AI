import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/cart-context";
import { ToastProvider } from "./context/toast-context";
import { Header } from "./components/layout/header";
import { CartDrawer } from "./components/cart/cart-drawer";
import { HomePage } from "./pages/home-page";
import { ShopPage } from "./pages/shop-page";
import { ProductPage } from "./pages/product-page";
import { MerchantDashboardPage } from "./pages/merchant-dashboard";
import { AIAssistantDrawer } from "@/components/agent/agent-assistant-drawer";
import { FloatingAIButton } from "@/components/agent/floating-ai-button";
import { AgentMessage as MessageType, ChatHistoryItem } from "./types/agent";
import { useCart } from "./context/cart-context";

function AppContent() {
  const { isCartOpen, openCart, closeCart } = useCart();
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Lifted Assistant States to preserve chat logs when toggling drawer unmounts
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);

  const location = useLocation();
  const isProductPage = location.pathname.startsWith("/products/");

  return (
    <div className="min-h-screen text-[#F8F7FC] flex flex-col justify-between font-sans relative overflow-hidden selection:bg-violet-500/30 selection:text-violet-200">
      {/* Ambient Lighting Spots (pointer-events-none) */}
      <div className="absolute top-[5%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[30%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-600/8 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[140px] pointer-events-none z-0" />
      
      {/* Header layout */}
      <div className="z-40 relative">
        <Header 
          onOpenCart={openCart} 
          onOpenAI={() => setIsAIOpen(true)}
        />
      </div>

      {/* Main view container - Centered with max-width 1500px */}
      <main className="flex-1 w-full max-w-[1500px] mx-auto px-6 sm:px-8 py-8 pb-16 z-10 relative">
        <Routes>
          <Route path="/" element={<HomePage onOpenAI={() => setIsAIOpen(true)} />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/products/:productId" element={<ProductPage />} />
          <Route path="/merchant" element={<MerchantDashboardPage />} />
        </Routes>
      </main>

      {/* Shopping Cart Slider Sheet Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        messages={messages}
        setMessages={setMessages}
        history={history}
        setHistory={setHistory}
        recommendedProducts={recommendedProducts}
        setRecommendedProducts={setRecommendedProducts}
      />

      {/* Floating Action Button */}
      <FloatingAIButton isOpen={isAIOpen} onOpen={() => setIsAIOpen(true)} />

      {/* Footer */}
      {!isProductPage && (
        <footer className="border-t border-white/[0.04] py-8 bg-[#07060C]/40 backdrop-blur-md z-10 relative">
          <div className="max-w-[1500px] mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A39CAF]">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#F8F7FC] font-bold text-xs">
                M
              </div>
              <span>&copy; {new Date().getFullYear()} Mercora AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </ToastProvider>
  );
}
