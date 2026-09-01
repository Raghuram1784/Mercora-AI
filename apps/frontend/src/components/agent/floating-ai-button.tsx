import React from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingAIButtonProps {
  isOpen: boolean;
  onOpen: () => void;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ isOpen, onOpen }) => {
  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={onOpen}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-45 h-12 w-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 border border-violet-400/20 text-white cursor-pointer shadow-lg shadow-violet-500/20 flex items-center justify-center select-none"
          title="Ask Mercora AI"
        >
          <Sparkles className="h-5 w-5 animate-pulse" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
