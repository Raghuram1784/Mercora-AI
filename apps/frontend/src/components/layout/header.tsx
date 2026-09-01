import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ShoppingCart, Search, X, Sparkles, User, Menu, Home, ShoppingBag, LayoutDashboard } from "lucide-react";
import { useCart } from "../../context/cart-context";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  onOpenCart: () => void;
  onOpenAI: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenAI }) => {
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const itemCount = cart?.summary.itemCount || 0;

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Escape key handler for mobile menu modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      navigate(`/shop?search=${encodeURIComponent(val)}`);
    } else {
      navigate("/shop");
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#07060C]/90 backdrop-blur-xl">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 h-[70px] flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Desktop Links */}
        <div className="flex items-center space-x-6 sm:space-x-8 shrink-0">
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/20 shrink-0">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm sm:text-base leading-tight tracking-tight text-[#F8F7FC]">Mercora AI</span>
              <span className="text-[9px] text-[#A855F7] font-semibold uppercase tracking-wider">Agentic Commerce</span>
            </div>
          </Link>

          {/* Desktop Navigation Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/" className={`text-sm font-semibold transition-colors ${isActiveRoute("/") && location.pathname === "/" ? "text-white" : "text-[#A39CAF] hover:text-[#F8F7FC]"}`}>
              Home
            </Link>
            <Link to="/shop" className={`text-sm font-semibold transition-colors ${isActiveRoute("/shop") ? "text-white" : "text-[#A39CAF] hover:text-[#F8F7FC]"}`}>
              Shop
            </Link>
            <Link to="/merchant" className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-lg">
              <span className="font-extrabold text-xs">Merchant Dashboard</span>
            </Link>
          </nav>
        </div>

        {/* Wide Header Search Bar (Desktop Center >= 1024px) */}
        <div className="hidden lg:block flex-1 max-w-xl relative mx-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A39CAF]">
            <Search className="h-4 w-4" />
          </div>
          <Input
            type="text"
            placeholder="Search products, brands, categories..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-10 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] focus-visible:ring-[#8B5CF6]/50 focus-visible:border-[#8B5CF6]/30 h-10 text-sm text-[#F8F7FC] placeholder-[#A39CAF]/50 rounded-xl transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A39CAF] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Controls: Search (Mobile), Ask AI, Profile, Cart, Menu (Mobile) */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          
          {/* Mobile Search Toggle Button (< 1024px) */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="lg:hidden h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-[#A39CAF] hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
            title="Toggle Search"
            aria-label="Toggle Search Bar"
          >
            <Search className="h-4 w-4 text-violet-400" />
          </button>

          {/* Ask AI Button */}
          <button
            onClick={onOpenAI}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/12 transition-all text-[#F8F7FC] cursor-pointer shadow-sm active:scale-95"
            title="Ask Mercora AI"
          >
            <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Ask AI</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/12 flex items-center justify-center text-[#A39CAF] hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
              title="User Account"
            >
              <User className="h-4 w-4 text-violet-400" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl border border-white/[0.08] bg-[#0F0D18]/95 backdrop-blur-xl p-3 shadow-2xl z-20 space-y-2.5 text-left"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-white block">Demo Customer</span>
                      <span className="text-[10px] text-[#A39CAF] font-semibold block font-mono">demo@mercora.local</span>
                    </div>
                    
                    <div className="border-t border-white/[0.06]" />

                    <div className="flex flex-col gap-1 text-xs">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenCart();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] text-[#A39CAF] hover:text-white font-bold transition-all cursor-pointer"
                      >
                        My Cart
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          onOpenAI();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] text-[#A39CAF] hover:text-white font-bold transition-all cursor-pointer"
                      >
                        Ask Mercora AI
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/12 transition-all text-[#F8F7FC] cursor-pointer shadow-sm active:scale-95"
            title="Shopping Cart"
          >
            <ShoppingCart className="h-4 w-4 text-[#A855F7]" />
            <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <motion.div
                key={itemCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="shrink-0"
              >
                <Badge className="bg-[#8B5CF6] text-white font-bold px-1.5 py-0.2 text-[10px] rounded-full border-transparent ml-0.5 hover:bg-[#8B5CF6]">
                  {itemCount}
                </Badge>
              </motion.div>
            )}
          </button>

          {/* Mobile Menu Hamburger Button (< 1024px) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-[#A39CAF] hover:text-white transition-all cursor-pointer active:scale-95 shrink-0"
            title="Open Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>

        </div>
      </div>

      {/* Expandable Mobile Search Bar (< 1024px) */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden w-full px-4 py-2.5 border-t border-white/[0.08] bg-[#07060C]/95 backdrop-blur-xl"
          >
            <div className="relative w-full max-w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A39CAF]">
                <Search className="h-4 w-4" />
              </div>
              <Input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-9 border-white/[0.08] bg-white/[0.04] focus-visible:ring-[#8B5CF6]/50 focus-visible:border-[#8B5CF6]/30 h-10 text-sm text-[#F8F7FC] placeholder-[#A39CAF]/60 rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A39CAF] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered Mobile Navigation Floating Popup Modal (< 1024px via React Portal) */}
      {isMobileMenuOpen &&
        createPortal(
          <AnimatePresence>
            <div className="lg:hidden">
              {/* Dark Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Compact Centered Floating Popup Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="fixed top-[80px] left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-32px)] max-w-[380px] bg-[#0B0912]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-white"
              >
                {/* Modal Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-extrabold text-white tracking-tight">Navigation</h3>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-[#A39CAF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close Navigation"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>

                {/* Navigation Items List */}
                <nav className="flex flex-col gap-2">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      location.pathname === "/"
                        ? "bg-violet-600/30 border border-violet-500/40 text-white shadow-md shadow-violet-500/20"
                        : "text-neutral-200 hover:text-white hover:bg-violet-500/10"
                    }`}
                  >
                    <Home className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Home</span>
                  </Link>

                  <Link
                    to="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      location.pathname.startsWith("/shop")
                        ? "bg-violet-600/30 border border-violet-500/40 text-white shadow-md shadow-violet-500/20"
                        : "text-neutral-200 hover:text-white hover:bg-violet-500/10"
                    }`}
                  >
                    <ShoppingBag className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Shop</span>
                  </Link>

                  <Link
                    to="/merchant"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      location.pathname.startsWith("/merchant")
                        ? "bg-violet-600/30 border border-violet-500/40 text-white shadow-md shadow-violet-500/20"
                        : "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                    }`}
                  >
                    <LayoutDashboard className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Merchant Dashboard</span>
                  </Link>
                </nav>
              </motion.div>
            </div>
          </AnimatePresence>,
          document.body
        )}
    </header>
  );
};
