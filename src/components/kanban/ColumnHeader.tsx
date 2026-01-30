"use client";

import * as React from "react";
import { GripVertical, MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/stores/board-store";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

interface ColumnHeaderProps {
  id: string;
  name: string;
  cardCount: number;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  onDelete: (columnId: string) => void;
  onUpdate: (columnId: string, name: string) => void;
}

export function ColumnHeader({
  id,
  name,
  cardCount,
  dragAttributes,
  dragListeners,
  onDelete,
  onUpdate,
}: ColumnHeaderProps) {
  const { editingColumnId, setEditingColumnId } = useBoardStore();
  const [editName, setEditName] = React.useState(name);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const isEditing = editingColumnId === id;

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditName(name);
    setEditingColumnId(id);
  };

  const handleSave = () => {
    const trimmedName = editName.trim();
    if (trimmedName && trimmedName !== name) {
      onUpdate(id, trimmedName);
    }
    setEditingColumnId(null);
  };

  const handleCancel = () => {
    setEditName(name);
    setEditingColumnId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-2 py-2">
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            "flex-1 h-7 px-2 text-sm font-semibold rounded border",
            "bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          )}
          placeholder="Column name"
        />
        <Button 
          size="icon-xs" 
          variant="ghost" 
          onClick={handleSave}
          aria-label="Save"
        >
          <Check className="size-3" />
        </Button>
        <Button 
          size="icon-xs" 
          variant="ghost" 
          onClick={handleCancel}
          aria-label="Cancel"
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 py-2">
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button
          {...dragAttributes}
          {...dragListeners}
          className={cn(
            "cursor-grab active:cursor-grabbing p-0.5 rounded",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary"
          )}
          aria-label="Drag to reorder column"
        >
          <GripVertical className="size-4" />
        </button>
        
        {/* Column Title */}
        <h3 className="font-semibold text-sm">{name}</h3>
        
        {/* Card Count */}
        <Badge variant="secondary" className="h-5 text-xs">
          {cardCount}
        </Badge>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="icon-xs" 
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Column options"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleStartEdit}>
            <Pencil className="size-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onDelete(id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
