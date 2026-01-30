// move_task tool - Moves task between columns/boards
import { getSupabaseClient, Task, TaskStatus, Json } from '../lib/supabase.js';

export interface MoveTaskInput {
  task_id: string;
  column_id?: string;
  board_id?: string;
  position?: number;
}

export interface MoveTaskOutput {
  task: Task;
}

export async function moveTask(input: MoveTaskInput): Promise<MoveTaskOutput> {
  const supabase = getSupabaseClient();

  // Get the current task
  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', input.task_id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch task: ${fetchError.message}`);
  }

  if (!currentTask) {
    throw new Error(`Task not found: ${input.task_id}`);
  }

  const updates: Record<string, unknown> = {};
  const targetBoardId = input.board_id || currentTask.board_id;
  const targetColumnId = input.column_id || currentTask.column_id;

  // Set the new board and column
  if (input.board_id) {
    updates.board_id = input.board_id;
  }

  if (input.column_id) {
    updates.column_id = input.column_id;

    // Map column to status
    let status: TaskStatus = currentTask.status;
    if (input.column_id === 'backlog') status = 'backlog';
    else if (input.column_id === 'todo') status = 'todo';
    else if (input.column_id === 'in_progress') status = 'in_progress';
    else if (input.column_id === 'review') status = 'review';
    else if (input.column_id === 'done') status = 'done';

    updates.status = status;

    // Handle completed_at
    if (status === 'done' && currentTask.status !== 'done') {
      updates.completed_at = new Date().toISOString();
    } else if (status !== 'done' && currentTask.status === 'done') {
      updates.completed_at = null;
    }
  }

  // Calculate new position
  if (input.position !== undefined) {
    updates.position = input.position;
  } else {
    // Get max position in target column
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('position')
      .eq('board_id', targetBoardId)
      .eq('column_id', targetColumnId)
      .neq('id', input.task_id)
      .order('position', { ascending: false })
      .limit(1);

    updates.position = existingTasks && existingTasks.length > 0 ? existingTasks[0].position + 1 : 0;
  }

  updates.updated_at = new Date().toISOString();

  // Perform the update
  const { data: task, error: updateError } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', input.task_id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to move task: ${updateError.message}`);
  }

  // Log the activity
  await supabase.from('activity_logs').insert({
    entity_type: 'tasks',
    entity_id: task.id,
    action: 'update',
    payload: {
      action: 'move',
      from_column: currentTask.column_id,
      to_column: targetColumnId,
      from_board: currentTask.board_id,
      to_board: targetBoardId,
    } as Json,
    user_initiated: false,
  });

  return { task };
}

export const moveTaskTool = {
  name: 'move_task',
  description: 'Move a task to a different column and/or board. Optionally specify the position within the target column.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'The ID of the task to move',
      },
      column_id: {
        type: 'string',
        description: 'Target column ID',
      },
      board_id: {
        type: 'string',
        description: 'Target board ID (for moving between boards)',
      },
      position: {
        type: 'number',
        description: 'Position within the target column (defaults to end)',
      },
    },
    required: ['task_id'],
  },
  handler: moveTask,
};
