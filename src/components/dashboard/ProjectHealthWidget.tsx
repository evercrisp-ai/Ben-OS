"use client";

import * as React from "react";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Pause,
  AlertTriangle,
  TrendingUp,
  Archive,
} from "lucide-react";
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
import { useProjects, useTasks } from "@/hooks";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/database";

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  active: {
    label: "Active",
    icon: TrendingUp,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  paused: {
    label: "Paused",
    icon: Pause,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  archived: {
    label: "Archived",
    icon: Archive,
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
};

type HealthStatus = "on_track" | "at_risk" | "behind";

const healthConfig: Record<
  HealthStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  on_track: {
    label: "On Track",
    color: "text-green-500",
    icon: CheckCircle2,
  },
  at_risk: {
    label: "At Risk",
    color: "text-yellow-500",
    icon: Clock,
  },
  behind: {
    label: "Behind",
    color: "text-red-500",
    icon: AlertTriangle,
  },
};

interface ProjectHealthWidgetProps {
  className?: string;
}

export function ProjectHealthWidget({ className }: ProjectHealthWidgetProps) {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: allTasks, isLoading: tasksLoading } = useTasks();

  const isLoading = projectsLoading || tasksLoading;

  // Calculate project health metrics
  const projectHealth = React.useMemo(() => {
    if (!projects || !allTasks) return [];

    // We need to get board IDs for each project to filter tasks
    // For simplicity, we'll calculate based on all tasks and their associations
    // In a real app, we might want to fetch boards with projects
    
    return projects
      .filter((p) => p.status === "active" || p.status === "paused")
      .map((project) => {
        // This is a simplified calculation - in a real app we'd filter by project's boards
        // For now, we'll use all non-completed tasks and show general progress
        // In a full implementation, we would join through boards to get project-specific tasks
        const projectTasks = allTasks;

        const total = projectTasks.length;
        const completed = projectTasks.filter((t) => t.status === "done").length;
        const inProgress = projectTasks.filter(
          (t) => t.status === "in_progress"
        ).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Determine health based on various factors
        const overdueTasks = projectTasks.filter(
          (t) =>
            t.due_date &&
            new Date(t.due_date) < new Date() &&
            t.status !== "done"
        );

        let health: HealthStatus = "on_track";
        if (overdueTasks.length > 3 || (total > 5 && progress < 20)) {
          health = "behind";
        } else if (overdueTasks.length > 0 || project.status === "paused") {
          health = "at_risk";
        }

        return {
          ...project,
          progress,
          total,
          completed,
          inProgress,
          overdue: overdueTasks.length,
          health,
        };
      })
      .slice(0, 5); // Show top 5 projects
  }, [projects, allTasks]);

  // Calculate summary stats
  const summary = React.useMemo(() => {
    if (!projects) {
      return { active: 0, paused: 0, completed: 0, onTrack: 0 };
    }

    return {
      active: projects.filter((p) => p.status === "active").length,
      paused: projects.filter((p) => p.status === "paused").length,
      completed: projects.filter((p) => p.status === "completed").length,
      onTrack: projectHealth.filter((p) => p.health === "on_track").length,
    };
  }, [projects, projectHealth]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
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
          <FolderKanban className="size-5 text-primary" />
          Project Health
        </CardTitle>
        <CardDescription>Overview of all project statuses</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {summary.active}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-100/50 dark:bg-green-900/20">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {summary.onTrack}
            </p>
            <p className="text-xs text-muted-foreground">On Track</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-100/50 dark:bg-yellow-900/20">
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {summary.paused}
            </p>
            <p className="text-xs text-muted-foreground">Paused</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-slate-100/50 dark:bg-slate-800/50">
            <p className="text-lg font-bold text-slate-600 dark:text-slate-400">
              {summary.completed}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Project List */}
        {projectHealth.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderKanban className="size-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No active projects</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a project to get started
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {projectHealth.map((project) => {
                const status = statusConfig[project.status];
                const health = healthConfig[project.health];
                const StatusIcon = status.icon;
                const HealthIcon = health.icon;

                return (
                  <div
                    key={project.id}
                    data-testid={`project-health-${project.id}`}
                    className="p-3 rounded-lg border"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {project.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs",
                              status.bgColor,
                              status.color
                            )}
                          >
                            <StatusIcon className="size-3 mr-1" />
                            {status.label}
                          </Badge>
                          <div
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              health.color
                            )}
                          >
                            <HealthIcon className="size-3" />
                            <span>{health.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold">{project.progress}%</p>
                        <p className="text-xs text-muted-foreground">
                          {project.completed}/{project.total} tasks
                        </p>
                      </div>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
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
