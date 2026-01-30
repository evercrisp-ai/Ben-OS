"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  Link,
  Unlink,
  RotateCcw,
  FileText,
  CheckSquare,
  FolderKanban,
  Target,
  Bot,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivityLogs } from "@/hooks";
import { cn } from "@/lib/utils";
import type { ActivityLog } from "@/types/database";

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  link_to_prd: Link,
  unlink_from_prd: Unlink,
  restore: RotateCcw,
  create_from_prd: FileText,
};

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  tasks: CheckSquare,
  projects: FolderKanban,
  milestones: Target,
  prds: FileText,
  agents: Bot,
};

const actionColors: Record<string, string> = {
  create: "text-green-500 bg-green-100 dark:bg-green-900/30",
  update: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  delete: "text-red-500 bg-red-100 dark:bg-red-900/30",
  link_to_prd: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  unlink_from_prd: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  restore: "text-teal-500 bg-teal-100 dark:bg-teal-900/30",
  create_from_prd: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
};

function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    create: "created",
    update: "updated",
    delete: "deleted",
    restore: "restored",
    link_to_prd: "linked to PRD",
    unlink_from_prd: "unlinked from PRD",
    create_from_prd: "created from PRD",
  };
  return actionMap[action] || action;
}

function formatEntityType(entityType: string): string {
  const entityMap: Record<string, string> = {
    tasks: "task",
    projects: "project",
    milestones: "milestone",
    prds: "PRD",
    agents: "agent",
    boards: "board",
    areas: "area",
  };
  return entityMap[entityType] || entityType;
}

function getActivityTitle(log: ActivityLog): string {
  const payload = log.payload as Record<string, unknown>;
  const title = payload?.title || payload?.name;
  
  if (title && typeof title === "string") {
    return title.length > 40 ? `${title.slice(0, 40)}...` : title;
  }
  
  return formatEntityType(log.entity_type);
}

interface ActivityFeedWidgetProps {
  className?: string;
  limit?: number;
}

export function ActivityFeedWidget({
  className,
  limit = 10,
}: ActivityFeedWidgetProps) {
  const { data: activities, isLoading, error } = useRecentActivityLogs(limit);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
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
            <Activity className="size-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest actions across your projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="size-12 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start working to see your activity here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const ActionIcon = actionIcons[activity.action] || Pencil;
                  const EntityIcon =
                    entityIcons[activity.entity_type] || FileText;
                  const colorClass =
                    actionColors[activity.action] ||
                    "text-slate-500 bg-slate-100 dark:bg-slate-800";

                  return (
                    <div
                      key={activity.id}
                      data-testid={`activity-${index}`}
                      className="flex gap-3 relative"
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                          colorClass
                        )}
                      >
                        <ActionIcon className="size-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium capitalize">
                                {formatAction(activity.action)}
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {formatEntityType(activity.entity_type)}
                              </span>{" "}
                              <span className="font-medium">
                                &quot;{getActivityTitle(activity)}&quot;
                              </span>
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <EntityIcon className="size-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(activity.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                              {activity.user_initiated === false && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Bot className="size-3" />
                                  Agent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
