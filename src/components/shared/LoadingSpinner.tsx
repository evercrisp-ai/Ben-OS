'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeConfig = {
  xs: 'size-3',
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
};

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('flex items-center justify-center', className)}
    >
      <Loader2
        className={cn('animate-spin text-muted-foreground', sizeConfig[size])}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Full page loading overlay
export function PageLoadingOverlay({ message }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <span className="sr-only">{message || 'Loading...'}</span>
      </div>
    </div>
  );
}

// Inline loading with text
export function InlineLoading({
  text = 'Loading...',
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
      role="status"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

// Button loading state helper
export function ButtonLoading({
  isLoading,
  loadingText = 'Loading...',
  children,
}: {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <>
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>{loadingText}</span>
      </>
    );
  }
  return <>{children}</>;
}
