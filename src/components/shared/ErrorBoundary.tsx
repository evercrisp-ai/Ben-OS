"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8"
          role="alert"
        >
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            {this.state.error?.message ||
              "An unexpected error occurred. Please try again."}
          </p>
          <Button onClick={this.handleReset} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error fallback component
interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8"
      role="alert"
    >
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
        {error?.message || "An unexpected error occurred. Please try again."}
      </p>
      {resetErrorBoundary && (
        <Button onClick={resetErrorBoundary} className="mt-4" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
