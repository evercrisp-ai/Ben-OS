'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ServerOff, Ban, Clock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ErrorType = 'network' | 'server' | 'not-found' | 'forbidden' | 'timeout' | 'unknown';

interface ApiErrorProps {
  error?: Error | null;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const errorConfig: Record<
  ErrorType,
  {
    icon: typeof AlertTriangle;
    title: string;
    description: string;
    color: string;
  }
> = {
  network: {
    icon: WifiOff,
    title: 'Connection Error',
    description: 'Unable to connect to the server. Check your internet connection.',
    color: 'text-orange-500',
  },
  server: {
    icon: ServerOff,
    title: 'Server Error',
    description: 'Something went wrong on our end. Please try again in a moment.',
    color: 'text-red-500',
  },
  'not-found': {
    icon: HelpCircle,
    title: 'Not Found',
    description: 'The requested resource could not be found.',
    color: 'text-muted-foreground',
  },
  forbidden: {
    icon: Ban,
    title: 'Access Denied',
    description: "You don't have permission to access this resource.",
    color: 'text-yellow-500',
  },
  timeout: {
    icon: Clock,
    title: 'Request Timeout',
    description: 'The request took too long. Please try again.',
    color: 'text-orange-500',
  },
  unknown: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
    color: 'text-destructive',
  },
};

const sizeConfig = {
  sm: {
    container: 'p-4',
    icon: 'size-6',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  md: {
    container: 'p-6',
    icon: 'size-10',
    title: 'text-base font-semibold',
    description: 'text-sm',
  },
  lg: {
    container: 'p-8',
    icon: 'size-12',
    title: 'text-lg font-semibold',
    description: 'text-base',
  },
};

function getErrorType(error?: Error | null): ErrorType {
  if (!error) return 'unknown';

  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network';
  }
  if (message.includes('500') || message.includes('server')) {
    return 'server';
  }
  if (message.includes('404') || message.includes('not found')) {
    return 'not-found';
  }
  if (
    message.includes('403') ||
    message.includes('forbidden') ||
    message.includes('unauthorized')
  ) {
    return 'forbidden';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }

  return 'unknown';
}

export function ApiError({
  error,
  message,
  onRetry,
  onGoBack,
  className,
  size = 'md',
}: ApiErrorProps) {
  const errorType = getErrorType(error);
  const config = errorConfig[errorType];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-lg border border-destructive/20 bg-destructive/5 animate-fade-in',
        sizes.container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={cn('rounded-full bg-destructive/10 p-3 mb-3', config.color)}>
        <Icon className={cn(sizes.icon)} aria-hidden="true" />
      </div>

      <h3 className={cn('text-foreground', sizes.title)}>{config.title}</h3>

      <p className={cn('text-muted-foreground mt-1 max-w-md', sizes.description)}>
        {message || config.description}
      </p>

      {error?.message && error.message !== message && (
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Technical details</summary>
          <p className="mt-1 font-mono text-left bg-muted p-2 rounded text-xs max-w-md break-all">
            {error.message}
          </p>
        </details>
      )}

      {(onRetry || onGoBack) && (
        <div className="flex items-center gap-3 mt-4">
          {onRetry && (
            <Button
              onClick={onRetry}
              size={size === 'sm' ? 'sm' : 'default'}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button variant="ghost" onClick={onGoBack} size={size === 'sm' ? 'sm' : 'default'}>
              Go Back
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Inline error for smaller contexts (like form fields or inline data)
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-2 text-sm text-destructive animate-shake', className)}
      role="alert"
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

// Toast-style error (for transient errors)
export function ErrorToast({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div
      className="flex items-center gap-3 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg animate-fade-in-up"
      role="alert"
    >
      <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1 text-sm">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-destructive-foreground/80 hover:text-destructive-foreground"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}
