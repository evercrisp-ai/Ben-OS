'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * VisuallyHidden component - hides content visually but keeps it accessible to screen readers
 * WCAG 2.1 compliant implementation
 */
export function VisuallyHidden({
  children,
  asChild,
  ...props
}: {
  children: React.ReactNode;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const Comp = asChild ? React.Fragment : 'span';

  return (
    <Comp
      {...(asChild
        ? {}
        : {
            ...props,
            className: cn(
              'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
              '[clip:rect(0,0,0,0)]',
              props.className
            ),
          })}
    >
      {children}
    </Comp>
  );
}

/**
 * Announce to screen readers - for dynamic content updates
 * Uses aria-live regions for accessibility
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  className,
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * Announce dynamic content to screen readers
 * Useful for toast notifications, form submissions, etc.
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string) => {
    // Clear and re-set to trigger announcement even for same message
    setAnnouncement('');
    requestAnimationFrame(() => {
      setAnnouncement(message);
    });
  }, []);

  const Announcer = React.useCallback(
    () => <LiveRegion politeness="polite">{announcement}</LiveRegion>,
    [announcement]
  );

  return { announce, Announcer };
}

/**
 * Focus trap - keeps focus within a container for modals/dialogs
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element on mount
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef]);
}

/**
 * Restore focus to previous element when component unmounts
 */
export function useFocusReturn() {
  const previousElement = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    previousElement.current = document.activeElement as HTMLElement;

    return () => {
      previousElement.current?.focus();
    };
  }, []);
}

/**
 * Roving tabindex for keyboard navigation in lists
 * Only one item is tabbable at a time, arrow keys move between items
 */
export function useRovingTabindex<T extends HTMLElement>(
  items: React.RefObject<T | null>[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    loop?: boolean;
  } = {}
) {
  const { orientation = 'vertical', loop = true } = options;
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const isNext =
        (orientation === 'vertical' && e.key === 'ArrowDown') ||
        (orientation === 'horizontal' && e.key === 'ArrowRight') ||
        (orientation === 'both' && (e.key === 'ArrowDown' || e.key === 'ArrowRight'));

      const isPrev =
        (orientation === 'vertical' && e.key === 'ArrowUp') ||
        (orientation === 'horizontal' && e.key === 'ArrowLeft') ||
        (orientation === 'both' && (e.key === 'ArrowUp' || e.key === 'ArrowLeft'));

      if (!isNext && !isPrev) return;

      e.preventDefault();

      let newIndex = activeIndex;

      if (isNext) {
        newIndex = activeIndex + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
      } else if (isPrev) {
        newIndex = activeIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
      }

      setActiveIndex(newIndex);
      items[newIndex]?.current?.focus();
    },
    [activeIndex, items, orientation, loop]
  );

  const getTabIndex = (index: number) => (index === activeIndex ? 0 : -1);

  return { activeIndex, setActiveIndex, handleKeyDown, getTabIndex };
}

/**
 * Color contrast checker utility
 * Returns true if the contrast ratio meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
 */
export function checkContrastRatio(
  foreground: string,
  background: string,
  isLargeText = false
): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = hex.match(/[A-Za-z0-9]{2}/g);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((c) => {
      const val = parseInt(c, 16) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const threshold = isLargeText ? 3 : 4.5;

  return ratio >= threshold;
}
