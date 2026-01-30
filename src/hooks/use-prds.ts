'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import type { PRD, PRDInsert, PRDUpdate, PRDVersion, PRDStatus } from '@/types/database';

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
