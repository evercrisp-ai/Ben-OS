"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Card } from "@/components/kanban/Card";
import type { CardData } from "@/stores/board-store";
import { ColumnHeader } from "@/components/kanban/ColumnHeader";
import { AddCardInline } from "@/components/kanban/AddCardInline";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ColumnConfig } from "@/types/database";

interface ColumnProps {
  column: ColumnConfig;
  cards: CardData[];
  onAddCard: (title: string, columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (columnId: string, name: string) => void;
}

export function Column({
  column,
  cards,
  onAddCard,
  onDeleteColumn,
  onUpdateColumn,
}: ColumnProps) {
  // Make the column itself sortable for column reordering
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
    },
  });

  // Make the card list a droppable zone
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cardIds = React.useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div
      ref={setSortableRef}
      style={style}
      data-testid={`column-${column.id}`}
      className={cn(
        "group flex flex-col w-[280px] min-w-[280px] bg-muted/50 rounded-lg",
        "transition-all duration-200",
        isColumnDragging && "opacity-50",
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <ColumnHeader
        id={column.id}
        name={column.name}
        cardCount={cards.length}
        dragAttributes={sortableAttributes}
        dragListeners={sortableListeners}
        onDelete={onDeleteColumn}
        onUpdate={onUpdateColumn}
      />

      {/* Add Card - at top */}
      <div className="border-b px-2 py-1">
        <AddCardInline columnId={column.id} onAdd={onAddCard} />
      </div>

      {/* Cards Container */}
      <div ref={setDroppableRef} className="flex-1 min-h-[100px]">
        <ScrollArea className="h-[calc(100vh-260px)]">
          <SortableContext 
            items={cardIds} 
            strategy={verticalListSortingStrategy}
          >
            <div 
              className="flex flex-col gap-2 p-2"
              data-testid="card-list"
            >
              {cards.map((card) => (
                <Card key={card.id} task={card} />
              ))}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
}

// Drag overlay variant for column
export function ColumnDragOverlay({ column, cards }: { column: ColumnConfig; cards: CardData[] }) {
  return (
    <div
      className={cn(
        "flex flex-col w-[280px] min-w-[280px] bg-muted/50 rounded-lg",
        "shadow-xl rotate-2 opacity-90"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="font-semibold text-sm">{column.name}</h3>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>
      <div className="p-2 space-y-2 max-h-[200px] overflow-hidden">
        {cards.slice(0, 3).map((card) => (
          <div 
            key={card.id} 
            className="bg-background border rounded-lg p-2 text-xs"
          >
            {card.title}
          </div>
        ))}
        {cards.length > 3 && (
          <div className="text-xs text-muted-foreground text-center">
            +{cards.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
