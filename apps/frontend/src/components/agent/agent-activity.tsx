import React, { useState } from "react";
import { ChevronDown, ChevronUp, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActionItem {
  tool: string;
  status: "success" | "failure";
  summary: string;
}

interface AgentActivityProps {
  actions: ActionItem[];
}

export const AgentActivity: React.FC<AgentActivityProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!actions || actions.length === 0) return null;

  return (
    <div className="w-full max-w-[420px] rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden transition-all hover:bg-white/[0.02]">
      {/* Trigger Header Row */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#A39CAF]/80 hover:text-white cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Cpu className="h-3 w-3 text-violet-400" />
          <span>Agent Activity ({actions.length})</span>
        </div>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Collapsible Details list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-white/[0.04] space-y-2 select-none">
              {actions.map((act, index) => (
                <div key={index} className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="text-[9px] font-mono font-bold bg-white/[0.04] border border-white/10 px-1.5 py-0.5 rounded text-violet-300">
                      TOOL: {act.tool}
                    </span>
                    <span className={`text-[9px] font-bold ${
                      act.status === "success" ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {act.status === "success" ? "● Success" : "● Failed"}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed leading-snug pl-0.5">
                    {act.summary}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
