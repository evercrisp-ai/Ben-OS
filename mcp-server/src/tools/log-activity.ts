// log_activity tool - Records agent actions to activity_logs
import { getSupabaseClient, Json } from '../lib/supabase.js';

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

export interface LogActivityInput {
  entity_type: EntityType;
  entity_id: string;
  action: string;
  payload?: Record<string, unknown>;
  agent_id?: string;
}

export interface LogActivityOutput {
  success: boolean;
  activity_id: string;
}

export async function logActivity(input: LogActivityInput): Promise<LogActivityOutput> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      payload: (input.payload || {}) as Json,
      agent_id: input.agent_id || null,
      user_initiated: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to log activity: ${error.message}`);
  }

  return {
    success: true,
    activity_id: data.id,
  };
}

export const logActivityTool = {
  name: 'log_activity',
  description: 'Record an agent action to the activity logs. Use this to track analysis, decisions, or other significant actions taken by the agent.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      entity_type: {
        type: 'string',
        enum: ['areas', 'projects', 'milestones', 'tasks', 'subtasks', 'boards', 'prds', 'agents', 'reports'],
        description: 'The type of entity the action relates to',
      },
      entity_id: {
        type: 'string',
        description: 'The ID of the entity',
      },
      action: {
        type: 'string',
        description: 'The action performed (e.g., "analyzed", "reviewed", "recommended")',
      },
      payload: {
        type: 'object',
        description: 'Additional data about the action',
      },
      agent_id: {
        type: 'string',
        description: 'The ID of the agent performing the action',
      },
    },
    required: ['entity_type', 'entity_id', 'action'],
  },
  handler: logActivity,
};
