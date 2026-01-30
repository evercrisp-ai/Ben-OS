"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Column, ColumnDragOverlay } from "@/components/kanban/Column";
import type { CardData } from "@/stores/board-store";
import { CardDragOverlay } from "@/components/kanban/Card";
import { BoardHeader } from "@/components/kanban/BoardHeader";
import { CardDetailPanel } from "@/components/kanban/CardDetailPanel";
import { AddColumnInline } from "@/components/kanban/AddColumnInline";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useBoardStore } from "@/stores/board-store";
import type { Board as BoardType, Task, ColumnConfig, Agent, Milestone } from "@/types/database";

interface BoardProps {
  board: BoardType;
  tasks: Task[];
  agents?: Agent[];
  milestones?: Milestone[];
  prds?: import("@/types/database").PRD[];
  onUpdate?: (updates: { tasks?: Partial<Task>[]; columns?: ColumnConfig[] }) => void;
  onCardCreate?: (card: Partial<Task>) => Promise<Task>;
  onCardUpdate?: (cardId: string, updates: Partial<Task>) => Promise<void>;
  onCardDelete?: (cardId: string) => Promise<void>;
  onColumnCreate?: (column: ColumnConfig) => Promise<void>;
  onColumnUpdate?: (columnId: string, updates: Partial<ColumnConfig>) => Promise<void>;
  onColumnDelete?: (columnId: string) => Promise<void>;
  onLinkToPRD?: (cardId: string, prdId: string | null) => Promise<void>;
}

