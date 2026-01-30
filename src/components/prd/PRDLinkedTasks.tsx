'use client';

import * as React from 'react';
import { ExternalLink, CheckCircle2, Circle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { usePRDTasks } from '@/hooks/use-tasks';
import type { Task, TaskStatus } from '@/types/database';

interface PRDLinkedTasksProps {
  prdId: string;
  onTaskClick?: (task: Task) => void;
}

const statusConfig: Record<TaskStatus, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  backlog: { icon: Circle, color: 'text-muted-foreground', label: 'Backlog' },
  todo: { icon: Circle, color: 'text-blue-500', label: 'To Do' },
  in_progress: { icon: Clock, color: 'text-yellow-500', label: 'In Progress' },
  review: { icon: Clock, color: 'text-orange-500', label: 'Review' },
  done: { icon: CheckCircle2, color: 'text-green-500', label: 'Done' },
};

export function PRDLinkedTasks({ prdId, onTaskClick }: PRDLinkedTasksProps) {
  const { data: tasks, isLoading } = usePRDTasks(prdId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" data-testid="linked-tasks-loading">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="linked-tasks-empty">
        <p className="text-sm">No tasks linked to this PRD yet.</p>
        <p className="text-xs mt-1">Generate tasks from requirements or link existing tasks.</p>
      </div>
    );
  }

  return (
    <div data-testid="linked-tasks">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Linked Tasks ({tasks.length})</h4>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {tasks.map((task) => {
            const config = statusConfig[task.status];
            const StatusIcon = config.icon;

            return (
              <div
                key={task.id}
                data-testid={`linked-task-${task.id}`}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  'hover:bg-muted/50 transition-colors cursor-pointer'
                )}
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <StatusIcon className={cn('size-4 flex-shrink-0', config.color)} />
                  <span className="text-sm truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {config.label}
                  </Badge>
                  {onTaskClick && (
                    <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100">
                      <ExternalLink className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
