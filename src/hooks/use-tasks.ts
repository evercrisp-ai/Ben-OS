'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import { STALE_TIMES, GC_TIMES } from '@/lib/cache-config';
import type { Task, TaskInsert, TaskUpdate } from '@/types/database';

// Mock data for demo mode
const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Update API documentation', description: 'Document all endpoints', board_id: '1', column_id: 'done', status: 'done', priority: 'medium', position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), points: 3, milestone_id: null, prd_id: null, due_date: null, agent_id: null },
  { id: '2', title: 'Fix login redirect bug', description: 'Users getting redirected incorrectly', board_id: '1', column_id: 'in_progress', status: 'in_progress', priority: 'high', position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), points: 2, milestone_id: null, prd_id: null, due_date: null, agent_id: null },
  { id: '3', title: 'Design new dashboard widgets', description: 'Create mockups', board_id: '1', column_id: 'todo', status: 'todo', priority: 'medium', position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), points: 5, milestone_id: null, prd_id: null, due_date: null, agent_id: null },
  { id: '4', title: 'Review PR #142', description: 'Code review for auth changes', board_id: '1', column_id: 'in_progress', status: 'in_progress', priority: 'high', position: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), points: 1, milestone_id: null, prd_id: null, due_date: null, agent_id: null },
  { id: '5', title: 'Write unit tests for auth', description: 'Increase test coverage', board_id: '1', column_id: 'todo', status: 'todo', priority: 'low', position: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), points: 3, milestone_id: null, prd_id: null, due_date: null, agent_id: null },
];

// Query keys for cache management
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: { boardId?: string; milestoneId?: string; status?: string; prdId?: string }) =>
    [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  byPrd: (prdId: string) => [...taskKeys.all, 'prd', prdId] as const,
};

/**
 * Fetch all tasks, with optional filters
 * 5.2.5 Caching: Tasks change frequently during active work
 */
export function useTasks(options?: {
  boardId?: string;
  milestoneId?: string;
  status?: Task['status'];
}) {
  const { boardId, milestoneId, status } = options || {};

  return useQuery({
    queryKey: taskKeys.list({ boardId, milestoneId, status }),
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        let filtered = [...MOCK_TASKS];
        if (boardId) filtered = filtered.filter(t => t.board_id === boardId);
        if (milestoneId) filtered = filtered.filter(t => t.milestone_id === milestoneId);
        if (status) filtered = filtered.filter(t => t.status === status);
        return filtered;
      }
      
      const supabase = getSupabaseClient();
      if (!supabase) return MOCK_TASKS;
      
      let query = supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });

      if (boardId) {
        query = query.eq('board_id', boardId);
      }
      if (milestoneId) {
        query = query.eq('milestone_id', milestoneId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Task[];
    },
    staleTime: STALE_TIMES.tasks,
    gcTime: GC_TIMES.default,
  });
}

/**
 * Fetch tasks for a specific board
 */
export function useBoardTasks(boardId: string) {
  return useTasks({ boardId });
}

/**
 * Fetch tasks linked to a specific PRD
 */
