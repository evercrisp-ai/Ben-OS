"use client";

import * as React from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MilestoneCard } from "./MilestoneCard";
import { MilestoneForm } from "./MilestoneForm";
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from "@/hooks/use-milestones";
import { useTasks } from "@/hooks/use-tasks";
import type { Milestone, MilestoneStatus, MilestoneInsert, MilestoneUpdate } from "@/types/database";

interface MilestoneListProps {
  projectId: string;
  boardId?: string;
}

export function MilestoneList({ projectId, boardId }: MilestoneListProps) {
  const { data: milestones = [], isLoading } = useMilestones(projectId);
  const { data: tasks = [] } = useTasks(boardId ? { boardId } : undefined);
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingMilestone, setEditingMilestone] = React.useState<Milestone | null>(null);

  const handleSubmit = async (
    data: MilestoneInsert | (MilestoneUpdate & { id: string })
  ) => {
    if ("id" in data && data.id) {
      await updateMilestone.mutateAsync(data as MilestoneUpdate & { id: string });
    } else {
      await createMilestone.mutateAsync(data as MilestoneInsert);
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setIsFormOpen(true);
  };

  const handleDelete = async (milestone: Milestone) => {
    if (confirm(`Are you sure you want to delete "${milestone.title}"?`)) {
      await deleteMilestone.mutateAsync(milestone.id);
    }
  };

  const handleStatusChange = async (
    milestone: Milestone,
    status: MilestoneStatus
  ) => {
    await updateMilestone.mutateAsync({
      id: milestone.id,
      status,
    });
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingMilestone(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="milestone-list-loading">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-36 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="milestone-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Milestones</h2>
          <span className="text-sm text-muted-foreground">
            ({milestones.length})
          </span>
        </div>
        <Button size="sm" onClick={() => setIsFormOpen(true)} className="gap-1">
          <Plus className="size-4" />
          Add Milestone
        </Button>
      </div>

      {/* Milestones */}
      {milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg border-dashed">
          <Target className="size-12 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg mb-1">No milestones yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first milestone to track major checkpoints
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="size-4 mr-1" />
            Create Milestone
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              tasks={tasks}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <MilestoneForm
        projectId={projectId}
        milestone={editingMilestone}
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
