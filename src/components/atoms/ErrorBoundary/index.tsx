import React from "react";
import { ErrorBoundaryProps, ErrorBoundaryState } from "../../../types";

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex justify-center items-center p-4">
          {this.state.error?.message || "Something went wrong."}
        </div>
      );
    }

    return this.props.children;
  }
}
