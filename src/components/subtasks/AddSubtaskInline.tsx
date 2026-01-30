"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddSubtaskInlineProps {
  onAdd: (title: string) => void;
  isLoading?: boolean;
}

export function AddSubtaskInline({ onAdd, isLoading = false }: AddSubtaskInlineProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
      // Keep the input focused for adding more
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setTitle("");
      setIsAdding(false);
    }
  };

  const handleBlur = () => {
    if (!title.trim()) {
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className={cn(
          "flex items-center gap-2 w-full py-2 px-2 rounded-md",
          "text-sm text-muted-foreground hover:text-foreground",
          "hover:bg-muted/50 transition-colors"
        )}
        disabled={isLoading}
      >
        <Plus className="size-4" />
        <span>Add subtask</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 py-2 px-2">
      <Plus className="size-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Add subtask"
        disabled={isLoading}
        className={cn(
          "flex-1 px-2 py-1 text-sm rounded border",
          "bg-background placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary"
        )}
      />
    </form>
  );
}
