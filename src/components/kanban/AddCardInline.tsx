"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddCardInlineProps {
  columnId: string;
  onAdd: (title: string, columnId: string) => void;
  className?: string;
}

export function AddCardInline({ columnId, onAdd, className }: AddCardInlineProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onAdd(trimmedTitle, columnId);
      setTitle("");
      // Keep adding mode open for multiple quick adds
      inputRef.current?.focus();
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("w-full justify-start text-muted-foreground", className)}
        onClick={() => setIsAdding(true)}
      >
        <Plus className="size-4 mr-1" />
        Add card
      </Button>
    );
  }

  return (
    <div className={cn("p-2", className)}>
      <textarea
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Card title"
        className={cn(
          "w-full min-h-[60px] p-2 text-sm rounded-md border resize-none",
          "bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
        )}
        rows={2}
      />
      <div className="flex items-center gap-2 mt-2">
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add card
        </Button>
        <Button 
          size="icon-sm" 
          variant="ghost" 
          onClick={handleCancel}
          aria-label="Cancel"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
