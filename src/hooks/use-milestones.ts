'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import type {
  Milestone,
  MilestoneInsert,
  MilestoneUpdate,
} from '@/types/database';

// Query keys for cache management
export const milestoneKeys = {
  all: ['milestones'] as const,
  lists: () => [...milestoneKeys.all, 'list'] as const,
  list: (filters?: { projectId?: string }) =>
    [...milestoneKeys.lists(), filters] as const,
  details: () => [...milestoneKeys.all, 'detail'] as const,
  detail: (id: string) => [...milestoneKeys.details(), id] as const,
};

/**
 * Fetch all milestones, optionally filtered by project
 */
export function useMilestones(projectId?: string) {
  return useQuery({
    queryKey: milestoneKeys.list({ projectId }),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      let query = supabase
        .from('milestones')
        .select('*')
        .order('position', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Milestone[];
    },
  });
}

/**
 * Fetch a single milestone by ID
 */
export function useMilestone(id: string) {
  return useQuery({
    queryKey: milestoneKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Milestone;
    },
    enabled: !!id,
  });
}

/**
 * Create a new milestone
 */
export function useCreateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newMilestone: MilestoneInsert) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('milestones')
        .insert(newMilestone)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Milestone;
    },
    onMutate: async (newMilestone) => {
      await queryClient.cancelQueries({ queryKey: milestoneKeys.lists() });

      const previousMilestones = queryClient.getQueryData<Milestone[]>(
        milestoneKeys.list({ projectId: newMilestone.project_id })
      );

      if (previousMilestones) {
        const optimisticMilestone: Milestone = {
          id: `temp-${Date.now()}`,
          project_id: newMilestone.project_id,
          title: newMilestone.title,
          description: newMilestone.description || null,
          status: newMilestone.status || 'pending',
          target_date: newMilestone.target_date || null,
          position: newMilestone.position || previousMilestones.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Milestone[]>(
          milestoneKeys.list({ projectId: newMilestone.project_id }),
          [...previousMilestones, optimisticMilestone]
        );
      }

      return { previousMilestones };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'milestones',
        entityId: data.id,
        action: 'create',
        payload: { title: data.title, project_id: data.project_id },
      });

      toast.success('Milestone created successfully');
    },
    onError: (error, newMilestone, context) => {
      if (context?.previousMilestones) {
        queryClient.setQueryData(
          milestoneKeys.list({ projectId: newMilestone.project_id }),
          context.previousMilestones
        );
      }
      toast.error(`Failed to create milestone: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
    },
  });
}

/**
 * Update an existing milestone
 */
export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: MilestoneUpdate & { id: string }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Milestone;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: milestoneKeys.lists() });
      await queryClient.cancelQueries({ queryKey: milestoneKeys.detail(id) });

      const previousMilestone = queryClient.getQueryData<Milestone>(
        milestoneKeys.detail(id)
      );

      if (previousMilestone) {
        queryClient.setQueryData<Milestone>(milestoneKeys.detail(id), {
          ...previousMilestone,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousMilestone };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'milestones',
        entityId: data.id,
        action: 'update',
        payload: { title: data.title, status: data.status },
      });

      toast.success('Milestone updated successfully');
    },
    onError: (error, variables, context) => {
      if (context?.previousMilestone) {
        queryClient.setQueryData(
          milestoneKeys.detail(variables.id),
          context.previousMilestone
        );
      }
      toast.error(`Failed to update milestone: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: milestoneKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a milestone
 */
export function useDeleteMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase.from('milestones').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: milestoneKeys.lists() });

      const queries = queryClient.getQueriesData<Milestone[]>({
        queryKey: milestoneKeys.lists(),
      });

      const previousState = new Map<
        readonly unknown[],
        Milestone[] | undefined
      >();

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousState.set(queryKey, data);
          queryClient.setQueryData<Milestone[]>(
            queryKey,
            data.filter((milestone) => milestone.id !== id)
          );
        }
      });

      return { previousState };
    },
    onSuccess: async (id) => {
      await logActivity({
        entityType: 'milestones',
        entityId: id,
        action: 'delete',
      });

      toast.success('Milestone deleted successfully');
    },
    onError: (error, _id, context) => {
      if (context?.previousState) {
        context.previousState.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to delete milestone: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
    },
  });
}
