import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  side?: "right" | "left" | "top" | "bottom";
}

const SheetContext = React.createContext<{ isOpen: boolean; onClose: () => void }>({
  isOpen: false,
  onClose: () => {},
});

export const SheetHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("flex items-center justify-between pb-4 border-b border-white/[0.1]", className)}>
    {children}
  </div>
);

export const SheetTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h2 className={cn("text-lg font-bold text-white tracking-tight", className)}>{children}</h2>
);

export const SheetContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  side?: "right" | "left" | "top" | "bottom";
}> = ({ children, className, side = "right" }) => {
  const { isOpen, onClose } = React.useContext(SheetContext);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClasses = {
    right: "fixed right-0 top-0 bottom-0 h-full border-l border-white/10 animate-in slide-in-from-right",
    left: "fixed left-0 top-0 bottom-0 h-full border-r border-white/10 animate-in slide-in-from-left",
    top: "fixed top-0 left-0 right-0 border-b border-white/10 animate-in slide-in-from-top",
    bottom: "fixed bottom-0 left-0 right-0 border-t border-white/10 animate-in slide-in-from-bottom",
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      {/* Sheet Content Panel */}
      <div
        className={cn(
          "w-[85vw] max-w-sm sm:max-w-md bg-[#0D0B18] p-6 shadow-2xl flex flex-col z-50 overflow-y-auto text-white duration-200",
          sideClasses[side],
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-[#A39CAF] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer z-10"
          aria-label="Close panel"
        >
          <X className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1 flex flex-col pt-2 text-white">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, children, title, className, side = "right" }) => {
  return (
    <SheetContext.Provider value={{ isOpen, onClose }}>
      {title ? (
        <SheetContent side={side} className={className}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 py-4 flex flex-col">{children}</div>
        </SheetContent>
      ) : (
        <SheetContent side={side} className={className}>
          {children}
        </SheetContent>
      )}
    </SheetContext.Provider>
  );
};
