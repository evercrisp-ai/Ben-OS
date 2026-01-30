import { create } from "zustand";
import type { Task, Board, ColumnConfig, TaskPriority } from "@/types/database";

// Filter options for the board
export interface BoardFilters {
  priority: TaskPriority[];
  assignee: string[];
  milestone: string[];
  search: string;
}

// Card with computed properties for display
export interface CardData extends Task {
  subtaskCount?: number;
  subtaskCompleted?: number;
}

// Column with cards
export interface ColumnWithCards extends ColumnConfig {
  cards: CardData[];
}

interface BoardState {
  // Current board data
  board: Board | null;
  columns: ColumnWithCards[];
  tasks: Task[];
  
  // UI State
  filters: BoardFilters;
  selectedCardId: string | null;
  focusedCardId: string | null;
  isAddingColumn: boolean;
  editingColumnId: string | null;
  
  // Actions
  setBoard: (board: Board) => void;
  setTasks: (tasks: Task[]) => void;
  setFilters: (filters: Partial<BoardFilters>) => void;
  clearFilters: () => void;
  selectCard: (cardId: string | null) => void;
  setFocusedCard: (cardId: string | null) => void;
  setIsAddingColumn: (isAdding: boolean) => void;
  setEditingColumnId: (columnId: string | null) => void;
  
  // Card operations (optimistic updates)
  moveCard: (cardId: string, sourceColumnId: string, targetColumnId: string, newPosition: number) => void;
  addCard: (card: Task) => void;
  updateCard: (cardId: string, updates: Partial<Task>) => void;
  removeCard: (cardId: string) => void;
  
  // Column operations
  moveColumn: (columnId: string, newPosition: number) => void;
  addColumn: (column: ColumnConfig) => void;
  updateColumn: (columnId: string, updates: Partial<ColumnConfig>) => void;
  removeColumn: (columnId: string) => void;
  
  // Computed
  getFilteredColumns: () => ColumnWithCards[];
  getCardById: (cardId: string) => CardData | undefined;
}

