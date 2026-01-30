"use client";

import * as React from "react";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks, useUpdateTask } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Task, TaskPriority } from "@/types/database";

const priorityConfig: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string; weight: number }
> = {
  critical: {
    label: "Critical",
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    weight: 4,
  },
  high: {
    label: "High",
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    weight: 3,
  },
  medium: {
    label: "Medium",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    weight: 2,
  },
  low: {
    label: "Low",
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    weight: 1,
  },
};

interface TodayFocusWidgetProps {
  className?: string;
  maxTasks?: number;
}

export function TodayFocusWidget({
  className,
  maxTasks = 5,
}: TodayFocusWidgetProps) {
  const { data: allTasks, isLoading, error } = useTasks();
  const updateTask = useUpdateTask();

  // Filter and sort tasks for today's focus
  const focusTasks = React.useMemo(() => {
    if (!allTasks) return [];

    const today = startOfDay(new Date());

    // Filter: tasks that are due today, overdue, or high priority in progress
    const relevantTasks = allTasks.filter((task) => {
      // Skip completed tasks
      if (task.status === "done") return false;

      // Include tasks due today
      if (task.due_date && isToday(new Date(task.due_date))) return true;

      // Include overdue tasks
      if (task.due_date && isBefore(new Date(task.due_date), today))
        return true;

      // Include high/critical priority tasks that are in progress
      if (
        (task.priority === "critical" || task.priority === "high") &&
        task.status === "in_progress"
      )
        return true;

      // Include critical tasks regardless of status
      if (task.priority === "critical") return true;

      return false;
    });

    // Sort by priority (descending) then by due date
    return relevantTasks
      .sort((a, b) => {
        // Priority first
        const priorityDiff =
          priorityConfig[b.priority].weight -
          priorityConfig[a.priority].weight;
        if (priorityDiff !== 0) return priorityDiff;

        // Then by due date (earliest first)
        if (a.due_date && b.due_date) {
          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;

        return 0;
      })
      .slice(0, maxTasks);
  }, [allTasks, maxTasks]);

  const handleMarkComplete = async (task: Task) => {
    await updateTask.mutateAsync({
      id: task.id,
      status: "done",
      column_id: "done",
    });
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date) return false;
    return isBefore(new Date(task.due_date), startOfDay(new Date()));
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Today&apos;s Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load tasks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          Today&apos;s Focus
        </CardTitle>
        <CardDescription>
          Priority tasks that need your attention today
        </CardDescription>
      </CardHeader>
      <CardContent>
        {focusTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="size-12 text-green-500 mb-3" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No priority tasks for today
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {focusTasks.map((task, index) => {
                const priority = priorityConfig[task.priority];
                const overdue = isOverdue(task);

                return (
                  <div
                    key={task.id}
                    data-testid={`focus-task-${index}`}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      "hover:bg-accent/50",
                      overdue && "border-destructive/50 bg-destructive/5"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="mt-0.5 shrink-0"
                      onClick={() => handleMarkComplete(task)}
                      disabled={updateTask.isPending}
                    >
                      <CheckCircle2 className="size-4 text-muted-foreground hover:text-green-500" />
                      <span className="sr-only">Mark complete</span>
                    </Button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {task.title}
                      </p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            priority.bgColor,
                            priority.color
                          )}
                        >
                          {priority.label}
                        </Badge>

                        {task.due_date && (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              overdue
                                ? "text-destructive"
                                : "text-muted-foreground"
                            )}
                          >
                            {overdue ? (
                              <AlertTriangle className="size-3" />
                            ) : (
                              <Calendar className="size-3" />
                            )}
                            <span>
                              {overdue
                                ? "Overdue"
                                : format(new Date(task.due_date), "MMM d")}
                            </span>
                          </div>
                        )}

                        {task.status === "in_progress" && (
                          <div className="flex items-center gap-1 text-xs text-blue-500">
                            <Clock className="size-3" />
                            <span>In Progress</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
