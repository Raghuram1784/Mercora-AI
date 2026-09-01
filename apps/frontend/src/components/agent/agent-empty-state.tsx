import React from "react";
import { Sparkles, Headphones, Watch, Volume2, BatteryCharging } from "lucide-react";
import { motion } from "framer-motion";

interface AgentEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  loading: boolean;
}

export const AgentEmptyState: React.FC<AgentEmptyStateProps> = ({ onSelectPrompt, loading }) => {
  const prompts = [
    { text: "Find headphones under ₹3,000", label: "Headphones", desc: "Under ₹3,000", icon: <Headphones className="h-4 w-4 text-violet-400" /> },
    { text: "Show fitness smartwatches", label: "Smartwatches", desc: "For fitness tracking", icon: <Watch className="h-4 w-4 text-indigo-400" /> },
    { text: "Best portable speaker for travel", label: "Speakers", desc: "Best for travel", icon: <Volume2 className="h-4 w-4 text-blue-400" /> },
    { text: "Find a 20,000mAh power bank", label: "Power banks", desc: "20,000mAh capacity", icon: <BatteryCharging className="h-4 w-4 text-purple-400" /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center max-w-xl mx-auto space-y-8 select-none">
      
      {/* Sparkles Brand Logo Block */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="flex flex-col items-center space-y-4"
      >
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles className="h-7 w-7 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Shop smarter. <span className="bg-gradient-to-r from-violet-400 to-[#A855F7] bg-clip-text text-transparent">With an agent.</span>
          </h1>
          <p className="text-[#A39CAF] text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            Mercora AI Online
          </p>
        </div>
      </motion.div>

      {/* Simplified Welcome Copy */}
      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-[#A39CAF] text-sm leading-relaxed max-w-md font-medium"
      >
        Describe what you need, your budget, and what matters most to you. I'll search Mercora and help you find the best match.
      </motion.p>

      {/* Suggested prompts in 2x2 Grid */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="w-full space-y-3 pt-4"
      >
        <span className="text-[10px] font-bold text-[#A39CAF]/50 uppercase tracking-widest block text-left pl-1">
          Suggested starting prompts
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => onSelectPrompt(prompt.text)}
              className="p-3.5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.1] active:scale-[0.98] transition-all flex items-start gap-3 text-left cursor-pointer group disabled:opacity-40 disabled:pointer-events-none"
            >
              <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] group-hover:bg-white/[0.06] transition-colors shrink-0">
                {prompt.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-extrabold text-neutral-200 group-hover:text-white transition-colors block leading-tight">
                  {prompt.label}
                </span>
                <span className="text-[10px] text-neutral-500 font-semibold block leading-tight truncate">
                  {prompt.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

    </div>
  );
};
