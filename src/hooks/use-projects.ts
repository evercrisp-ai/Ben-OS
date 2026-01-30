'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity-logger';
import { STALE_TIMES, GC_TIMES } from '@/lib/cache-config';
import type { Project, ProjectInsert, ProjectUpdate } from '@/types/database';

// Mock data for demo mode
const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Website Redesign', description: 'Redesign company website', area_id: '2', status: 'active', position: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', name: 'Mobile App', description: 'Build mobile app', area_id: '3', status: 'active', position: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', name: 'Home Renovation', description: 'Kitchen and bathroom updates', area_id: '1', status: 'planning', position: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Query keys for cache management
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters?: { areaId?: string; status?: string }) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Fetch all projects, optionally filtered by area
 * 5.2.5 Caching: Projects change less frequently
 */
export function useProjects(areaId?: string) {
  return useQuery({
    queryKey: projectKeys.list({ areaId }),
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        const filtered = areaId ? MOCK_PROJECTS.filter(p => p.area_id === areaId) : MOCK_PROJECTS;
        return filtered;
      }
      
      const supabase = getSupabaseClient();
      if (!supabase) return MOCK_PROJECTS;
      
      let query = supabase
        .from('projects')
        .select('*')
        .order('position', { ascending: true });

      if (areaId) {
        query = query.eq('area_id', areaId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return data as Project[];
    },
    staleTime: STALE_TIMES.projects,
    gcTime: GC_TIMES.default,
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Project;
    },
    enabled: !!id,
  });
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProject: ProjectInsert) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Project;
    },
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      const previousProjects = queryClient.getQueryData<Project[]>(
        projectKeys.list({ areaId: newProject.area_id })
      );

      if (previousProjects) {
        const optimisticProject: Project = {
          id: `temp-${Date.now()}`,
          area_id: newProject.area_id,
          title: newProject.title,
          description: newProject.description || null,
          status: newProject.status || 'active',
          target_date: newProject.target_date || null,
          metadata: newProject.metadata || {},
          position: newProject.position || previousProjects.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<Project[]>(
          projectKeys.list({ areaId: newProject.area_id }),
          [...previousProjects, optimisticProject]
        );
      }

      return { previousProjects };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'projects',
        entityId: data.id,
        action: 'create',
        payload: { title: data.title, area_id: data.area_id },
      });

      toast.success('Project created successfully');
    },
    onError: (error, newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(
          projectKeys.list({ areaId: newProject.area_id }),
          context.previousProjects
        );
      }
      toast.error(`Failed to create project: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Project;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(id) });

      const previousProject = queryClient.getQueryData<Project>(
        projectKeys.detail(id)
      );

      if (previousProject) {
        queryClient.setQueryData<Project>(projectKeys.detail(id), {
          ...previousProject,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousProject };
    },
    onSuccess: async (data) => {
      await logActivity({
        entityType: 'projects',
        entityId: data.id,
        action: 'update',
        payload: { title: data.title, status: data.status },
      });

      toast.success('Project updated successfully');
    },
    onError: (error, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectKeys.detail(variables.id),
          context.previousProject
        );
      }
      toast.error(`Failed to update project: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // We need to get all project lists and remove from each
      const queries = queryClient.getQueriesData<Project[]>({
        queryKey: projectKeys.lists(),
      });

      const previousState = new Map<
        readonly unknown[],
        Project[] | undefined
      >();

      queries.forEach(([queryKey, data]) => {
        if (data) {
          previousState.set(queryKey, data);
          queryClient.setQueryData<Project[]>(
            queryKey,
            data.filter((project) => project.id !== id)
          );
        }
      });

      return { previousState };
    },
    onSuccess: async (id) => {
      await logActivity({
        entityType: 'projects',
        entityId: id,
        action: 'delete',
      });

      toast.success('Project deleted successfully');
    },
    onError: (error, _id, context) => {
      if (context?.previousState) {
        context.previousState.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to delete project: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
