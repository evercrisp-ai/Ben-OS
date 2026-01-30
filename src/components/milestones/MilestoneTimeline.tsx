"use client";

import * as React from "react";
import { Calendar, CheckCircle2, Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMilestones } from "@/hooks/use-milestones";
import { useTasks } from "@/hooks/use-tasks";
import { computeMilestoneProgress } from "./MilestoneProgress";
import type { Milestone, MilestoneStatus } from "@/types/database";

const statusConfig: Record<
  MilestoneStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  pending: {
    icon: Clock,
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    borderColor: "border-slate-300 dark:border-slate-600",
  },
  in_progress: {
    icon: Play,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    borderColor: "border-blue-400 dark:border-blue-600",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900",
    borderColor: "border-green-400 dark:border-green-600",
  },
};

interface MilestoneTimelineProps {
  projectId: string;
  boardId?: string;
  className?: string;
}

export function MilestoneTimeline({
  projectId,
  boardId,
  className,
}: MilestoneTimelineProps) {
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const { data: tasks = [] } = useTasks(boardId ? { boardId } : undefined);

  // Sort milestones by target date
  const sortedMilestones = React.useMemo(() => {
    return [...milestones].sort((a, b) => {
      // Milestones without dates go to the end
      if (!a.target_date && !b.target_date) return a.position - b.position;
      if (!a.target_date) return 1;
      if (!b.target_date) return -1;
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    });
  }, [milestones]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No date";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (milestone: Milestone) => {
    if (!milestone.target_date || milestone.status === "completed") return false;
    return new Date(milestone.target_date) < new Date();
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)} data-testid="timeline-loading">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-3 h-full bg-muted animate-pulse rounded-full" />
            <div className="flex-1 h-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12 text-center",
          className
        )}
        data-testid="timeline"
      >
        <Calendar className="size-12 text-muted-foreground mb-4" />
        <h3 className="font-medium text-lg mb-1">No milestones to display</h3>
        <p className="text-sm text-muted-foreground">
          Create milestones to see them on the timeline
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} data-testid="timeline">
      {/* Timeline header */}
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Milestone Timeline</h2>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {sortedMilestones.map((milestone, index) => {
            const config = statusConfig[milestone.status];
            const StatusIcon = config.icon;
            const progress = computeMilestoneProgress(milestone, tasks);
            const overdue = isOverdue(milestone);

            return (
              <div
                key={milestone.id}
                className="relative flex gap-4"
                data-testid={`timeline-milestone-${milestone.id}`}
              >
                {/* Node */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2",
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <StatusIcon className={cn("size-3", config.color)} />
                </div>

                {/* Content */}
                <div
                  className={cn(
                    "flex-1 -mt-0.5 pb-6",
                    index === sortedMilestones.length - 1 && "pb-0"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{milestone.title}</h3>
                      {overdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {progress.percentage}% complete
                    </Badge>
                  </div>

                  <div
                    className={cn(
                      "text-sm mb-2",
                      overdue ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(milestone.target_date)}
                    </span>
                  </div>

                  {milestone.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {milestone.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          milestone.status === "completed"
                            ? "bg-green-500"
                            : "bg-primary"
                        )}
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {progress.completed}/{progress.total} tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
