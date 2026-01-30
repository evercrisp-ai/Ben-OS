// update_task tool - Updates any task field
import { getSupabaseClient, Task, TaskPriority, TaskStatus, Json } from '../lib/supabase.js';

export interface UpdateTaskInput {
  task_id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  column_id?: string;
  milestone_id?: string | null;
  story_points?: number | null;
  ai_context?: Record<string, unknown>;
  due_date?: string | null;
  prd_id?: string | null;
  assigned_agent_id?: string | null;
}

export interface UpdateTaskOutput {
  task: Task;
}

export async function updateTask(input: UpdateTaskInput): Promise<UpdateTaskOutput> {
  const supabase = getSupabaseClient();

  // Build the update object
  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) updates.title = input.title;
  if (input.description !== undefined) updates.description = input.description;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.status !== undefined) updates.status = input.status;
  if (input.column_id !== undefined) updates.column_id = input.column_id;
  if (input.milestone_id !== undefined) updates.milestone_id = input.milestone_id;
  if (input.story_points !== undefined) updates.story_points = input.story_points;
  if (input.ai_context !== undefined) updates.ai_context = input.ai_context;
  if (input.due_date !== undefined) updates.due_date = input.due_date;
  if (input.prd_id !== undefined) updates.prd_id = input.prd_id;
  if (input.assigned_agent_id !== undefined) updates.assigned_agent_id = input.assigned_agent_id;

  // If status is being set to 'done', set completed_at
  if (input.status === 'done') {
    updates.completed_at = new Date().toISOString();
  } else if (input.status) {
    // Status is being set to something other than 'done', clear completed_at
    updates.completed_at = null;
  }

  // Update timestamp
  updates.updated_at = new Date().toISOString();

  // Perform the update
  const { data: task, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', input.task_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  if (!task) {
    throw new Error(`Task not found: ${input.task_id}`);
  }

  // Log the activity
  await supabase.from('activity_logs').insert({
    entity_type: 'tasks',
    entity_id: task.id,
    action: 'update',
    payload: updates as Json,
    user_initiated: false,
  });

  return { task };
}

export const updateTaskTool = {
  name: 'update_task',
  description: 'Update any field of an existing task. Provide the task ID and the fields you want to update.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'The ID of the task to update',
      },
      title: {
        type: 'string',
        description: 'New title for the task',
      },
      description: {
        type: 'string',
        description: 'New description for the task',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'New priority level',
      },
      status: {
        type: 'string',
        enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
        description: 'New status',
      },
      column_id: {
        type: 'string',
        description: 'New column ID',
      },
      milestone_id: {
        type: 'string',
        description: 'Milestone ID (or null to unassign)',
      },
      story_points: {
        type: 'number',
        description: 'Story points (or null to clear)',
      },
      ai_context: {
        type: 'object',
        description: 'AI-specific context',
      },
      due_date: {
        type: 'string',
        description: 'Due date in ISO format (or null to clear)',
      },
      prd_id: {
        type: 'string',
        description: 'PRD ID (or null to unlink)',
      },
      assigned_agent_id: {
        type: 'string',
        description: 'Agent ID to assign (or null to unassign)',
      },
    },
    required: ['task_id'],
  },
  handler: updateTask,
};
