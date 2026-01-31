'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import type { PRD, PRDInsert, PRDUpdate, PRDVersion, PRDStatus, Task, TaskPriority } from '@/types/database';
import { taskKeys } from '@/hooks/use-tasks';

// Types for task extraction
export interface ExtractedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  story_points: number | null;
  suggested_column: 'backlog' | 'todo';
}

export interface TaskExtractionResult {
  prd_id: string;
  prd_title: string;
  project_id: string;
  extraction: {
    tasks: ExtractedTask[];
    summary: string;
  };
  effort_estimate: {
    totalPoints: number;
    taskCount: number;
    priorityBreakdown: Record<TaskPriority, number>;
  };
}

// Query keys for cache management
export const prdKeys = {
  all: ['prds'] as const,
  lists: () => [...prdKeys.all, 'list'] as const,
  list: (projectId?: string) => [...prdKeys.lists(), { projectId }] as const,
  details: () => [...prdKeys.all, 'detail'] as const,
  detail: (id: string) => [...prdKeys.details(), id] as const,
  versions: (prdId: string) => [...prdKeys.all, 'versions', prdId] as const,
};

/**
 * Fetch all PRDs, with optional project filter
 */
export function usePRDs(projectId?: string) {
  return useQuery({
    queryKey: prdKeys.list(projectId),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      let query = supabase
        .from('prds')
        .select('*')
        .order('updated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as PRD[];
    },
  });
}

/**
 * Fetch PRDs for a specific project
 */
export function useProjectPRDs(projectId: string) {
  return usePRDs(projectId);
}

/**
 * Fetch a single PRD by ID
 */
export function usePRD(id: string) {
  return useQuery({
    queryKey: prdKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('prds')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PRD;
    },
    enabled: !!id,
  });
}

/**
 * Fetch version history for a PRD
 */
export function usePRDVersions(prdId: string) {
  return useQuery({
    queryKey: prdKeys.versions(prdId),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('prd_versions')
        .select('*')
        .eq('prd_id', prdId)
        .order('version_number', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as PRDVersion[];
    },
    enabled: !!prdId,
  });
}

/**
 * Create a new PRD
 */
