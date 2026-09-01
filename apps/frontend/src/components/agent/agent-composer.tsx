import React, { useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface AgentComposerProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
  placeholder?: string;
}

export const AgentComposer: React.FC<AgentComposerProps> = ({
  input,
  setInput,
  onSubmit,
  loading,
  placeholder = "Ask Mercora anything...",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#07060C]/40 backdrop-blur-xl transition-all duration-300 focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/10 p-2.5 flex items-end gap-2.5">
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={loading ? "Mercora is working..." : placeholder}
        disabled={loading}
        className="flex-1 max-h-[180px] bg-transparent text-sm text-[#F8F7FC] placeholder-[#A39CAF]/40 border-none outline-none resize-none px-2.5 py-1.5 leading-relaxed disabled:opacity-50"
        style={{ height: "38px" }}
      />
      <button
        onClick={onSubmit}
        disabled={loading || !input.trim()}
        className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:brightness-110 active:scale-95 disabled:scale-100 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center text-white cursor-pointer shadow-md shadow-violet-500/10 shrink-0"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowUp className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
