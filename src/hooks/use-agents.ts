// Agent CRUD hooks using TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Agent, AgentInsert, AgentUpdate } from '@/types/database';

// Query keys
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters?: { isActive?: boolean }) => [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

// Fetch all agents
async function fetchAgents(isActive?: boolean): Promise<Agent[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('agents').select('*').order('name', { ascending: true });

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Fetch a single agent
async function fetchAgent(id: string): Promise<Agent> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Hook to get all agents
export function useAgents(isActive?: boolean) {
  return useQuery({
    queryKey: agentKeys.list({ isActive }),
    queryFn: () => fetchAgents(isActive),
  });
}

// Hook to get active agents only
export function useActiveAgents() {
  return useAgents(true);
}

// Hook to get a single agent
export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => fetchAgent(id),
    enabled: !!id,
  });
}

// Create agent mutation
export function useCreateAgent() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (agent: AgentInsert) => {
      const { data, error } = await supabase
        .from('agents')
        .insert(agent)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

// Update agent mutation
export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: AgentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.setQueryData(agentKeys.detail(data.id), data);
    },
  });
}

// Delete agent mutation
export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agents').delete().eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.removeQueries({ queryKey: agentKeys.detail(id) });
    },
  });
}
