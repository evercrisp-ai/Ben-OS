"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Milestone, MilestoneInsert, MilestoneUpdate } from "@/types/database";

interface MilestoneFormProps {
  projectId: string;
  milestone?: Milestone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MilestoneInsert | (MilestoneUpdate & { id: string })) => Promise<void>;
}

export function MilestoneForm({
  projectId,
  milestone,
  open,
  onOpenChange,
  onSubmit,
}: MilestoneFormProps) {
  const [title, setTitle] = React.useState(milestone?.title || "");
  const [description, setDescription] = React.useState(
    milestone?.description || ""
  );
  const [targetDate, setTargetDate] = React.useState(
    milestone?.target_date || ""
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isEditing = !!milestone;

  // Reset form when milestone changes
  React.useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      setTargetDate(milestone.target_date || "");
    } else {
      setTitle("");
      setDescription("");
      setTargetDate("");
    }
  }, [milestone, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      if (isEditing && milestone) {
        await onSubmit({
          id: milestone.id,
          title: title.trim(),
          description: description.trim() || null,
          target_date: targetDate || null,
        });
      } else {
        await onSubmit({
          project_id: projectId,
          title: title.trim(),
          description: description.trim() || null,
          target_date: targetDate || null,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handled by the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Milestone" : "Create Milestone"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the milestone details."
                : "Add a new milestone to track progress on your project."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., MVP Launch"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this milestone represents..."
                rows={3}
              />
            </div>

            {/* Target Date */}
            <div className="space-y-2">
              <Label htmlFor="target-date">Target Date</Label>
              <Input
                id="target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                aria-label="Target Date"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