export function Board({
  board,
  tasks,
  agents = [],
  milestones = [],
  prds = [],
  onUpdate,
  onCardCreate,
  onCardUpdate,
  onCardDelete,
  onColumnCreate,
  onColumnUpdate,
  onColumnDelete,
  onLinkToPRD,
}: BoardProps) {
  const {
    setBoard,
    setTasks,
    getFilteredColumns,
    moveCard,
    moveColumn,
    addCard,
    updateCard,
    removeCard,
    addColumn,
    updateColumn: updateColumnStore,
    removeColumn,
    isAddingColumn,
    setIsAddingColumn,
    focusedCardId,
    setFocusedCard,
  } = useBoardStore();

  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = React.useState<"card" | "column" | null>(null);

  // Initialize board store
  React.useEffect(() => {
    setBoard(board);
  }, [board, setBoard]);

  React.useEffect(() => {
    setTasks(tasks);
  }, [tasks, setTasks]);

  const columns = getFilteredColumns();
  const columnIds = React.useMemo(
    () => columns.map((c) => `column-${c.id}`),
    [columns]
  );

  // DnD sensors with keyboard support
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

  // Find active card or column for overlay
  const getActiveData = () => {
    if (!activeId) return null;

    if (activeType === "card") {
      for (const column of columns) {
        const card = column.cards.find((c) => c.id === activeId);
        if (card) return { type: "card" as const, card };
      }
    } else if (activeType === "column") {
      const columnId = String(activeId).replace("column-", "");
      const column = columns.find((c) => c.id === columnId);
      if (column) return { type: "column" as const, column, cards: column.cards };
    }

    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === "card") {
      setActiveId(active.id);
      setActiveType("card");
    } else if (data?.type === "column") {
      setActiveId(active.id);
      setActiveType("column");
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle card dragging over columns
    if (activeData?.type !== "card") return;

    const activeCard = activeData.task as CardData;
    let targetColumnId: string | null = null;

    if (overData?.type === "column") {
      targetColumnId = overData.column.id;
    } else if (overData?.type === "card") {
      // Get the column of the card we're over
      for (const col of columns) {
        if (col.cards.some((c) => c.id === over.id)) {
          targetColumnId = col.id;
          break;
        }
      }
    }

    if (targetColumnId && activeCard.column_id !== targetColumnId) {
      // Move card to new column optimistically
      const targetColumn = columns.find((c) => c.id === targetColumnId);
      const newPosition = targetColumn?.cards.length || 0;
      moveCard(activeCard.id, activeCard.column_id, targetColumnId, newPosition);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "column" && overData?.type === "column") {
      // Column reordering
      const activeColumnId = String(active.id).replace("column-", "");
      const overColumnId = String(over.id).replace("column-", "");

      if (activeColumnId !== overColumnId) {
        const activeIndex = columns.findIndex((c) => c.id === activeColumnId);
        const overIndex = columns.findIndex((c) => c.id === overColumnId);

        if (activeIndex !== -1 && overIndex !== -1) {
          moveColumn(activeColumnId, overIndex);

          // Notify parent of column order change
          onUpdate?.({
            columns: columns.map((c, i) => ({
              id: c.id,
              name: c.name,
              position: i,
            })),
          });
        }
      }
    } else if (activeData?.type === "card") {
      // Card moved - sync with backend
      const card = activeData.task as CardData;
      onCardUpdate?.(card.id, {
        column_id: card.column_id,
        position: card.position,
        status: card.column_id as Task["status"],
      });
    }
  };

  // Handle keyboard navigation for cards
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedCardId) return;

      const currentColumn = columns.find((c) =>
        c.cards.some((card) => card.id === focusedCardId)
      );
      if (!currentColumn) return;

      const cardIndex = currentColumn.cards.findIndex(
        (c) => c.id === focusedCardId
      );
      if (cardIndex === -1) return;

      const columnIndex = columns.findIndex((c) => c.id === currentColumn.id);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          if (cardIndex > 0) {
            setFocusedCard(currentColumn.cards[cardIndex - 1].id);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (cardIndex < currentColumn.cards.length - 1) {
            setFocusedCard(currentColumn.cards[cardIndex + 1].id);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (columnIndex > 0 && e.shiftKey) {
            // Move card to previous column
            const prevColumn = columns[columnIndex - 1];
            moveCard(
              focusedCardId,
              currentColumn.id,
              prevColumn.id,
              prevColumn.cards.length
            );
            onCardUpdate?.(focusedCardId, {
              column_id: prevColumn.id,
              status: prevColumn.id as Task["status"],
            });
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (columnIndex < columns.length - 1 && e.shiftKey) {
            // Move card to next column
            const nextColumn = columns[columnIndex + 1];
            moveCard(
              focusedCardId,
              currentColumn.id,
              nextColumn.id,
              nextColumn.cards.length
            );
            onCardUpdate?.(focusedCardId, {
              column_id: nextColumn.id,
              status: nextColumn.id as Task["status"],
            });
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedCardId, columns, moveCard, setFocusedCard, onCardUpdate]);

  const handleAddCard = async (title: string, columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    const newPosition = column?.cards.length || 0;

    if (onCardCreate) {
      const newCard = await onCardCreate({
        title,
        board_id: board.id,
        column_id: columnId,
        position: newPosition,
        status: columnId as Task["status"],
        priority: "medium",
      });
      addCard(newCard);
    } else {
      // Optimistic local add for testing/demo
      const optimisticCard: Task = {
        id: crypto.randomUUID(),
        title,
        board_id: board.id,
        column_id: columnId,
        position: newPosition,
        status: columnId as Task["status"],
        priority: "medium",
        description: null,
        milestone_id: null,
        prd_id: null,
        assigned_agent_id: null,
        story_points: null,
        ai_context: {},
        due_date: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addCard(optimisticCard);
    }
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<CardData>) => {
    updateCard(cardId, updates);
    onCardUpdate?.(cardId, updates);
  };

  const handleDeleteCard = async (cardId: string) => {
    removeCard(cardId);
    onCardDelete?.(cardId);
  };

  const handleAddColumn = async (name: string) => {
    const newPosition = columns.length;
    const newColumn: ColumnConfig = {
      id: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      position: newPosition,
    };

    addColumn(newColumn);
    onColumnCreate?.(newColumn);
    setIsAddingColumn(false);
  };

  const handleUpdateColumn = async (columnId: string, name: string) => {
    updateColumnStore(columnId, { name });
    onColumnUpdate?.(columnId, { name });
  };

  const handleDeleteColumn = async (columnId: string) => {
    removeColumn(columnId);
    onColumnDelete?.(columnId);
  };

  const activeData = getActiveData();

  return (
    <div className="flex flex-col h-full" data-testid="board">
      <BoardHeader
        board={board}
        agents={agents}
        milestones={milestones}
        onAddColumn={() => setIsAddingColumn(true)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1">
          <div className="flex gap-4 p-4" data-testid="column-container">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={column.cards}
                  onAddCard={handleAddCard}
                  onDeleteColumn={handleDeleteColumn}
                  onUpdateColumn={handleUpdateColumn}
                />
              ))}
            </SortableContext>

            {/* Add Column */}
            <AddColumnInline
              isAdding={isAddingColumn}
              onAdd={handleAddColumn}
              onCancel={() => setIsAddingColumn(false)}
            />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeData?.type === "card" && (
            <CardDragOverlay task={activeData.card} />
          )}
          {activeData?.type === "column" && (
            <ColumnDragOverlay
              column={activeData.column}
              cards={activeData.cards}
            />
          )}
        </DragOverlay>
      </DndContext>

      <CardDetailPanel
        onUpdate={handleUpdateCard}
        onDelete={handleDeleteCard}
        milestones={milestones}
        prds={prds}
        onLinkToPRD={onLinkToPRD}
      />
    </div>
  );
}
