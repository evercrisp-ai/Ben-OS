/**
 * UI/UX Refinements Test Suite - Section 5.1
 * Tests for consistent spacing, typography, colors, animations,
 * loading states, empty states, error states, and accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import shared components
import {
  EmptyState,
  NoProjectsEmptyState,
  NoTasksEmptyState,
  ApiError,
  InlineError,
  LoadingSpinner,
  InlineLoading,
  PageLoadingOverlay,
  SkipLink,
  VisuallyHidden,
  LiveRegion,
  Skeleton,
  CardSkeleton,
  BoardSkeleton,
  WidgetSkeleton,
  ChartSkeleton,
  FormSkeleton,
  ListSkeleton,
} from '@/components/shared';

describe('5.1 UI/UX Refinements', () => {
  describe('5.1.5 Loading States - Skeleton Loaders', () => {
    it('renders base skeleton with proper animation class', () => {
      render(<Skeleton data-testid="skeleton" className="h-4 w-20" />);
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('renders CardSkeleton with proper structure', () => {
      const { container } = render(<CardSkeleton />);
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders BoardSkeleton with multiple columns', () => {
      const { container } = render(<BoardSkeleton />);
      expect(container.firstChild).toHaveClass('flex', 'gap-4');
    });

    it('renders WidgetSkeleton with header and content', () => {
      const { container } = render(<WidgetSkeleton />);
      expect(container.firstChild).toHaveClass('rounded-lg', 'border');
    });

    it('renders ChartSkeleton with chart-like structure', () => {
      const { container } = render(<ChartSkeleton />);
      expect(container.firstChild).toHaveClass('rounded-lg', 'border');
    });

    it('renders FormSkeleton with configurable fields', () => {
      const { container } = render(<FormSkeleton fields={3} />);
      expect(container.firstChild).toHaveClass('space-y-6');
    });

    it('renders ListSkeleton with configurable items', () => {
      const { container } = render(<ListSkeleton items={5} />);
      expect(container.firstChild).toHaveClass('divide-y');
    });

    it('renders LoadingSpinner with accessible label', () => {
      render(<LoadingSpinner label="Processing..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('renders InlineLoading with text', () => {
      render(<InlineLoading text="Saving changes..." />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveClass('text-muted-foreground');
      expect(screen.getByText('Saving changes...')).toBeInTheDocument();
    });

    it('renders PageLoadingOverlay with message', () => {
      render(<PageLoadingOverlay message="Loading application..." />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      // Check the visible message (not the sr-only version)
      expect(screen.getByText('Loading application...', { selector: 'p' })).toBeInTheDocument();
    });
  });

  describe('5.1.6 Empty States - Helpful Messages', () => {
    it('renders EmptyState with title and description', () => {
      render(<EmptyState title="No items found" description="Add items to get started" />);
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Add items to get started')).toBeInTheDocument();
    });

    it('renders EmptyState with action button', () => {
      const handleClick = vi.fn();
      render(<EmptyState title="No items" action={{ label: 'Add Item', onClick: handleClick }} />);
      const button = screen.getByRole('button', { name: /add item/i });
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('renders EmptyState with secondary action', () => {
      const onPrimary = vi.fn();
      const onSecondary = vi.fn();
      render(
        <EmptyState
          title="No items"
          action={{ label: 'Create', onClick: onPrimary }}
          secondaryAction={{ label: 'Learn More', onClick: onSecondary }}
        />
      );
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });

    it('renders EmptyState with different sizes', () => {
      const { rerender } = render(<EmptyState title="Test" size="sm" />);
      expect(screen.getByRole('status')).toHaveClass('py-6');

      rerender(<EmptyState title="Test" size="lg" />);
      expect(screen.getByRole('status')).toHaveClass('py-16');
    });

    it('renders NoProjectsEmptyState correctly', () => {
      const onCreate = vi.fn();
      render(<NoProjectsEmptyState onCreate={onCreate} />);
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
    });

    it('renders NoTasksEmptyState correctly', () => {
      const onCreate = vi.fn();
      render(<NoTasksEmptyState onCreate={onCreate} />);
      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
    });
  });

  describe('5.1.7 Error States - Clear Messages with Actions', () => {
    it('renders ApiError with retry button', () => {
      const handleRetry = vi.fn();
      render(<ApiError message="Failed to load data" onRetry={handleRetry} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);
      expect(handleRetry).toHaveBeenCalled();
    });

    it('renders ApiError with go back button', () => {
      const handleGoBack = vi.fn();
      render(<ApiError message="Not found" onGoBack={handleGoBack} />);
      const backButton = screen.getByRole('button', { name: /go back/i });
      fireEvent.click(backButton);
      expect(handleGoBack).toHaveBeenCalled();
    });

    it('renders different error types based on error message', () => {
      const { rerender } = render(<ApiError error={new Error('Network error')} />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();

      rerender(<ApiError error={new Error('500 Server error')} />);
      expect(screen.getByText('Server Error')).toBeInTheDocument();

      rerender(<ApiError error={new Error('404 Not found')} />);
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('renders InlineError with shake animation', () => {
      const { container } = render(<InlineError message="This field is required" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('animate-shake');
    });

    it('renders ApiError with technical details', () => {
      render(
        <ApiError error={new Error('Detailed technical error')} message="Something went wrong" />
      );
      expect(screen.getByText('Technical details')).toBeInTheDocument();
    });
  });

  describe('5.1.8 Accessibility - WCAG 2.1 AA Compliance', () => {
    it('renders SkipLink that becomes visible on focus', () => {
      render(<SkipLink />);
      const link = screen.getByText('Skip to main content');
      expect(link).toHaveClass('sr-only');
      expect(link).toHaveAttribute('href', '#main-content');
    });

    it('renders VisuallyHidden content for screen readers', () => {
      render(<VisuallyHidden>Screen reader only content</VisuallyHidden>);
      const content = screen.getByText('Screen reader only content');
      expect(content).toHaveClass('absolute', 'w-px', 'h-px');
    });

    it('renders LiveRegion with proper aria attributes', () => {
      render(<LiveRegion>Status update</LiveRegion>);
      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'true');
    });

    it('renders LiveRegion with assertive politeness', () => {
      render(<LiveRegion politeness="assertive">Critical update</LiveRegion>);
      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-live', 'assertive');
    });

    it('EmptyState has proper role and aria-label', () => {
      render(<EmptyState title="No data available" />);
      const state = screen.getByRole('status');
      expect(state).toHaveAttribute('aria-label', 'No data available');
    });

    it('ApiError has proper role for screen readers', () => {
      render(<ApiError message="Error occurred" />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('LoadingSpinner has accessible status role', () => {
      render(<LoadingSpinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('5.1.4 Micro-animations', () => {
    it('EmptyState uses fade-in animation', () => {
      const { container } = render(<EmptyState title="Test" />);
      expect(container.firstChild).toHaveClass('animate-fade-in');
    });

    it('ApiError uses fade-in animation', () => {
      const { container } = render(<ApiError message="Error" />);
      expect(container.firstChild).toHaveClass('animate-fade-in');
    });

    it('InlineError uses shake animation', () => {
      const { container } = render(<InlineError message="Error" />);
      expect(container.firstChild).toHaveClass('animate-shake');
    });
  });

  describe('5.1.1 Consistent Spacing (4px grid)', () => {
    it('LoadingSpinner sizes follow 4px grid', () => {
      const { rerender, container } = render(<LoadingSpinner size="xs" />);
      // size-3 = 0.75rem = 12px (3 * 4px)
      let icon = container.querySelector('svg');
      expect(icon).toHaveClass('size-3');

      rerender(<LoadingSpinner size="sm" />);
      icon = container.querySelector('svg');
      // size-4 = 1rem = 16px (4 * 4px)
      expect(icon).toHaveClass('size-4');

      rerender(<LoadingSpinner size="md" />);
      icon = container.querySelector('svg');
      // size-6 = 1.5rem = 24px (6 * 4px)
      expect(icon).toHaveClass('size-6');

      rerender(<LoadingSpinner size="lg" />);
      icon = container.querySelector('svg');
      // size-8 = 2rem = 32px (8 * 4px)
      expect(icon).toHaveClass('size-8');
    });
  });
});
