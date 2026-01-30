/**
 * Server-side Activity Logging Utility for Ben OS
 * Section 4.4 - Activity Logging
 *
 * Implements comprehensive audit trail for all system actions:
 * - 4.4.1: Log all mutations (create/update/delete)
 * - 4.4.2: Agent attribution (track which agent performed action)
 * - 4.4.3: User vs agent flag (distinguish human vs AI actions)
 * - 4.4.4: Payload capture (store relevant payload data)
 * - 4.4.7: Retention policy (auto-cleanup old logs)
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
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

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'assign'
  | 'unassign'
  | 'status_change'
  | 'link_to_prd'
  | 'unlink_from_prd'
  | 'create_from_prd'
  | 'bulk_update'
  | 'bulk_delete';

export interface LogActivityParams {
  entityType: EntityType;
  entityId: string;
  action: ActionType | string;
  payload?: Record<string, unknown>;
  agentId?: string | null;
  userInitiated?: boolean;
}

export interface ActivityLogResult {
  success: boolean;
  activityId?: string;
  error?: string;
}

/**
 * Calculate the changes between old and new values for logging
 */
export function calculateChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  // Fields to exclude from change tracking
  const excludedFields = ['updated_at', 'created_at', 'id'];

  for (const key of Object.keys(newData)) {
    if (excludedFields.includes(key)) continue;

    const oldValue = oldData[key];
    const newValue = newData[key];

    // Only log if value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = {
        from: oldValue,
        to: newValue,
      };
    }
  }

  return changes;
}

/**
 * Log an activity to the activity_logs table (server-side)
 * This is called after successful mutations to create an audit trail
 *
 * @param params - Activity log parameters
 * @returns Result indicating success or failure
 */
export async function logActivityServer({
  entityType,
  entityId,
  action,
  payload = {},
  agentId = null,
  userInitiated = true,
}: LogActivityParams): Promise<ActivityLogResult> {
  try {
    const supabase = createServiceRoleClient();

    const logEntry: ActivityLogInsert = {
      entity_type: entityType,
      entity_id: entityId,
      action,
      payload: payload as Json,
      agent_id: agentId,
      user_initiated: userInitiated,
    };

    const { data, error } = await supabase
      .from('activity_logs')
      .insert(logEntry)
      .select('id')
      .single();

    if (error) {
      // Log to console but don't throw - activity logging shouldn't break the main operation
      console.error('Failed to log activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true, activityId: data.id };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to log activity:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Get activity logs for a specific entity (server-side)
 */
export async function getActivityLogsServer(
  entityType: EntityType,
  entityId: string,
  limit = 50
) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, agents(name)')
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
 * Get recent activity logs across all entities (server-side)
 */
export async function getRecentActivityLogsServer(
  limit = 50,
  entityTypes?: EntityType[]
) {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('activity_logs')
    .select('*, agents(name)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entityTypes && entityTypes.length > 0) {
    query = query.in('entity_type', entityTypes);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get activity logs with pagination and filtering (server-side)
 */
export async function getActivityLogsWithFilters(options: {
  entityType?: EntityType;
  entityId?: string;
  agentId?: string;
  userInitiated?: boolean;
  action?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}) {
  const {
    entityType,
    entityId,
    agentId,
    userInitiated,
    action,
    limit = 50,
    offset = 0,
    startDate,
    endDate,
  } = options;

  const supabase = createServiceRoleClient();

  let query = supabase
    .from('activity_logs')
    .select('*, agents(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }
  if (entityId) {
    query = query.eq('entity_id', entityId);
  }
  if (agentId) {
    query = query.eq('agent_id', agentId);
  }
  if (typeof userInitiated === 'boolean') {
    query = query.eq('user_initiated', userInitiated);
  }
  if (action) {
    query = query.eq('action', action);
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data,
    pagination: {
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    },
  };
}

/**
 * Get logs older than a specified number of days (for retention cleanup)
 */
export async function getLogsOlderThanDays(days: number) {
  const supabase = createServiceRoleClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from('activity_logs')
    .select('id')
    .lt('created_at', cutoffDate.toISOString());

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 4.4.7: Run retention policy cleanup
 * Deletes activity logs older than the specified retention period (default 90 days)
 *
 * @param retentionDays - Number of days to retain logs (default 90)
 * @returns Number of logs deleted
 */
export async function runRetentionCleanup(retentionDays = 90): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // First, count how many will be deleted
    const { count } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', cutoffDate.toISOString());

    // Delete old logs
    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      return { success: false, deletedCount: 0, error: error.message };
    }

    return { success: true, deletedCount: count || 0 };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, deletedCount: 0, error: errorMessage };
  }
}

/**
 * Create a log entry for a create operation
 */
export async function logCreate(
  entityType: EntityType,
  entityId: string,
  data: Record<string, unknown>,
  options?: { agentId?: string | null; userInitiated?: boolean }
): Promise<ActivityLogResult> {
  return logActivityServer({
    entityType,
    entityId,
    action: 'create',
    payload: { data },
    agentId: options?.agentId,
    userInitiated: options?.userInitiated ?? true,
  });
}

/**
 * Create a log entry for an update operation
 */
export async function logUpdate(
  entityType: EntityType,
  entityId: string,
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  options?: { agentId?: string | null; userInitiated?: boolean }
): Promise<ActivityLogResult> {
  const changes = calculateChanges(oldData, newData);

  // Don't log if no actual changes
  if (Object.keys(changes).length === 0) {
    return { success: true };
  }

  return logActivityServer({
    entityType,
    entityId,
    action: 'update',
    payload: { changes },
    agentId: options?.agentId,
    userInitiated: options?.userInitiated ?? true,
  });
}

/**
 * Create a log entry for a delete operation
 */
export async function logDelete(
  entityType: EntityType,
  entityId: string,
  deletedData?: Record<string, unknown>,
  options?: { agentId?: string | null; userInitiated?: boolean }
): Promise<ActivityLogResult> {
  return logActivityServer({
    entityType,
    entityId,
    action: 'delete',
    payload: deletedData ? { deleted: deletedData } : {},
    agentId: options?.agentId,
    userInitiated: options?.userInitiated ?? true,
  });
}

/**
 * Create a log entry for a status change
 */
export async function logStatusChange(
  entityType: EntityType,
  entityId: string,
  fromStatus: string,
  toStatus: string,
  options?: { agentId?: string | null; userInitiated?: boolean }
): Promise<ActivityLogResult> {
  return logActivityServer({
    entityType,
    entityId,
    action: 'status_change',
    payload: {
      changes: {
        status: { from: fromStatus, to: toStatus },
      },
    },
    agentId: options?.agentId,
    userInitiated: options?.userInitiated ?? true,
  });
}

/**
 * Create a log entry for an assignment change
 */
export async function logAssignment(
  entityType: EntityType,
  entityId: string,
  fromAgentId: string | null,
  toAgentId: string | null,
  options?: { agentId?: string | null; userInitiated?: boolean }
): Promise<ActivityLogResult> {
  const action = toAgentId ? 'assign' : 'unassign';

  return logActivityServer({
    entityType,
    entityId,
    action,
    payload: {
      changes: {
        assigned_agent_id: { from: fromAgentId, to: toAgentId },
      },
    },
    agentId: options?.agentId,
    userInitiated: options?.userInitiated ?? true,
  });
}
