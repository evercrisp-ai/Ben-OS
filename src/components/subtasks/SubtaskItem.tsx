"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Subtask } from "@/types/database";

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, title: string) => void;
}

export function SubtaskItem({
  subtask,
  onToggle,
  onDelete,
  onUpdate,
}: SubtaskItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(subtask.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: subtask.id,
    data: {
      type: "subtask",
      subtask,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = () => {
    onToggle(subtask.id, subtask.completed);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(subtask.id);
  };

  const handleDoubleClick = () => {
    if (onUpdate) {
      setIsEditing(true);
      setEditTitle(subtask.title);
    }
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && editTitle !== subtask.title && onUpdate) {
      onUpdate(subtask.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditTitle(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid={`subtask-${subtask.id}`}
      className={cn(
        "group flex items-center gap-2 py-2 px-2 rounded-md",
        "hover:bg-muted/50 transition-colors",
        isDragging && "shadow-md bg-background border"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={handleToggle}
        className={cn(
          "size-4 rounded border-muted-foreground/50 cursor-pointer",
          "focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
        aria-label={`Mark "${subtask.title}" as ${subtask.completed ? "incomplete" : "complete"}`}
      />

      {/* Title */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 px-2 py-1 text-sm rounded border",
            "bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          )}
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          className={cn(
            "flex-1 text-sm cursor-default",
            subtask.completed && "line-through text-muted-foreground"
          )}
        >
          {subtask.title}
        </span>
      )}

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
        aria-label={`Delete subtask "${subtask.title}"`}
      >
        <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}
