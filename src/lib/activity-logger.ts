// Activity logging utility for tracking all mutations
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ActivityLogInsert, Json } from '@/types/database';

export type EntityType =
  | 'areas'
  | 'projects'
  | 'milestones'
  | 'tasks'
  | 'subtasks'
  | 'boards'
  | 'prds'
  | 'agents'
  | 'reports';

export type ActionType = 'create' | 'update' | 'delete' | 'restore' | 'link_to_prd' | 'unlink_from_prd' | 'create_from_prd';

interface LogActivityParams {
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  payload?: Record<string, unknown>;
  agentId?: string | null;
  userInitiated?: boolean;
}

/**
 * Log an activity to the activity_logs table
 * This is called after successful mutations to create an audit trail
 */
export async function logActivity({
  entityType,
  entityId,
  action,
  payload = {},
  agentId = null,
  userInitiated = true,
}: LogActivityParams): Promise<void> {
  const supabase = getSupabaseClient();

  const logEntry: ActivityLogInsert = {
    entity_type: entityType,
    entity_id: entityId,
    action,
    payload: payload as Json,
    agent_id: agentId,
    user_initiated: userInitiated,
  };

  const { error } = await supabase.from('activity_logs').insert(logEntry);

  if (error) {
    // Log to console but don't throw - activity logging shouldn't break the main operation
    console.error('Failed to log activity:', error);
  }
}

/**
 * Get activity logs for a specific entity
 */
export async function getActivityLogs(
  entityType: EntityType,
  entityId: string,
  limit = 50
) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get recent activity logs across all entities
 */
export async function getRecentActivityLogs(limit = 50) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data;
}
