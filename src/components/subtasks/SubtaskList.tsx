"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubtaskItem } from "./SubtaskItem";
import { AddSubtaskInline } from "./AddSubtaskInline";
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useToggleSubtask,
  useBulkUpdateSubtasks,
} from "@/hooks/use-subtasks";

interface SubtaskListProps {
  taskId: string;
}

export function SubtaskList({ taskId }: SubtaskListProps) {
  const { data: subtasks = [], isLoading, error } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const toggleSubtask = useToggleSubtask();
  const bulkUpdateSubtasks = useBulkUpdateSubtasks();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddSubtask = async (title: string) => {
    await createSubtask.mutateAsync({
      task_id: taskId,
      title,
      position: subtasks.length,
    });
  };

  const handleToggle = async (id: string, _completed: boolean) => {
    // Note: completed parameter is unused - toggle reads fresh state from cache
    await toggleSubtask.mutateAsync({ id, taskId });
  };

  const handleUpdate = async (id: string, title: string) => {
    await updateSubtask.mutateAsync({ id, taskId, title });
  };

  const handleDelete = async (id: string) => {
    await deleteSubtask.mutateAsync({ id, taskId });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subtasks.findIndex((s) => s.id === active.id);
      const newIndex = subtasks.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(subtasks, oldIndex, newIndex);
        
        // Update positions in database
        const updates = reordered.map((subtask, index) => ({
          id: subtask.id,
          position: index,
        }));

        await bulkUpdateSubtasks.mutateAsync({ taskId, updates });
      }
    }
  };

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive py-2">
        Failed to load subtasks
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="subtasks-section">
      {/* Header with progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="size-4 text-muted-foreground" />
            <span>Subtasks</span>
            {totalCount > 0 && (
              <span className="text-muted-foreground">
                ({completedCount}/{totalCount})
              </span>
            )}
          </div>
          {totalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div
            className="h-1.5 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                progressPercentage === 100 ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Subtask list with drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={subtasks.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add subtask */}
      <AddSubtaskInline
        onAdd={handleAddSubtask}
        isLoading={createSubtask.isPending}
      />
    </div>
  );
}
