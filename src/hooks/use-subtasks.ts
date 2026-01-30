'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import type { Subtask, SubtaskInsert, SubtaskUpdate } from '@/types/database';

// Query keys for cache management
export const subtaskKeys = {
  all: ['subtasks'] as const,
  lists: () => [...subtaskKeys.all, 'list'] as const,
  list: (filters?: { taskId?: string }) =>
    [...subtaskKeys.lists(), filters] as const,
  details: () => [...subtaskKeys.all, 'detail'] as const,
  detail: (id: string) => [...subtaskKeys.details(), id] as const,
};

/**
 * Fetch all subtasks for a task
 */
export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: subtaskKeys.list({ taskId }),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Subtask[];
    },
    enabled: !!taskId,
  });
}

/**
 * Fetch a single subtask by ID
 */
export function useSubtask(id: string) {
  return useQuery({
    queryKey: subtaskKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Subtask;
    },
    enabled: !!id,
  });
}

/**
 * Create a new subtask
 */
export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSubtask: SubtaskInsert) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('subtasks')
        .insert(newSubtask)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Subtask;
    },
    onMutate: async (newSubtask) => {
      await queryClient.cancelQueries({
        queryKey: subtaskKeys.list({ taskId: newSubtask.task_id }),
      });

      const previousSubtasks = queryClient.getQueryData<Subtask[]>(
        subtaskKeys.list({ taskId: newSubtask.task_id })
      );

      if (previousSubtasks) {
        const optimisticSubtask: Subtask = {
          id: `temp-${Date.now()}`,
          task_id: newSubtask.task_id,
          title: newSubtask.title,
          completed: newSubtask.completed || false,
          completed_at: null,
          position: newSubtask.position || previousSubtasks.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Subtask[]>(
          subtaskKeys.list({ taskId: newSubtask.task_id }),
          [...previousSubtasks, optimisticSubtask]
        );
      }

      return { previousSubtasks };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'subtasks',
        entityId: data.id,
        action: 'create',
        payload: { title: data.title, task_id: data.task_id },
      });

      toast.success('Subtask created');
    },
    onError: (error, newSubtask, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          subtaskKeys.list({ taskId: newSubtask.task_id }),
          context.previousSubtasks
        );
      }
      toast.error(`Failed to create subtask: ${error.message}`);
    },
    onSettled: (_data, _error, newSubtask) => {
      queryClient.invalidateQueries({
        queryKey: subtaskKeys.list({ taskId: newSubtask.task_id }),
      });
    },
  });
}

/**
 * Update an existing subtask
 */
export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
      ...updates
    }: SubtaskUpdate & { id: string; taskId: string }) => {
      const supabase = getSupabaseClient();

      // If completing the subtask, set completed_at
      if (updates.completed === true && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      } else if (updates.completed === false) {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from('subtasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Subtask;
    },
    onMutate: async ({ id, taskId, ...updates }) => {
      await queryClient.cancelQueries({
        queryKey: subtaskKeys.list({ taskId }),
      });

      const previousSubtasks = queryClient.getQueryData<Subtask[]>(
        subtaskKeys.list({ taskId })
      );

      if (previousSubtasks) {
        queryClient.setQueryData<Subtask[]>(
          subtaskKeys.list({ taskId }),
          previousSubtasks.map((subtask) =>
            subtask.id === id
              ? {
                  ...subtask,
                  ...updates,
                  completed_at:
                    updates.completed === true
                      ? new Date().toISOString()
                      : updates.completed === false
                        ? null
                        : subtask.completed_at,
                  updated_at: new Date().toISOString(),
                }
              : subtask
          )
        );
      }

      return { previousSubtasks };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'subtasks',
        entityId: data.id,
        action: 'update',
        payload: { title: data.title, completed: data.completed },
      });

      // Don't show toast for every checkbox toggle
    },
    onError: (error, variables, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          subtaskKeys.list({ taskId: variables.taskId }),
          context.previousSubtasks
        );
      }
      toast.error(`Failed to update subtask: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskKeys.list({ taskId: variables.taskId }),
      });
    },
  });
}

/**
 * Toggle subtask completion (convenience wrapper)
 */
export function useToggleSubtask() {
  const updateSubtask = useUpdateSubtask();

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
      completed,
    }: {
      id: string;
      taskId: string;
      completed: boolean;
    }) => {
      return updateSubtask.mutateAsync({
        id,
        taskId,
        completed: !completed,
      });
    },
  });
}

/**
 * Delete a subtask
 */
export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('subtasks').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, taskId };
    },
    onMutate: async ({ id, taskId }) => {
      await queryClient.cancelQueries({
        queryKey: subtaskKeys.list({ taskId }),
      });

      const previousSubtasks = queryClient.getQueryData<Subtask[]>(
        subtaskKeys.list({ taskId })
      );

      if (previousSubtasks) {
        queryClient.setQueryData<Subtask[]>(
          subtaskKeys.list({ taskId }),
          previousSubtasks.filter((subtask) => subtask.id !== id)
        );
      }

      return { previousSubtasks };
    },
    onSuccess: async ({ id }) => {
      await logActivity({
        entityType: 'subtasks',
        entityId: id,
        action: 'delete',
      });

      toast.success('Subtask deleted');
    },
    onError: (error, variables, context) => {
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          subtaskKeys.list({ taskId: variables.taskId }),
          context.previousSubtasks
        );
      }
      toast.error(`Failed to delete subtask: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskKeys.list({ taskId: variables.taskId }),
      });
    },
  });
}

/**
 * Bulk update subtasks (useful for reordering)
 */
export function useBulkUpdateSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Array<{ id: string } & SubtaskUpdate>;
    }) => {
      const supabase = getSupabaseClient();

      const results = await Promise.all(
        updates.map(({ id, ...subtaskUpdates }) =>
          supabase
            .from('subtasks')
            .update(subtaskUpdates)
            .eq('id', id)
            .select()
            .single()
        )
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(
          `Failed to update ${errors.length} subtasks: ${errors[0].error?.message}`
        );
      }

      return { taskId, subtasks: results.map((r) => r.data as Subtask) };
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskKeys.list({ taskId: variables.taskId }),
      });
    },
  });
}
