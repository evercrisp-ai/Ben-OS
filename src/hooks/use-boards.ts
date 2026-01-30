'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import { STALE_TIMES, GC_TIMES } from '@/lib/cache-config';
import type { Board, BoardInsert, BoardUpdate, ColumnConfig } from '@/types/database';

// Default column configuration for new boards
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'backlog', name: 'Backlog', position: 0 },
  { id: 'todo', name: 'To Do', position: 1 },
  { id: 'in_progress', name: 'In Progress', position: 2 },
  { id: 'review', name: 'Review', position: 3 },
  { id: 'done', name: 'Done', position: 4 },
];

// Query keys for cache management
export const boardKeys = {
  all: ['boards'] as const,
  lists: () => [...boardKeys.all, 'list'] as const,
  list: (filters?: { projectId?: string }) =>
    [...boardKeys.lists(), filters] as const,
  details: () => [...boardKeys.all, 'detail'] as const,
  detail: (id: string) => [...boardKeys.details(), id] as const,
};

/**
 * Fetch all boards, optionally filtered by project
 * 5.2.5 Caching: Board configurations are relatively stable
 */
export function useBoards(projectId?: string) {
  return useQuery({
    queryKey: boardKeys.list({ projectId }),
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }
      
      const supabase = getSupabaseClient();
      if (!supabase) return [];
      
      let query = supabase
        .from('boards')
        .select('*')
        .order('position', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Board[];
    },
    staleTime: STALE_TIMES.boards,
    gcTime: GC_TIMES.default,
  });
}

/**
 * Fetch a single board by ID
 */
export function useBoard(id: string) {
  return useQuery({
    queryKey: boardKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Board;
    },
    enabled: !!id,
  });
}

/**
 * Create a new board
 */
export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newBoard: BoardInsert) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Use default columns if not provided
      const boardData = {
        ...newBoard,
        column_config: newBoard.column_config || DEFAULT_COLUMNS,
      };

      const { data, error } = await supabase
        .from('boards')
        .insert(boardData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Board;
    },
    onMutate: async (newBoard) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.lists() });

      const previousBoards = queryClient.getQueryData<Board[]>(
        boardKeys.list({ projectId: newBoard.project_id })
      );

      if (previousBoards) {
        const optimisticBoard: Board = {
          id: `temp-${Date.now()}`,
          project_id: newBoard.project_id,
          name: newBoard.name,
          column_config: (newBoard.column_config || DEFAULT_COLUMNS) as ColumnConfig[],
          position: newBoard.position || previousBoards.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Board[]>(
          boardKeys.list({ projectId: newBoard.project_id }),
          [...previousBoards, optimisticBoard]
        );
      }

      return { previousBoards };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'boards',
        entityId: data.id,
        action: 'create',
        payload: { name: data.name, project_id: data.project_id },
      });

      toast.success('Board created successfully');
    },
    onError: (error, newBoard, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(
          boardKeys.list({ projectId: newBoard.project_id }),
          context.previousBoards
        );
      }
      toast.error(`Failed to create board: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

/**
 * Update an existing board
 */
export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BoardUpdate & { id: string }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Board;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.lists() });
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(id) });

      const previousBoard = queryClient.getQueryData<Board>(
        boardKeys.detail(id)
      );

      if (previousBoard) {
        queryClient.setQueryData<Board>(boardKeys.detail(id), {
          ...previousBoard,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousBoard };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'boards',
        entityId: data.id,
        action: 'update',
        payload: { name: data.name },
      });

      toast.success('Board updated successfully');
    },
    onError: (error, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          boardKeys.detail(variables.id),
          context.previousBoard
        );
      }
      toast.error(`Failed to update board: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.id) });
    },
  });
}

/**
 * Add a column to a board
 */
export function useAddColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      column,
    }: {
      boardId: string;
      column: Omit<ColumnConfig, 'position'>;
    }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // First, get the current board
      const { data: board, error: fetchError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const currentColumns = (board.column_config as ColumnConfig[]) || [];
      const newColumn: ColumnConfig = {
        ...column,
        position: currentColumns.length,
      };

      const { data, error } = await supabase
        .from('boards')
        .update({
          column_config: [...currentColumns, newColumn],
        })
        .eq('id', boardId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Board;
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'boards',
        entityId: data.id,
        action: 'update',
        payload: { action: 'add_column', column_config: data.column_config },
      });

      toast.success('Column added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add column: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

/**
 * Update a column in a board
 */
export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      columnId,
      updates,
    }: {
      boardId: string;
      columnId: string;
      updates: Partial<ColumnConfig>;
    }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      const { data: board, error: fetchError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const currentColumns = (board.column_config as ColumnConfig[]) || [];
      const updatedColumns = currentColumns.map((col) =>
        col.id === columnId ? { ...col, ...updates } : col
      );

      const { data, error } = await supabase
        .from('boards')
        .update({
          column_config: updatedColumns,
        })
        .eq('id', boardId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Board;
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'boards',
        entityId: data.id,
        action: 'update',
        payload: { action: 'update_column' },
      });

      toast.success('Column updated');
    },
    onError: (error) => {
      toast.error(`Failed to update column: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

/**
 * Delete a column from a board
 */
export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      columnId,
    }: {
      boardId: string;
      columnId: string;
    }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      const { data: board, error: fetchError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const currentColumns = (board.column_config as ColumnConfig[]) || [];
      const filteredColumns = currentColumns
        .filter((col) => col.id !== columnId)
        .map((col, index) => ({ ...col, position: index }));

      const { data, error } = await supabase
        .from('boards')
        .update({
          column_config: filteredColumns,
        })
        .eq('id', boardId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Board;
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'boards',
        entityId: data.id,
        action: 'update',
        payload: { action: 'delete_column' },
      });

      toast.success('Column deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete column: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

/**
 * Reorder columns in a board
 */
export function useReorderColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      columns,
    }: {
      boardId: string;
      columns: ColumnConfig[];
    }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');

      // Update positions
      const reorderedColumns = columns.map((col, index) => ({
        ...col,
        position: index,
      }));

      const { data, error } = await supabase
        .from('boards')
        .update({
          column_config: reorderedColumns,
        })
        .eq('id', boardId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Board;
    },
    onMutate: async ({ boardId, columns }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.detail(boardId) });

      const previousBoard = queryClient.getQueryData<Board>(
        boardKeys.detail(boardId)
      );

      if (previousBoard) {
        const reorderedColumns = columns.map((col, index) => ({
          ...col,
          position: index,
        }));

        queryClient.setQueryData<Board>(boardKeys.detail(boardId), {
          ...previousBoard,
          column_config: reorderedColumns,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousBoard };
    },
    onError: (error, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          boardKeys.detail(variables.boardId),
          context.previousBoard
        );
      }
      toast.error(`Failed to reorder columns: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
    },
  });
}

/**
 * Delete a board
 */
export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase.from('boards').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.lists() });

      const queries = queryClient.getQueriesData<Board[]>({
        queryKey: boardKeys.lists(),
      });

      const previousState = new Map<readonly unknown[], Board[] | undefined>();

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousState.set(queryKey, data);
          queryClient.setQueryData<Board[]>(
            queryKey,
            data.filter((board) => board.id !== id)
          );
        }
      });

      return { previousState };
    },
    onSuccess: async (id) => {
      await logActivity({
        entityType: 'boards',
        entityId: id,
        action: 'delete',
      });

      toast.success('Board deleted successfully');
    },
    onError: (error, _id, context) => {
      if (context?.previousState) {
        context.previousState.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to delete board: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}