export function useCreatePRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPRD: PRDInsert) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('prds')
        .insert(newPRD)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PRD;
    },
    onMutate: async (newPRD) => {
      await queryClient.cancelQueries({ queryKey: prdKeys.lists() });

      const previousPRDs = queryClient.getQueryData<PRD[]>(
        prdKeys.list(newPRD.project_id)
      );

      if (previousPRDs) {
        const optimisticPRD: PRD = {
          id: `temp-${Date.now()}`,
          project_id: newPRD.project_id,
          title: newPRD.title,
          content: newPRD.content || null,
          status: newPRD.status || 'draft',
          sections: newPRD.sections || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<PRD[]>(
          prdKeys.list(newPRD.project_id),
          [optimisticPRD, ...previousPRDs]
        );
      }

      return { previousPRDs };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'prds',
        entityId: data.id,
        action: 'create',
        payload: { title: data.title, project_id: data.project_id },
      });

      toast.success('PRD created successfully');
    },
    onError: (error, newPRD, context) => {
      if (context?.previousPRDs) {
        queryClient.setQueryData(
          prdKeys.list(newPRD.project_id),
          context.previousPRDs
        );
      }
      toast.error(`Failed to create PRD: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });
    },
  });
}

/**
 * Update an existing PRD
 */
export function useUpdatePRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PRDUpdate & { id: string }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('prds')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PRD;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: prdKeys.lists() });
      await queryClient.cancelQueries({ queryKey: prdKeys.detail(id) });

      const previousPRD = queryClient.getQueryData<PRD>(prdKeys.detail(id));

      // Update the detail cache
      if (previousPRD) {
        queryClient.setQueryData<PRD>(prdKeys.detail(id), {
          ...previousPRD,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      // Update all list caches that might contain this PRD
      const queries = queryClient.getQueriesData<PRD[]>({
        queryKey: prdKeys.lists(),
      });

      const previousListState = new Map<readonly unknown[], PRD[] | undefined>();

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousListState.set(queryKey, data);
          queryClient.setQueryData<PRD[]>(
            queryKey,
            data.map((prd) =>
              prd.id === id
                ? { ...prd, ...updates, updated_at: new Date().toISOString() }
                : prd
            )
          );
        }
      });

      return { previousPRD, previousListState };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'prds',
        entityId: data.id,
        action: 'update',
        payload: { title: data.title, status: data.status },
      });

      // Don't show toast for auto-save (too noisy)
    },
    onError: (error, variables, context) => {
      if (context?.previousPRD) {
        queryClient.setQueryData(
          prdKeys.detail(variables.id),
          context.previousPRD
        );
      }
      if (context?.previousListState) {
        context.previousListState.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to update PRD: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });
      queryClient.invalidateQueries({ queryKey: prdKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: prdKeys.versions(variables.id) });
    },
  });
}

/**
 * Update PRD status
 */
export function useUpdatePRDStatus() {
  const updatePRD = useUpdatePRD();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PRDStatus }) => {
      const result = await updatePRD.mutateAsync({ id, status });
      toast.success(`PRD status updated to ${status}`);
      return result;
    },
  });
}

/**
 * Delete a PRD
 */
export function useDeletePRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase.from('prds').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: prdKeys.lists() });

      const queries = queryClient.getQueriesData<PRD[]>({
        queryKey: prdKeys.lists(),
      });

      const previousState = new Map<readonly unknown[], PRD[] | undefined>();

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousState.set(queryKey, data);
          queryClient.setQueryData<PRD[]>(
            queryKey,
            data.filter((prd) => prd.id !== id)
          );
        }
      });

      return { previousState };
    },
    onSuccess: async (id) => {
      await logActivity({
        entityType: 'prds',
        entityId: id,
        action: 'delete',
      });

      toast.success('PRD deleted successfully');
    },
    onError: (error, _id, context) => {
      if (context?.previousState) {
        context.previousState.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to delete PRD: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });
    },
  });
}

/**
 * Extract tasks from a PRD using AI
 */
export function useExtractTasksFromPRD() {
  return useMutation({
    mutationFn: async (prdId: string) => {
      const response = await fetch(`/api/v1/prds/${prdId}/extract-tasks`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract tasks from PRD');
      }

      const data = await response.json();
      return data.data as TaskExtractionResult;
    },
    onError: (error) => {
      toast.error(`Failed to extract tasks: ${error.message}`);
    },
  });
}

/**
 * Create tasks from extracted PRD tasks
 */
export function useCreateTasksFromPRD() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prdId,
      tasks,
    }: {
      prdId: string;
      tasks: ExtractedTask[];
    }) => {
      const response = await fetch(`/api/v1/prds/${prdId}/extract-tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tasks from PRD');
      }

      const data = await response.json();
      return data.data as {
        prd_id: string;
        board_id: string;
        created_tasks: Task[];
        message: string;
      };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'prds',
        entityId: data.prd_id,
        action: 'create_tasks',
        payload: { task_count: data.created_tasks.length },
      });

      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Failed to create tasks: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: prdKeys.detail(variables.prdId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Upload a markdown file to create or update a PRD
 */
export function useUploadPRDMarkdown() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      projectId,
      prdId,
      title,
    }: {
      file: File;
      projectId: string;
      prdId?: string;
      title?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      if (prdId) formData.append('prd_id', prdId);
      if (title) formData.append('title', title);

      const response = await fetch('/api/v1/prds/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload PRD markdown');
      }

      const data = await response.json();
      return data.data as PRD & { sections_count: number; message: string };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'prds',
        entityId: data.id,
        action: data.message.includes('updated') ? 'update' : 'create',
        payload: { title: data.title, action: 'upload_markdown' },
      });

      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Failed to upload PRD: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });
    },
  });
}

/**
 * Restore a PRD to a previous version
 */
export function useRestorePRDVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ prdId, version }: { prdId: string; version: PRDVersion }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('prds')
        .update({
          title: version.title,
          content: version.content,
          sections: version.sections,
        })
        .eq('id', prdId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as PRD;
    },
    onSuccess: async (data, { version }) => {
      await logActivity({
        entityType: 'prds',
        entityId: data.id,
        action: 'restore',
        payload: { version_number: version.version_number },
      });

      toast.success(`Restored to version ${version.version_number}`);
    },
    onError: (error) => {
      toast.error(`Failed to restore version: ${error.message}`);
    },
    onSettled: (_data, _error, { prdId }) => {
      queryClient.invalidateQueries({ queryKey: prdKeys.detail(prdId) });
      queryClient.invalidateQueries({ queryKey: prdKeys.versions(prdId) });
      queryClient.invalidateQueries({ queryKey: prdKeys.lists() });
    },
  });
}
