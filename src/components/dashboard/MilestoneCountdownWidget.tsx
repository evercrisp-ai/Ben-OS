"use client";

import * as React from "react";
import {
  differenceInDays,
  differenceInHours,
  format,
  isPast,
  isToday,
  isTomorrow,
} from "date-fns";
import { Target, Calendar, Clock, AlertTriangle, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMilestones, useTasks } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types/database";

interface MilestoneWithProgress extends Milestone {
  daysUntil: number;
  hoursUntil: number;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
}

interface MilestoneCountdownWidgetProps {
  className?: string;
  maxMilestones?: number;
}

export function MilestoneCountdownWidget({
  className,
  maxMilestones = 5,
}: MilestoneCountdownWidgetProps) {
  const { data: milestones, isLoading: milestonesLoading } = useMilestones();
  const { data: allTasks, isLoading: tasksLoading } = useTasks();

  const isLoading = milestonesLoading || tasksLoading;

  // Calculate milestone data with countdown and progress
  const upcomingMilestones = React.useMemo(() => {
    if (!milestones || !allTasks) return [];

    const now = new Date();

    return milestones
      .filter((m) => m.status !== "completed" && m.target_date)
      .map((milestone): MilestoneWithProgress => {
        const targetDate = new Date(milestone.target_date!);
        const daysUntil = differenceInDays(targetDate, now);
        const hoursUntil = differenceInHours(targetDate, now);

        // Calculate progress based on linked tasks
        const milestoneTasks = allTasks.filter(
          (t) => t.milestone_id === milestone.id
        );
        const totalTasks = milestoneTasks.length;
        const completedTasks = milestoneTasks.filter(
          (t) => t.status === "done"
        ).length;
        const progress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...milestone,
          daysUntil,
          hoursUntil,
          progress,
          totalTasks,
          completedTasks,
          isOverdue: isPast(targetDate) && !isToday(targetDate),
          isToday: isToday(targetDate),
          isTomorrow: isTomorrow(targetDate),
        };
      })
      .sort((a, b) => {
        // Sort by target date (earliest first)
        return (
          new Date(a.target_date!).getTime() -
          new Date(b.target_date!).getTime()
        );
      })
      .slice(0, maxMilestones);
  }, [milestones, allTasks, maxMilestones]);

  const formatCountdown = (milestone: MilestoneWithProgress): string => {
    if (milestone.isOverdue) {
      const daysAgo = Math.abs(milestone.daysUntil);
      return daysAgo === 1 ? "1 day overdue" : `${daysAgo} days overdue`;
    }
    if (milestone.isToday) {
      return "Due today";
    }
    if (milestone.isTomorrow) {
      return "Due tomorrow";
    }
    if (milestone.daysUntil < 1) {
      return `${milestone.hoursUntil} hours left`;
    }
    return `${milestone.daysUntil} days left`;
  };

  const getUrgencyColor = (
    milestone: MilestoneWithProgress
  ): { text: string; bg: string } => {
    if (milestone.isOverdue) {
      return {
        text: "text-red-500",
        bg: "bg-red-100 dark:bg-red-900/30",
      };
    }
    if (milestone.isToday || milestone.daysUntil <= 1) {
      return {
        text: "text-orange-500",
        bg: "bg-orange-100 dark:bg-orange-900/30",
      };
    }
    if (milestone.daysUntil <= 3) {
      return {
        text: "text-yellow-500",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
      };
    }
    if (milestone.daysUntil <= 7) {
      return {
        text: "text-blue-500",
        bg: "bg-blue-100 dark:bg-blue-900/30",
      };
    }
    return {
      text: "text-slate-500",
      bg: "bg-slate-100 dark:bg-slate-800",
    };
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          Milestone Countdown
        </CardTitle>
        <CardDescription>Upcoming milestones with due dates</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingMilestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Check className="size-12 text-green-500 mb-3" />
            <p className="text-sm font-medium">No upcoming milestones</p>
            <p className="text-xs text-muted-foreground mt-1">
              All milestones are completed or have no due date
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-4">
              {upcomingMilestones.map((milestone, index) => {
                const urgency = getUrgencyColor(milestone);

                return (
                  <div
                    key={milestone.id}
                    data-testid={`milestone-countdown-${index}`}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      milestone.isOverdue && "border-red-200 dark:border-red-900"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{milestone.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="size-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(milestone.target_date!),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant="secondary"
                        className={cn("shrink-0", urgency.bg, urgency.text)}
                      >
                        {milestone.isOverdue && (
                          <AlertTriangle className="size-3 mr-1" />
                        )}
                        {!milestone.isOverdue && milestone.daysUntil <= 1 && (
                          <Clock className="size-3 mr-1" />
                        )}
                        {formatCountdown(milestone)}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Progress
                        </span>
                        <span
                          className={cn(
                            "font-medium",
                            milestone.progress === 100
                              ? "text-green-500"
                              : milestone.progress >= 50
                              ? "text-blue-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {milestone.completedTasks}/{milestone.totalTasks}{" "}
                          tasks ({milestone.progress}%)
                        </span>
                      </div>
                      <Progress
                        value={milestone.progress}
                        className={cn(
                          "h-1.5",
                          milestone.progress === 100 && "[&>div]:bg-green-500"
                        )}
                      />
                    </div>

                    {/* Status indicator */}
                    {milestone.status === "in_progress" && (
                      <div className="flex items-center gap-1 mt-2">
                        <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">
                          In Progress
                        </span>
                      </div>
                    )}
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
