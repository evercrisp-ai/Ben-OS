"use client";

import { useParams, useRouter } from "next/navigation";
import { Board } from "@/components/kanban/Board";
import { useBoard, useUpdateBoard, useAddColumn, useUpdateColumn, useDeleteColumn } from "@/hooks/use-boards";
import { useBoardTasks, useCreateTask, useUpdateTask, useDeleteTask, useLinkTaskToPRD } from "@/hooks/use-tasks";
import { usePRDs } from "@/hooks/use-prds";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Task, ColumnConfig } from "@/types/database";

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const { data: board, isLoading: boardLoading, error: boardError } = useBoard(boardId);
  const { data: tasks, isLoading: tasksLoading } = useBoardTasks(boardId);
  
  // Fetch PRDs for the project this board belongs to
  const { data: prds } = usePRDs(board?.project_id);

  const updateBoard = useUpdateBoard();
  const linkTaskToPRD = useLinkTaskToPRD();
  const addColumn = useAddColumn();
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleCardCreate = async (card: Partial<Task>): Promise<Task> => {
    const result = await createTask.mutateAsync({
      board_id: boardId,
      title: card.title || "New Task",
      column_id: card.column_id || "backlog",
      position: card.position || 0,
      status: (card.column_id || "backlog") as Task["status"],
      priority: card.priority || "medium",
      description: card.description,
      milestone_id: card.milestone_id,
      prd_id: card.prd_id,
    });
    return result;
  };

  const handleCardUpdate = async (cardId: string, updates: Partial<Task>): Promise<void> => {
    await updateTask.mutateAsync({ id: cardId, ...updates });
  };

  const handleCardDelete = async (cardId: string): Promise<void> => {
    await deleteTask.mutateAsync(cardId);
  };

  const handleColumnCreate = async (column: ColumnConfig): Promise<void> => {
    await addColumn.mutateAsync({ boardId, column: { id: column.id, name: column.name } });
  };

  const handleColumnUpdate = async (columnId: string, updates: Partial<ColumnConfig>): Promise<void> => {
    await updateColumn.mutateAsync({ boardId, columnId, updates });
  };

  const handleColumnDelete = async (columnId: string): Promise<void> => {
    await deleteColumn.mutateAsync({ boardId, columnId });
  };

  const handleBoardUpdate = (updates: { tasks?: Partial<Task>[]; columns?: ColumnConfig[] }) => {
    if (updates.columns) {
      updateBoard.mutate({ id: boardId, column_config: updates.columns });
    }
  };

  const handleLinkToPRD = async (cardId: string, prdId: string | null): Promise<void> => {
    await linkTaskToPRD.mutateAsync({ taskId: cardId, prdId });
  };

  if (boardLoading || tasksLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (boardError || !board) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Board not found</h1>
        <p className="text-muted-foreground">
          The board you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button onClick={() => router.push("/boards")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Boards
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Board
        board={board}
        tasks={tasks || []}
        prds={prds || []}
        onUpdate={handleBoardUpdate}
        onCardCreate={handleCardCreate}
        onCardUpdate={handleCardUpdate}
        onCardDelete={handleCardDelete}
        onColumnCreate={handleColumnCreate}
        onColumnUpdate={handleColumnUpdate}
        onColumnDelete={handleColumnDelete}
        onLinkToPRD={handleLinkToPRD}
      />
    </div>
  );
}
