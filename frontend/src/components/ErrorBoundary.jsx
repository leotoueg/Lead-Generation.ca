import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Runtime error caught by ErrorBoundary:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary"
          className="flex min-h-screen flex-col items-center justify-center bg-[#050505] px-6 text-center text-white"
        >
          <h1 className="font-display text-4xl uppercase tracking-tight">Something went wrong</h1>
          <p className="mt-4 max-w-md text-white/60">
            We hit an unexpected error. Please reload the page — if it keeps happening, try again shortly.
          </p>
          <button
            onClick={this.handleReload}
            data-testid="error-boundary-reload"
            className="mt-8 rounded-full bg-gradient-to-b from-white to-[#c2c6cd] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-black transition-transform hover:scale-[1.03]"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
