// Activity logs hooks using TanStack Query
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ActivityLog } from '@/types/database';
import type { EntityType } from '@/lib/activity-logger';

// Query keys
export const activityLogKeys = {
  all: ['activity_logs'] as const,
  lists: () => [...activityLogKeys.all, 'list'] as const,
  entity: (entityType: EntityType, entityId: string) =>
    [...activityLogKeys.lists(), entityType, entityId] as const,
  recent: (limit?: number) => [...activityLogKeys.lists(), 'recent', limit] as const,
};

// Fetch activity logs for a specific entity
async function fetchEntityActivityLogs(
  entityType: EntityType,
  entityId: string,
  limit = 50
): Promise<ActivityLog[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Fetch recent activity logs across all entities
async function fetchRecentActivityLogs(limit = 50): Promise<ActivityLog[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Hook to get activity logs for a specific entity (task, project, etc.)
export function useEntityActivityLogs(
  entityType: EntityType,
  entityId: string,
  limit = 50
) {
  return useQuery({
    queryKey: activityLogKeys.entity(entityType, entityId),
    queryFn: () => fetchEntityActivityLogs(entityType, entityId, limit),
    enabled: !!entityId,
  });
}

// Hook to get activity logs specifically for a task
export function useTaskActivityLogs(taskId: string, limit = 20) {
  return useEntityActivityLogs('tasks', taskId, limit);
}

// Hook to get recent activity logs
export function useRecentActivityLogs(limit = 50) {
  return useQuery({
    queryKey: activityLogKeys.recent(limit),
    queryFn: () => fetchRecentActivityLogs(limit),
  });
}

// Helper to format activity action for display
export function formatActivityAction(action: string): string {
  const actionMap: Record<string, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    restore: 'restored',
    link_to_prd: 'linked to PRD',
    unlink_from_prd: 'unlinked from PRD',
    create_from_prd: 'created from PRD',
  };
  return actionMap[action] || action;
}

// Helper to format activity payload changes for display
export function formatActivityChanges(
  payload: Record<string, unknown>
): string[] {
  const changes: string[] = [];

  if (payload.changes && typeof payload.changes === 'object') {
    const changesObj = payload.changes as Record<string, unknown>;
    
    for (const [key, value] of Object.entries(changesObj)) {
      const formattedKey = key.replace(/_/g, ' ');
      
      if (typeof value === 'object' && value !== null) {
        const { from, to } = value as { from?: unknown; to?: unknown };
        if (from !== undefined && to !== undefined) {
          changes.push(`${formattedKey}: ${String(from)} → ${String(to)}`);
        } else {
          changes.push(`${formattedKey}: ${JSON.stringify(to ?? from)}`);
        }
      } else {
        changes.push(`${formattedKey}: ${String(value)}`);
      }
    }
  }

  if (payload.title) {
    changes.push(`title: "${payload.title}"`);
  }

  return changes;
}
