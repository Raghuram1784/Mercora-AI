import React, { useState, useRef, useEffect } from "react";
import { X, Sparkles, Cpu, AlertTriangle, RefreshCw } from "lucide-react";
import { useCart } from "../../context/cart-context";
import { AgentService } from "../../services/agent.service";
import { AgentMessage as MessageType, ChatHistoryItem } from "../../types/agent";
import { AgentComposer } from "./agent-composer";
import { AgentMessage } from "./agent-message";
import { AgentErrorBoundary } from "./agent-error-boundary";
import { AgentVariantModal } from "./agent-variant-modal";

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: MessageType[];
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
  history: ChatHistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<ChatHistoryItem[]>>;
  recommendedProducts: any[];
  setRecommendedProducts: React.Dispatch<React.SetStateAction<any[]>>;
}

const AIAssistantDrawerContent: React.FC<Omit<AIAssistantDrawerProps, "isOpen">> = ({
  onClose,
  messages,
  setMessages,
  history,
  setHistory,
  recommendedProducts: _recommendedProducts,
  setRecommendedProducts,
}) => {
  const { cartId, refreshCart } = useCart();
  const customerId = import.meta.env.VITE_DEMO_CUSTOMER_ID || null;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Track active variant selection product
  const [activeVariantProduct, setActiveVariantProduct] = useState<any | null>(null);

  const activeRequestTimestamp = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || loading) return;

    setInput("");
    setErrorState(null);
    setLoading(true);

    const timestamp = Date.now();
    activeRequestTimestamp.current = timestamp;

    // 1. Build and render user message
    const userMsgId = Math.random().toString(36).substring(7);
    const userMsg: MessageType = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp,
    };
    setMessages((prev) => [...prev, userMsg]);

    const updatedHistory: ChatHistoryItem[] = [
      ...history,
      { role: "user", content: textToSend },
    ];
    setHistory(updatedHistory);

    console.log("[Agent Debug] Outbound Payload:", {
      message: textToSend,
      customerId,
      cartId,
      historyLength: updatedHistory.length,
    });

    try {
      // 2. Query API
      const res = await AgentService.sendMessage({
        message: textToSend,
        customerId,
        cartId,
        history: updatedHistory,
      });

      // Ignore stale request callbacks
      if (activeRequestTimestamp.current !== timestamp) return;

      if (!res.success || !res.data) {
        throw new Error(res.data?.message || "Mercora AI request failed.");
      }

      console.log("[Agent Debug] Inbound Response:", {
        success: res.success,
        messageSummary: res.data.message ? `${res.data.message.substring(0, 30)}...` : "none",
        productsCount: res.data.products?.length || 0,
        actionsCount: res.data.actions?.length || 0,
      });

      // 3. Render Assistant Response Bubble
      const assistantMsgId = Math.random().toString(36).substring(7);
      const assistantMsg: MessageType = {
        id: assistantMsgId,
        role: "assistant",
        content: res.data.message,
        timestamp: Date.now(),
        products: res.data.products,
        actions: res.data.actions,
        pendingAction: res.data.pendingAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setHistory((prev) => [...prev, { role: "assistant", content: res.data.message }]);

      if (res.data.products) {
        setRecommendedProducts(res.data.products);
      }
      if (res.data.cart) {
        await refreshCart();
      }

      // Automatically launch selection modal if variant confirmation is requested
      const pendingAction = res.data.pendingAction;
      if (pendingAction && pendingAction.type === "SELECT_VARIANT") {
        const fullProd: any = res.data.products?.find((p: any) => p.id === pendingAction.productId);
        setActiveVariantProduct({
          id: pendingAction.productId,
          name: pendingAction.productName,
          price: fullProd?.price || 0,
          source: fullProd?.source,
          sourceEventId: fullProd?.sourceEventId,
          aiAttributionSource: fullProd?.aiAttributionSource,
        });
      }
    } catch (err: any) {
      if (activeRequestTimestamp.current === timestamp) {
        console.error("Agent drawer chat request failed:", err);
        setErrorState(err.message || "Mercora AI couldn't complete that request.");
      }
    } finally {
      if (activeRequestTimestamp.current === timestamp) {
        setLoading(false);
      }
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setHistory([]);
    setRecommendedProducts([]);
    setActiveVariantProduct(null);
    setInput("");
    setErrorState(null);
  };

  const promptSuggestions = [
    { text: "Find headphones under ₹3,000", desc: "🎧 headphones under ₹3k" },
    { text: "Show fitness smartwatches", desc: "⌚ Fitness smartwatch" },
    { text: "Best portable speaker for travel", desc: "🔊 Travel speaker" },
    { text: "Find a 20,000mAh power bank", desc: "🔋 20,000mAh power bank" },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between h-full min-h-0 relative">
      
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-violet-400" />
          <div>
            <h2 className="text-sm font-black text-white leading-tight">Ask Mercora AI</h2>
            <span className="text-[9px] text-[#A39CAF] font-semibold tracking-wider block">Your shopping assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-2 select-none">
          <button
            onClick={handleClearConversation}
            disabled={loading}
            className="text-[10px] font-extrabold text-[#A39CAF] hover:text-white flex items-center gap-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] px-2.5 py-1.5 rounded-xl transition-all disabled:opacity-40"
            title="New Conversation"
          >
            <span>+ New Chat</span>
          </button>
          
          <button
            onClick={onClose}
            className="h-7.5 w-7.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages / suggestions list */}
      <div className="flex-1 overflow-y-auto py-4 min-h-0 pr-1 no-scrollbar space-y-4 mb-3">
        {messages.length === 0 ? (
          <div className="space-y-6 py-6">
            <div className="text-center space-y-2 max-w-[280px] mx-auto select-none">
              <h3 className="font-extrabold text-white text-base tracking-tight">Shopping, with an agent.</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-semibold">
                Describe what you need, your budget, and what matters most to you. I'll help you find the best match.
              </p>
            </div>

            {/* 2x2 Suggested prompt chips */}
            <div className="space-y-2 select-none">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#A39CAF]/60 block pl-1">Suggested Prompts</span>
              <div className="grid grid-cols-2 gap-2">
                {promptSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => handleSendMessage(sug.text)}
                    className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/12 active:scale-[0.98] text-left cursor-pointer transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span className="text-[10px] font-extrabold text-neutral-200 block truncate leading-tight capitalize">
                      {sug.desc.split(" ")[0]}
                    </span>
                    <span className="text-[9px] text-neutral-500 font-semibold block leading-tight truncate mt-0.5">
                      {sug.desc.split(" ").slice(1).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(messages) && messages.map((msg) => (
              <AgentMessage 
                key={msg.id} 
                message={msg} 
                onSelectOptions={setActiveVariantProduct}
                onCloseDrawer={onClose}
              />
            ))}

            {/* loader workflow */}
            {loading && (
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 pl-1 py-1 select-none">
                <Cpu className="h-3.5 w-3.5 text-violet-400 animate-spin" />
                <span>Mercora is working...</span>
              </div>
            )}

            {/* Inline Error block */}
            {errorState && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-200 flex flex-col gap-2.5 select-none">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Mercora AI couldn't display this response</span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  className="self-start px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/30"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Try Again</span>
                </button>
              </div>
            )}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Composer Input Footer */}
      <div className="pt-3 border-t border-white/[0.08] shrink-0">
        <AgentComposer
          input={input}
          setInput={setInput}
          onSubmit={() => handleSendMessage()}
          loading={loading}
          placeholder="Describe what you are looking for..."
        />
      </div>

      {/* Variant Modal selection */}
      {activeVariantProduct && (
        <AgentVariantModal
          product={activeVariantProduct}
          onClose={() => setActiveVariantProduct(null)}
        />
      )}

    </div>
  );
};

