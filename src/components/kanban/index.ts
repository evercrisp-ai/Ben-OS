// Kanban Board Components
export { Board } from "./Board";
export { Column, ColumnDragOverlay } from "./Column";
export { Card, CardDragOverlay } from "./Card";
export { ColumnHeader } from "./ColumnHeader";
export { BoardHeader } from "./BoardHeader";
export { CardDetailPanel, TaskDetailPanel } from "./CardDetailPanel";
export { AddCardInline } from "./AddCardInline";
export { AddColumnInline } from "./AddColumnInline";

// Re-export types
export type { CardData, ColumnWithCards, BoardFilters } from "@/stores/board-store";
