"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddColumnInlineProps {
  isAdding: boolean;
  onAdd: (name: string) => void;
  onCancel: () => void;
}

export function AddColumnInline({ isAdding, onAdd, onCancel }: AddColumnInlineProps) {
  const [name, setName] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onAdd(trimmedName);
      setName("");
    }
  };

  const handleCancel = () => {
    setName("");
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        className={cn(
          "h-auto min-w-[280px] py-3 justify-start border-dashed",
          "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onCancel()} // This triggers setIsAddingColumn(true) in Board
      >
        <Plus className="size-4 mr-2" />
        Add column
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "w-[280px] min-w-[280px] bg-muted/50 rounded-lg p-3"
      )}
    >
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Column name"
        className={cn(
          "w-full h-9 px-3 text-sm font-medium rounded-md border",
          "bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        )}
      />
      <div className="flex items-center gap-2 mt-2">
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
          Create
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
