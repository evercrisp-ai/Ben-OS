"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Calendar,
  CheckCircle2,
  GripVertical,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useBoardStore, type CardData } from "@/stores/board-store";
import type { TaskPriority } from "@/types/database";

interface CardProps {
  task: CardData;
  isDragOverlay?: boolean;
}

const priorityConfig: Record<TaskPriority, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  critical: { icon: AlertCircle, color: "text-red-500", label: "Critical" },
  high: { icon: ArrowUp, color: "text-orange-500", label: "High" },
  medium: { icon: Minus, color: "text-yellow-500", label: "Medium" },
  low: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
};

export function Card({ task, isDragOverlay = false }: CardProps) {
  const { selectCard, focusedCardId, setFocusedCard } = useBoardStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "card",
      task,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityInfo = priorityConfig[task.priority];
  const PriorityIcon = priorityInfo.icon;
  
  const subtaskProgress = task.subtaskCount && task.subtaskCount > 0
    ? `${task.subtaskCompleted || 0}/${task.subtaskCount}`
    : null;
  
  const subtaskPercentage = task.subtaskCount && task.subtaskCount > 0
    ? ((task.subtaskCompleted || 0) / task.subtaskCount) * 100
    : 0;

  const isFocused = focusedCardId === task.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectCard(task.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectCard(task.id);
    }
  };

  const handleFocus = () => {
    setFocusedCard(task.id);
  };

  const handleBlur = () => {
    setFocusedCard(null);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`card-${task.id}`}
      data-priority={task.priority}
      data-card-id={task.id}
      className={cn(
        "group relative bg-background border rounded-lg p-3 shadow-sm cursor-pointer",
        "hover:border-primary/50 hover:shadow-md",
        "transition-interactive",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "animate-fade-in",
        isDragging && "shadow-lg border-primary opacity-50",
        isDragOverlay && "shadow-xl rotate-2 scale-105",
        isFocused && "ring-2 ring-primary ring-offset-2"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}. Priority: ${priorityInfo.label}${task.due_date ? `. Due: ${new Date(task.due_date).toLocaleDateString()}` : ""}${subtaskProgress ? `. Subtasks: ${subtaskProgress} complete` : ""}`}
      aria-describedby={task.description ? `card-desc-${task.id}` : undefined}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm leading-tight pr-6">{task.title}</h4>

      {/* Description Preview */}
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Metadata Row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Priority Badge */}
        <Badge 
          variant="secondary" 
          className={cn("h-5 text-xs gap-1", priorityInfo.color)}
        >
          <PriorityIcon className="size-3" />
          <span className="sr-only">{priorityInfo.label}</span>
        </Badge>

        {/* Story Points */}
        {task.story_points && (
          <Badge variant="outline" className="h-5 text-xs">
            {task.story_points} pts
          </Badge>
        )}

        {/* Due Date */}
        {task.due_date && (
          <Badge 
            variant="outline" 
            className={cn(
              "h-5 text-xs gap-1",
              new Date(task.due_date) < new Date() && "text-red-500 border-red-200"
            )}
          >
            <Calendar className="size-3" />
            {new Date(task.due_date).toLocaleDateString("en-US", { 
              month: "short", 
              day: "numeric" 
            })}
          </Badge>
        )}

        {/* Assignee */}
        {task.assigned_agent_id && (
          <Badge variant="outline" className="h-5 text-xs gap-1">
            <User className="size-3" />
          </Badge>
        )}
      </div>

      {/* Subtask Progress */}
      {subtaskProgress && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              <span>{subtaskProgress}</span>
            </div>
            <span>{Math.round(subtaskPercentage)}%</span>
          </div>
          <div 
            className="h-1 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={subtaskPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${subtaskPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function CardDragOverlay({ task }: { task: CardData }) {
  return <Card task={task} isDragOverlay />;
}