export function usePRDTasks(prdId: string) {
  return useQuery({
    queryKey: taskKeys.byPrd(prdId),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('prd_id', prdId)
        .order('position', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Task[];
    },
    enabled: !!prdId,
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Task;
    },
    enabled: !!id,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTask: TaskInsert) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Task;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(
        taskKeys.list({ boardId: newTask.board_id })
      );

      if (previousTasks) {
        const optimisticTask: Task = {
          id: `temp-${Date.now()}`,
          board_id: newTask.board_id,
          milestone_id: newTask.milestone_id || null,
          prd_id: newTask.prd_id || null,
          assigned_agent_id: newTask.assigned_agent_id || null,
          title: newTask.title,
          description: newTask.description || null,
          status: newTask.status || 'backlog',
          priority: newTask.priority || 'medium',
          story_points: newTask.story_points || null,
          ai_context: newTask.ai_context || {},
          column_id: newTask.column_id || 'backlog',
          position: newTask.position || previousTasks.length,
          due_date: newTask.due_date || null,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Task[]>(
          taskKeys.list({ boardId: newTask.board_id }),
          [...previousTasks, optimisticTask]
        );
      }

      return { previousTasks };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'tasks',
        entityId: data.id,
        action: 'create',
        payload: { title: data.title, board_id: data.board_id },
      });

      toast.success('Task created successfully');
    },
    onError: (error, newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list({ boardId: newTask.board_id }),
          context.previousTasks
        );
      }
      toast.error(`Failed to create task: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      const supabase = getSupabaseClient();

      // If status is changing to 'done', set completed_at
      if (updates.status === 'done' && !updates.completed_at) {
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Task;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));

      // Update the detail cache
      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      // Update all list caches that might contain this task
      const queries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      const previousListState = new Map<readonly unknown[], Task[] | undefined>();

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousListState.set(queryKey, data);
          queryClient.setQueryData<Task[]>(
            queryKey,
            data.map((task) =>
              task.id === id
                ? { ...task, ...updates, updated_at: new Date().toISOString() }
                : task
            )
          );
        }
      });

      return { previousTask, previousListState };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'tasks',
        entityId: data.id,
        action: 'update',
        payload: { title: data.title, status: data.status, column_id: data.column_id },
      });

      toast.success('Task updated successfully');
    },
    onError: (error, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          taskKeys.detail(variables.id),
          context.previousTask
        );
      }
      if (context?.previousListState) {
        context.previousListState.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to update task: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
    },
  });
}

/**
 * Move a task to a different column (convenience wrapper for updateTask)
 */
export function useMoveTask() {
  const updateTask = useUpdateTask();

  return useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      position,
    }: {
      taskId: string;
      columnId: string;
      position?: number;
    }) => {
      return updateTask.mutateAsync({
        id: taskId,
        column_id: columnId,
        status: columnId as Task['status'],
        position,
      });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const queries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      const previousState = new Map<readonly unknown[], Task[] | undefined>();

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousState.set(queryKey, data);
          queryClient.setQueryData<Task[]>(
            queryKey,
            data.filter((task) => task.id !== id)
          );
        }
      });

      return { previousState };
    },
    onSuccess: async (id) => {
      await logActivity({
        entityType: 'tasks',
        entityId: id,
        action: 'delete',
      });

      toast.success('Task deleted successfully');
    },
    onError: (error, _id, context) => {
      if (context?.previousState) {
        context.previousState.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to delete task: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Bulk update tasks (useful for reordering)
 */
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Array<{ id: string } & TaskUpdate>
    ) => {
      const supabase = getSupabaseClient();

      // Update each task
      const results = await Promise.all(
        updates.map(({ id, ...taskUpdates }) =>
          supabase
            .from('tasks')
            .update(taskUpdates)
            .eq('id', id)
            .select()
            .single()
        )
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(
          `Failed to update ${errors.length} tasks: ${errors[0].error?.message}`
        );
      }

      return results.map((r) => r.data as Task);
    },
    onSuccess: async (data) => {
      // Log activity for bulk update
      for (const task of data) {
        await logActivity({
          entityType: 'tasks',
          entityId: task.id,
          action: 'update',
          payload: { title: task.title, position: task.position },
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Link a task to a PRD
 */
export function useLinkTaskToPRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, prdId }: { taskId: string; prdId: string | null }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('tasks')
        .update({ prd_id: prdId })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Task;
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'tasks',
        entityId: data.id,
        action: data.prd_id ? 'link_to_prd' : 'unlink_from_prd',
        payload: { prd_id: data.prd_id },
      });

      toast.success(data.prd_id ? 'Linked to PRD' : 'Unlinked from PRD');
    },
    onError: (error) => {
      toast.error(`Failed to link task: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      if (variables.prdId) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byPrd(variables.prdId) });
      }
    },
  });
}

/**
 * Generate tasks from PRD requirements
 */
export function useGenerateTasksFromPRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prdId,
      boardId,
      requirements,
    }: {
      prdId: string;
      boardId: string;
      requirements: Array<{ title: string; description?: string }>;
    }) => {
      const supabase = getSupabaseClient();

      // Create tasks for each requirement
      const tasksToCreate: TaskInsert[] = requirements.map((req, index) => ({
        board_id: boardId,
        prd_id: prdId,
        title: req.title,
        description: req.description || null,
        status: 'backlog' as const,
        column_id: 'backlog',
        position: index,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return data as Task[];
    },
    onSuccess: async (data, variables) => {
      for (const task of data) {
        await logActivity({
          entityType: 'tasks',
          entityId: task.id,
          action: 'create_from_prd',
          payload: { prd_id: variables.prdId, title: task.title },
        });
      }

      toast.success(`Created ${data.length} task${data.length === 1 ? '' : 's'} from PRD`);
    },
    onError: (error) => {
      toast.error(`Failed to generate tasks: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.byPrd(variables.prdId) });
    },
  });
}
