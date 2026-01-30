'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Skip link for keyboard navigation
 * Allows keyboard users to skip directly to main content
 * WCAG 2.1 Success Criterion 2.4.1 - Bypass Blocks
 */
export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
        'focus:bg-background focus:text-foreground',
        'focus:px-4 focus:py-2 focus:rounded-md',
        'focus:border focus:border-border focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'transition-none',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Main content landmark wrapper
 * Pairs with SkipLink for accessible navigation
 */
export function MainContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main id="main-content" tabIndex={-1} className={cn('outline-none', className)} role="main">
      {children}
    </main>
  );
}
