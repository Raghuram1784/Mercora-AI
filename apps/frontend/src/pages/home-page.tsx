import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ShoppingBag, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ProductService } from "../services/product.service";
import { Product } from "../types/product";
import { ProductGrid } from "../components/products/product-grid";

interface HomePageProps {
  onOpenAI: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAI }) => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await ProductService.getProducts({});
        // Select the top 6 premium products for the home shelf
        setFeaturedProducts(res.data.slice(0, 6));
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categories = [
    { name: "Headphones", count: "7 Items", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300&auto=format&fit=crop" },
    { name: "Earbuds", count: "7 Items", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=300&auto=format&fit=crop" },
    { name: "Smartwatches", count: "7 Items", img: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=300&auto=format&fit=crop" },
    { name: "Speakers", count: "6 Items", img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=300&auto=format&fit=crop" },
    { name: "Power Banks", count: "6 Items", img: "https://images.unsplash.com/photo-1619472381419-74d1a4c000bb?q=80&w=300&auto=format&fit=crop" },
    { name: "Accessories", count: "7 Items", img: "https://images.unsplash.com/photo-1589615369069-2f22b7a3cc20?q=80&w=300&auto=format&fit=crop" },
  ];

  return (
    <div className="space-y-16 py-4 select-none">
      
      {/* 1. Redesigned Premium Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-white/[0.04] bg-white/[0.01] p-6 sm:p-8 lg:p-12 relative overflow-hidden">
        {/* Glow ambient background spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />
        
        {/* Left Copy Panel */}
        <div className="lg:col-span-7 space-y-6 text-left relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2.5"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full inline-block">
              Mercora AI Assistant Enabled
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
              Premium Tech. <br />
              <span className="bg-gradient-to-r from-violet-400 to-[#A855F7] bg-clip-text text-transparent">Everyday Essentials.</span>
            </h1>
          </motion.div>

          <p className="text-[#A39CAF] text-sm sm:text-base leading-relaxed max-w-lg font-medium">
            Discover headphones, smartwatches, speakers and everyday accessories. Shop normally or search through natural language with our agent.
          </p>

          <div className="flex flex-wrap gap-3.5 pt-2">
            <button
              onClick={() => navigate("/shop")}
              className="px-6 py-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-black/30 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Shop Now</span>
            </button>
            
            <button
              onClick={onOpenAI}
              className="px-6 py-3 rounded-xl bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4 text-violet-400 animate-pulse" />
              <span>Ask Mercora AI</span>
            </button>
          </div>
        </div>

        {/* Right Headphone Visual Panel */}
        <div className="lg:col-span-5 flex justify-center relative min-h-[220px]">
          <div className="absolute w-[240px] h-[240px] rounded-full bg-violet-600/20 blur-[60px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"
            alt="Mercora Audio Hero Visual"
            className="h-64 sm:h-72 w-auto object-contain relative z-10 drop-shadow-[0_25px_50px_rgba(139,92,246,0.35)]"
          />
        </div>
      </div>

      {/* 2. Benefit Strip directly below Hero */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        {[
          { label: "AI Shopping", desc: "Shopping assistants integration", icon: <Sparkles className="h-4 w-4 text-violet-400" /> },
          { label: "Secure Shopping", desc: "Encrypted transactions gate", icon: <ShieldCheck className="h-4 w-4 text-emerald-400" /> },
          { label: "Easy Cart", desc: "Synchronized active catalog", icon: <ShoppingBag className="h-4 w-4 text-[#A855F7]" /> },
          { label: "Verified Catalog", desc: "Real-time stock validation", icon: <Truck className="h-4 w-4 text-blue-400" /> },
        ].map((item, idx) => (
          <div key={idx} className="p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05] shrink-0">
              {item.icon}
            </div>
            <div className="text-left min-w-0">
              <span className="text-xs font-extrabold text-white block leading-tight truncate">{item.label}</span>
              <span className="text-[9px] text-[#A39CAF] font-semibold block truncate mt-0.5">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Shop by Category quick links */}
      <div className="space-y-4">
        <div className="text-left">
          <h2 className="text-lg font-black text-white tracking-tight uppercase">Shop by Category</h2>
          <p className="text-[11px] text-[#A39CAF] font-semibold tracking-wide">Browse catalog collections directly</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => navigate(`/shop?category=${encodeURIComponent(cat.name)}`)}
              className="group h-24 rounded-2xl border border-white/[0.06] bg-[#07060C]/40 hover:border-white/12 overflow-hidden relative text-left cursor-pointer transition-all active:scale-[0.98]"
            >
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 group-hover:opacity-30 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex flex-col justify-end">
                <span className="text-xs font-black text-white group-hover:text-violet-300 transition-colors block leading-tight">
                  {cat.name}
                </span>
                <span className="text-[9px] text-[#A39CAF] font-semibold block leading-tight mt-0.5">
                  {cat.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Featured Products shelf */}
      <div className="space-y-6">
        <div className="flex items-end justify-between border-b border-white/[0.06] pb-3 text-left">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight uppercase">Featured Products</h2>
            <p className="text-[11px] text-[#A39CAF] font-semibold tracking-wide">Top choices selected by our team</p>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors active:translate-x-0.5"
          >
            <span>Browse All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <ProductGrid products={featuredProducts} loading={loading} error={null} />

        <div className="pt-2 text-center select-none">
          <button
            onClick={() => navigate("/shop")}
            className="px-6 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/12 text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>Browse All Products Catalog</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
