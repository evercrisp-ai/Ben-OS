"use client";

import * as React from "react";
import {
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MilestoneProgress } from "./MilestoneProgress";
import { cn } from "@/lib/utils";
import type { Milestone, MilestoneStatus, Task } from "@/types/database";

const statusConfig: Record<
  MilestoneStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-slate-500",
    bgColor: "bg-slate-100 dark:bg-slate-800",
  },
  in_progress: {
    label: "In Progress",
    icon: Play,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
};

interface MilestoneCardProps {
  milestone: Milestone;
  tasks: Task[];
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
  onStatusChange?: (milestone: Milestone, status: MilestoneStatus) => void;
  className?: string;
}

export function MilestoneCard({
  milestone,
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  className,
}: MilestoneCardProps) {
  const config = statusConfig[milestone.status];
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No target date";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue =
    milestone.target_date &&
    milestone.status !== "completed" &&
    new Date(milestone.target_date) < new Date();

  const getNextStatus = (): MilestoneStatus | null => {
    if (milestone.status === "pending") return "in_progress";
    if (milestone.status === "in_progress") return "completed";
    return null;
  };

  const getStatusActionLabel = (): string | null => {
    const nextStatus = getNextStatus();
    if (nextStatus === "in_progress") return "Start";
    if (nextStatus === "completed") return "Complete";
    return null;
  };

  const handleStatusAdvance = () => {
    const nextStatus = getNextStatus();
    if (nextStatus && onStatusChange) {
      onStatusChange(milestone, nextStatus);
    }
  };

  return (
    <Card
      className={cn("relative group", className)}
      data-testid={`milestone-${milestone.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Target className="size-5 text-primary shrink-0" />
            <CardTitle className="text-base font-semibold truncate">
              {milestone.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="secondary"
              className={cn("gap-1", config.bgColor, config.color)}
            >
              <StatusIcon className="size-3" />
              {config.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Milestone menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(milestone)}>
                    <Pencil className="size-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {getStatusActionLabel() && onStatusChange && (
                  <DropdownMenuItem onClick={handleStatusAdvance}>
                    <StatusIcon className="size-4 mr-2" />
                    {getStatusActionLabel()}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(milestone)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {milestone.description && (
          <CardDescription className="line-clamp-2 mt-1">
            {milestone.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        {/* Progress */}
        <MilestoneProgress milestone={milestone} tasks={tasks} />

        {/* Target Date */}
        <div className="flex items-center justify-between text-sm">
          <div
            className={cn(
              "flex items-center gap-1.5",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}
          >
            <Calendar className="size-4" />
            <span>{formatDate(milestone.target_date)}</span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs h-5">
                Overdue
              </Badge>
            )}
          </div>

          {/* Status action button */}
          {getStatusActionLabel() && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatusAdvance}
              className="h-7"
            >
              {getStatusActionLabel()}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
