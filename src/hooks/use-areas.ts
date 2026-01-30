'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import { STALE_TIMES, GC_TIMES } from '@/lib/cache-config';
import type { Area, AreaInsert, AreaUpdate } from '@/types/database';

// Query keys for cache management
export const areaKeys = {
  all: ['areas'] as const,
  lists: () => [...areaKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...areaKeys.lists(), filters] as const,
  details: () => [...areaKeys.all, 'detail'] as const,
  detail: (id: string) => [...areaKeys.details(), id] as const,
};

/**
 * Fetch all areas
 * 5.2.5 Caching: Areas rarely change, use longer stale time
 */
export function useAreas() {
  return useQuery({
    queryKey: areaKeys.lists(),
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('position', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data as Area[];
    },
    staleTime: STALE_TIMES.areas,
    gcTime: GC_TIMES.default,
  });
}

/**
 * Fetch a single area by ID
 */
export function useArea(id: string) {
  return useQuery({
    queryKey: areaKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Area;
    },
    enabled: !!id,
  });
}

/**
 * Create a new area
 */
export function useCreateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newArea: AreaInsert) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Please log in to create an area. Database connection not available.');
      }
      const { data, error } = await supabase
        .from('areas')
        .insert(newArea)
        .select()
        .single();

      if (error) {
        // Provide more helpful error messages
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          throw new Error('Please log in to create an area.');
        }
        if (error.code === '42501' || error.message.includes('policy')) {
          throw new Error('You do not have permission to create areas. Please check your account.');
        }
        throw new Error(error.message);
      }

      return data as Area;
    },
    onMutate: async (newArea) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: areaKeys.lists() });

      // Snapshot the previous value
      const previousAreas = queryClient.getQueryData<Area[]>(areaKeys.lists());

      // Optimistically update the cache
      if (previousAreas) {
        const optimisticArea: Area = {
          id: `temp-${Date.now()}`,
          name: newArea.name,
          color: newArea.color || '#6366f1',
          icon: newArea.icon || null,
          type: newArea.type,
          position: newArea.position || previousAreas.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Area[]>(areaKeys.lists(), [
          ...previousAreas,
          optimisticArea,
        ]);
      }

      return { previousAreas };
    },
    onSuccess: async (data) => {
      // Log activity
      await logActivity({
        entityType: 'areas',
        entityId: data.id,
        action: 'create',
        payload: { name: data.name, type: data.type },
      });

      toast.success('Area created successfully');
    },
    onError: (error, _newArea, context) => {
      // Rollback on error
      if (context?.previousAreas) {
        queryClient.setQueryData(areaKeys.lists(), context.previousAreas);
      }
      toast.error(`Failed to create area: ${error.message}`);
    },
    onSettled: () => {
      // Refetch to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}

/**
 * Update an existing area
 */
export function useUpdateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AreaUpdate & { id: string }) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { data, error } = await supabase
        .from('areas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Area;
    },
    onMutate: async ({ id, ...updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: areaKeys.lists() });
      await queryClient.cancelQueries({ queryKey: areaKeys.detail(id) });

      // Snapshot the previous values
      const previousAreas = queryClient.getQueryData<Area[]>(areaKeys.lists());
      const previousArea = queryClient.getQueryData<Area>(areaKeys.detail(id));

      // Optimistically update the lists cache
      if (previousAreas) {
        queryClient.setQueryData<Area[]>(
          areaKeys.lists(),
          previousAreas.map((area) =>
            area.id === id
              ? { ...area, ...updates, updated_at: new Date().toISOString() }
              : area
          )
        );
      }

      // Optimistically update the detail cache
      if (previousArea) {
        queryClient.setQueryData<Area>(areaKeys.detail(id), {
          ...previousArea,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousAreas, previousArea };
    },
    onSuccess: async (data) => {
      // Log activity
      await logActivity({
        entityType: 'areas',
        entityId: data.id,
        action: 'update',
        payload: { name: data.name },
      });

      toast.success('Area updated successfully');
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousAreas) {
        queryClient.setQueryData(areaKeys.lists(), context.previousAreas);
      }
      if (context?.previousArea) {
        queryClient.setQueryData(
          areaKeys.detail(variables.id),
          context.previousArea
        );
      }
      toast.error(`Failed to update area: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: areaKeys.detail(variables.id) });
    },
  });
}

/**
 * Delete an area
 */
export function useDeleteArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase.from('areas').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: areaKeys.lists() });

      // Snapshot the previous value
      const previousAreas = queryClient.getQueryData<Area[]>(areaKeys.lists());

      // Optimistically remove from cache
      if (previousAreas) {
        queryClient.setQueryData<Area[]>(
          areaKeys.lists(),
          previousAreas.filter((area) => area.id !== id)
        );
      }

      return { previousAreas };
    },
    onSuccess: async (id) => {
      // Log activity
      await logActivity({
        entityType: 'areas',
        entityId: id,
        action: 'delete',
      });

      toast.success('Area deleted successfully');
    },
    onError: (error, _id, context) => {
      // Rollback on error
      if (context?.previousAreas) {
        queryClient.setQueryData(areaKeys.lists(), context.previousAreas);
      }
      toast.error(`Failed to delete area: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: areaKeys.lists() });
    },
  });
}
