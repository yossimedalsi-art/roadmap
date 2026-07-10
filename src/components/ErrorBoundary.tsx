import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in app tree:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center p-6 text-center"
          dir="rtl"
        >
          <p className="text-lg font-bold max-w-md leading-relaxed mb-6">
            משהו השתבש. נשמו עמוק — הכל שמור. רעננו את הדף כדי להמשיך.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition"
          >
            רענן את הדף
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
