import React, { useState } from "react";
import { Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AgentMessage as MessageType } from "../../types/agent";
import { AgentActivity } from "@/components/agent/agent-activity";
import { AgentMiniCard } from "@/components/agent/agent-mini-card";
import { useCart } from "../../context/cart-context";
import { useToast } from "../../context/toast-context";
import { useNavigate } from "react-router-dom";

// Defensive ESM/CJS wrapper for ReactMarkdown under Vite environments
const MarkdownRenderer = (ReactMarkdown as any).default || ReactMarkdown;

interface AgentMessageProps {
  message: MessageType;
  onSelectOptions: (product: any) => void;
  onCloseDrawer: () => void;
}

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-2.5 last:mb-0 leading-relaxed text-xs md:text-sm text-neutral-300">{children}</p>,
  strong: ({ children }: any) => <strong className="font-extrabold text-white">{children}</strong>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3.5 space-y-1.5 text-xs md:text-sm text-neutral-300">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3.5 space-y-1.5 text-xs md:text-sm text-neutral-300">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-white/[0.08] bg-[#07060C]/20 backdrop-blur-md">
      <table className="w-full border-collapse text-left text-[11px] md:text-xs text-neutral-200">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-white/[0.03] border-b border-white/[0.08] text-[#A39CAF] font-bold uppercase tracking-wider text-[10px]">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => <tbody className="divide-y divide-white/[0.04]">{children}</tbody>,
  tr: ({ children }: any) => <tr className="hover:bg-white/[0.01] transition-colors">{children}</tr>,
  th: ({ children }: any) => <th className="px-4 py-2.5 font-bold">{children}</th>,
  td: ({ children }: any) => <td className="px-4 py-2.5 text-neutral-300 font-medium">{children}</td>,
};

export const AgentMessage: React.FC<AgentMessageProps> = ({
  message,
  onSelectOptions,
  onCloseDrawer,
}) => {
  const isUser = message.role === "user";
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddToCartDirect = async (productId: string) => {
    setAddingId(productId);
    const prod = message.products?.find((p: any) => p.id === productId);
    const prodName = prod?.name || "Product";
    
    let source: string | undefined = prod?.aiAttributionSource;
    if (!source && prod?.source) {
      if (prod.source === "recommendation") source = "AI_RECOMMENDATION";
      else if (prod.source === "upsell") source = "AI_UPSELL";
      else if (prod.source === "cross-sell" || prod.source === "cross_sell") source = "AI_CROSS_SELL";
      else if (prod.source === "accessory") source = "AI_ACCESSORY";
      else source = prod.source;
    }
    const sourceEventId = prod?.sourceEventId;

    try {
      await addItem(productId, null, 1, prodName, undefined, source, sourceEventId);
    } catch (err: any) {
      toast(err.message || "Failed to add to cart.", "error");
    } finally {
      setAddingId(null);
    }
  };

  const handleViewDetails = (productId: string) => {
    navigate(`/products/${productId}`);
    onCloseDrawer();
  };

  // Coerce message content to string defensively
  const safeContent = typeof message.content === "string" ? message.content : String(message.content || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`flex gap-3 max-w-[90%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar */}
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${
          isUser 
            ? "bg-[#161224] border-white/[0.06] text-[#A39CAF]" 
            : "bg-gradient-to-tr from-violet-600 to-indigo-600 border-violet-500/20 text-white"
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>

        {/* Message Bubble */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5 pl-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A39CAF]/60">
              {isUser ? "YOU" : "MERCORA AI"}
            </span>
          </div>

          <div className={`p-4 rounded-2xl border text-xs md:text-sm leading-relaxed ${
            isUser
              ? "bg-[#120E1F]/30 border-white/[0.05] text-[#F8F7FC] rounded-tr-none shadow-sm"
              : "bg-white/[0.02] border-white/[0.06] text-[#F8F7FC] rounded-tl-none shadow-sm backdrop-blur-md"
          }`}>
            <MarkdownRenderer remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {safeContent}
            </MarkdownRenderer>
          </div>

          {/* Mini Product Cards inline inside chat bubble */}
          {!isUser && Array.isArray(message.products) && message.products.length > 0 && (
            <div className="space-y-2 pt-1.5 select-none">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#A39CAF]/60 block pl-0.5">
                Recommended Products
              </span>
              <div className="grid grid-cols-1 gap-2">
                {message.products.map((p) => (
                  <AgentMiniCard
                    key={p.id}
                    product={p}
                    onAddToCart={handleAddToCartDirect}
                    onSelectOptions={onSelectOptions}
                    onViewDetails={handleViewDetails}
                    addingId={addingId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Action Logs under assistant's bubble */}
          {!isUser && Array.isArray(message.actions) && message.actions.length > 0 && (
            <div className="pt-1.5 pl-0.5">
              <AgentActivity actions={message.actions} />
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};
