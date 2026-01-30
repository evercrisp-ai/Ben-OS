'use client';

import * as React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePRDTasks } from '@/hooks/use-tasks';
import type { Task } from '@/types/database';

interface PRDProgressProps {
  prdId: string;
  showDetails?: boolean;
  className?: string;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  percentage: number;
}

function calculateStats(tasks: Task[]): TaskStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'review').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, inProgress, percentage };
}

export function PRDProgress({ prdId, showDetails = false, className }: PRDProgressProps) {
  const { data: tasks = [] } = usePRDTasks(prdId);
  const stats = calculateStats(tasks);

  if (tasks.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <AlertCircle className="size-4" />
        <span className="text-sm">No linked tasks</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} data-testid="prd-progress">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-default">
                {stats.percentage === 100 ? (
                  <CheckCircle2 className="size-4 text-green-500" />
                ) : stats.percentage > 0 ? (
                  <Circle className="size-4 text-blue-500" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium" data-testid="prd-progress-percentage">
                  {stats.percentage}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {stats.completed} of {stats.total} tasks completed
            </TooltipContent>
          </Tooltip>
        </div>

        {showDetails && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {stats.completed}/{stats.total} done
            </Badge>
            {stats.inProgress > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stats.inProgress} in progress
              </Badge>
            )}
          </div>
        )}
      </div>

      <Progress value={stats.percentage} className="h-2" />
    </div>
  );
}

/**
 * Standalone component to show just the percentage badge
 * Useful for inline display in lists
 */
export function PRDProgressBadge({ prdId }: { prdId: string }) {
  const { data: tasks = [] } = usePRDTasks(prdId);
  const stats = calculateStats(tasks);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Badge
      variant={stats.percentage === 100 ? 'default' : 'secondary'}
      className="text-xs"
      data-testid="prd-progress-badge"
    >
      {stats.percentage}%
    </Badge>
  );
}