const DEFAULT_WIDTH = 460;
const MIN_WIDTH = 380;
const STORAGE_KEY = "mercora_ai_drawer_width";

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, ...props }) => {
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH) {
        const maxLimit = Math.min(720, Math.floor(window.innerWidth * 0.5));
        return Math.max(MIN_WIDTH, Math.min(parsed, maxLimit));
      }
    }
    return DEFAULT_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);

  // Sync isDesktop on window resize and clamp width
  useEffect(() => {
    const handleResize = () => {
      const isMd = window.innerWidth >= 768;
      setIsDesktop(isMd);
      if (isMd) {
        setDrawerWidth((prev) => {
          const maxLimit = Math.min(720, Math.floor(window.innerWidth * 0.5));
          return Math.max(MIN_WIDTH, Math.min(prev, maxLimit));
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcut Esc + overflow locking
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, props.onClose]);

  // Dragging handler for left edge
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDesktop) return;

    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = window.innerWidth - moveEvent.clientX;
      const maxLimit = Math.min(720, Math.floor(window.innerWidth * 0.5));
      const clampedWidth = Math.max(MIN_WIDTH, Math.min(newWidth, maxLimit));
      setDrawerWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      setDrawerWidth((current) => {
        try {
          localStorage.setItem(STORAGE_KEY, String(current));
        } catch (_) {}
        return current;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={props.onClose}
      />
      {/* Drawer Panel */}
      <div
        className={`relative w-full h-full bg-[#0B0912]/95 border-l border-white/[0.08] backdrop-blur-xl p-5 md:p-6 shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-200 ${
          isDragging ? "select-none !transition-none" : ""
        }`}
        style={
          isDesktop
            ? {
                width: `${drawerWidth}px`,
                maxWidth: "min(720px, 50vw)",
                minWidth: `${MIN_WIDTH}px`,
              }
            : undefined
        }
      >
        {/* Resize Handle on Left Edge (Desktop only) */}
        <div
          onMouseDown={startResizing}
          className="absolute -left-2.5 top-0 bottom-0 w-5 cursor-col-resize z-50 hidden md:flex items-center justify-center group select-none touch-none"
          title="Drag to resize drawer"
        >
          <div
            className={`w-1 h-12 rounded-full transition-all duration-150 ${
              isDragging
                ? "bg-violet-400 scale-y-125 shadow-[0_0_10px_rgba(167,139,250,0.9)]"
                : "bg-white/20 group-hover:bg-violet-400/80 group-hover:scale-y-110"
            }`}
          />
        </div>

        {/* Traps render exceptions inside the drawer locally */}
        <AgentErrorBoundary>
          <AIAssistantDrawerContent {...props} onClose={props.onClose} />
        </AgentErrorBoundary>
      </div>
    </div>
  );
};
