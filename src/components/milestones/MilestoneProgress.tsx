"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Milestone, Task } from "@/types/database";

interface MilestoneProgressProps {
  milestone: Milestone;
  tasks: Task[];
  showLabel?: boolean;
  className?: string;
}

export function MilestoneProgress({
  milestone,
  tasks,
  showLabel = true,
  className,
}: MilestoneProgressProps) {
  const linkedTasks = tasks.filter((task) => task.milestone_id === milestone.id);
  const completedTasks = linkedTasks.filter(
    (task) => task.status === "done"
  );

  const totalTasks = linkedTasks.length;
  const completedCount = completedTasks.length;
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Progress
        value={percentage}
        className="flex-1 h-2"
        data-testid="milestone-progress-bar"
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground whitespace-nowrap" data-testid="milestone-progress-label">
          {percentage}%
        </span>
      )}
    </div>
  );
}

// Compute progress for a milestone (can be used standalone)
export function computeMilestoneProgress(
  milestone: Milestone,
  tasks: Task[]
): { total: number; completed: number; percentage: number } {
  const linkedTasks = tasks.filter((task) => task.milestone_id === milestone.id);
  const completedTasks = linkedTasks.filter((task) => task.status === "done");

  const total = linkedTasks.length;
  const completed = completedTasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}