const defaultFilters: BoardFilters = {
  priority: [],
  assignee: [],
  milestone: [],
  search: "",
};

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  columns: [],
  tasks: [],
  filters: defaultFilters,
  selectedCardId: null,
  focusedCardId: null,
  isAddingColumn: false,
  editingColumnId: null,

  setBoard: (board) => {
    const columnConfig = board.column_config as ColumnConfig[];
    const columns: ColumnWithCards[] = columnConfig
      .sort((a, b) => a.position - b.position)
      .map((col) => ({
        ...col,
        cards: [],
      }));
    set({ board, columns });
  },

  setTasks: (tasks) => {
    set((state) => {
      const columns = state.columns.map((col) => ({
        ...col,
        cards: tasks
          .filter((task) => task.column_id === col.id)
          .sort((a, b) => a.position - b.position) as CardData[],
      }));
      return { tasks, columns };
    });
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  clearFilters: () => {
    set({ filters: defaultFilters });
  },

  selectCard: (cardId) => {
    set({ selectedCardId: cardId });
  },

  setFocusedCard: (cardId) => {
    set({ focusedCardId: cardId });
  },

  setIsAddingColumn: (isAdding) => {
    set({ isAddingColumn: isAdding });
  },

  setEditingColumnId: (columnId) => {
    set({ editingColumnId: columnId });
  },

  moveCard: (cardId, sourceColumnId, targetColumnId, newPosition) => {
    set((state) => {
      // Find the card in source column
      const sourceColumn = state.columns.find((c) => c.id === sourceColumnId);
      const targetColumn = state.columns.find((c) => c.id === targetColumnId);
      
      if (!sourceColumn || !targetColumn) return state;
      
      const cardIndex = sourceColumn.cards.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return state;
      
      const card = { ...sourceColumn.cards[cardIndex] };
      card.column_id = targetColumnId;
      card.position = newPosition;
      
      // Create new columns array
      const newColumns = state.columns.map((col) => {
        if (col.id === sourceColumnId) {
          // Remove card from source
          const newCards = col.cards.filter((c) => c.id !== cardId);
          // Update positions
          return {
            ...col,
            cards: newCards.map((c, i) => ({ ...c, position: i })),
          };
        }
        if (col.id === targetColumnId) {
          // Add card to target at position
          const newCards = [...col.cards];
          if (sourceColumnId === targetColumnId) {
            // Moving within same column - remove first
            const removeIndex = newCards.findIndex((c) => c.id === cardId);
            if (removeIndex !== -1) {
              newCards.splice(removeIndex, 1);
            }
          }
          newCards.splice(newPosition, 0, card as CardData);
          // Update positions
          return {
            ...col,
            cards: newCards.map((c, i) => ({ ...c, position: i })),
          };
        }
        return col;
      });
      
      // Update tasks array
      const newTasks = state.tasks.map((t) => 
        t.id === cardId ? { ...t, column_id: targetColumnId, position: newPosition } : t
      );
      
      return { columns: newColumns, tasks: newTasks };
    });
  },

  addCard: (card) => {
    set((state) => {
      const newTasks = [...state.tasks, card];
      const newColumns = state.columns.map((col) => {
        if (col.id === card.column_id) {
          return {
            ...col,
            cards: [...col.cards, card as CardData],
          };
        }
        return col;
      });
      return { tasks: newTasks, columns: newColumns };
    });
  },

  updateCard: (cardId, updates) => {
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === cardId ? { ...t, ...updates } : t
      );
      
      const newColumns = state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, ...updates } : c
        ),
      }));
      
      return { tasks: newTasks, columns: newColumns };
    });
  },

  removeCard: (cardId) => {
    set((state) => {
      const newTasks = state.tasks.filter((t) => t.id !== cardId);
      
      const newColumns = state.columns.map((col) => {
        const filteredCards = col.cards.filter((c) => c.id !== cardId);
        return {
          ...col,
          cards: filteredCards.map((c, i) => ({ ...c, position: i })),
        };
      });
      
      return { tasks: newTasks, columns: newColumns };
    });
  },

  moveColumn: (columnId, newPosition) => {
    set((state) => {
      const columnIndex = state.columns.findIndex((c) => c.id === columnId);
      if (columnIndex === -1) return state;
      
      const newColumns = [...state.columns];
      const [column] = newColumns.splice(columnIndex, 1);
      newColumns.splice(newPosition, 0, column);
      
      // Update all positions
      const updatedColumns = newColumns.map((c, i) => ({
        ...c,
        position: i,
      }));
      
      // Update board column_config
      const newBoard = state.board ? {
        ...state.board,
        column_config: updatedColumns.map((c) => ({
          id: c.id,
          name: c.name,
          position: c.position,
        })),
      } : null;
      
      return { columns: updatedColumns, board: newBoard };
    });
  },

  addColumn: (column) => {
    set((state) => {
      const newColumn: ColumnWithCards = {
        ...column,
        cards: [],
      };
      const newColumns = [...state.columns, newColumn];
      
      // Update board column_config
      const newBoard = state.board ? {
        ...state.board,
        column_config: newColumns.map((c) => ({
          id: c.id,
          name: c.name,
          position: c.position,
        })),
      } : null;
      
      return { columns: newColumns, board: newBoard };
    });
  },

  updateColumn: (columnId, updates) => {
    set((state) => {
      const newColumns = state.columns.map((c) =>
        c.id === columnId ? { ...c, ...updates } : c
      );
      
      // Update board column_config
      const newBoard = state.board ? {
        ...state.board,
        column_config: newColumns.map((c) => ({
          id: c.id,
          name: c.name,
          position: c.position,
        })),
      } : null;
      
      return { columns: newColumns, board: newBoard };
    });
  },

  removeColumn: (columnId) => {
    set((state) => {
      const newColumns = state.columns
        .filter((c) => c.id !== columnId)
        .map((c, i) => ({ ...c, position: i }));
      
      // Update board column_config
      const newBoard = state.board ? {
        ...state.board,
        column_config: newColumns.map((c) => ({
          id: c.id,
          name: c.name,
          position: c.position,
        })),
      } : null;
      
      // Remove tasks from deleted column
      const newTasks = state.tasks.filter((t) => t.column_id !== columnId);
      
      return { columns: newColumns, board: newBoard, tasks: newTasks };
    });
  },

  getFilteredColumns: () => {
    const state = get();
    const { filters, columns } = state;
    
    return columns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => {
        // Priority filter
        if (filters.priority.length > 0 && !filters.priority.includes(card.priority)) {
          return false;
        }
        
        // Assignee filter
        if (
          filters.assignee.length > 0 &&
          (!card.assigned_agent_id || !filters.assignee.includes(card.assigned_agent_id))
        ) {
          return false;
        }
        
        // Milestone filter
        if (
          filters.milestone.length > 0 &&
          (!card.milestone_id || !filters.milestone.includes(card.milestone_id))
        ) {
          return false;
        }
        
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesTitle = card.title.toLowerCase().includes(searchLower);
          const matchesDescription = card.description?.toLowerCase().includes(searchLower) || false;
          if (!matchesTitle && !matchesDescription) {
            return false;
          }
        }
        
        return true;
      }),
    }));
  },

  getCardById: (cardId) => {
    const state = get();
    for (const column of state.columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return undefined;
  },
}));
