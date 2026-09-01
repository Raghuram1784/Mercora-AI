import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AgentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AgentErrorBoundary caught a crash:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Soft reload local storage / memory states instead of full reload if possible, but safe hard reset works
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-rose-500/5 rounded-xl border border-rose-500/20 my-6 shadow-md shadow-rose-500/5 select-none">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <div className="space-y-1">
            <h4 className="font-bold text-xs text-white">Mercora AI couldn't display this response</h4>
            <p className="text-[10px] text-rose-300/80 leading-normal font-semibold">
              An unexpected error occurred during message rendering.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-rose-500/30 active:scale-[0.98]"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
