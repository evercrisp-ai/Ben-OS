'use client';

import * as React from 'react';
import { LucideIcon, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: {
    container: 'py-6',
    icon: 'size-8',
    title: 'text-sm font-medium',
    description: 'text-xs',
  },
  md: {
    container: 'py-10',
    icon: 'size-12',
    title: 'text-base font-medium',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'size-16',
    title: 'text-lg font-semibold',
    description: 'text-base',
  },
};

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const config = sizeConfig[size];
  const ActionIcon = action?.icon ?? Plus;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center animate-fade-in',
        config.container,
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className={cn('text-muted-foreground', config.icon)} aria-hidden="true" />
      </div>

      <h3 className={cn('text-foreground', config.title)}>{title}</h3>

      {description && (
        <p className={cn('text-muted-foreground mt-1 max-w-sm', config.description)}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-4">
          {action && (
            <Button
              onClick={action.onClick}
              size={size === 'sm' ? 'sm' : 'default'}
              className="gap-2"
            >
              <ActionIcon className="size-4" aria-hidden="true" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function NoProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      title="No projects yet"
      description="Create your first project to start organizing your work"
      action={{
        label: 'Create Project',
        onClick: onCreate,
      }}
    />
  );
}

export function NoTasksEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      title="No tasks yet"
      description="Add tasks to start tracking your work"
      action={{
        label: 'Add Task',
        onClick: onCreate,
      }}
    />
  );
}

export function NoPRDsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      title="No PRDs yet"
      description="Create a Product Requirements Document to define your project scope"
      action={{
        label: 'Create PRD',
        onClick: onCreate,
      }}
    />
  );
}

export function NoSearchResultsEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      title="No results found"
      description={`No items match "${query}". Try adjusting your search.`}
      action={{
        label: 'Clear Search',
        onClick: onClear,
      }}
    />
  );
}

export function NoActivityEmptyState() {
  return (
    <EmptyState
      title="No recent activity"
      description="Start working on tasks to see your activity here"
      size="sm"
    />
  );
}
