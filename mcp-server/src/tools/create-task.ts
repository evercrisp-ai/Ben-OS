// create_task tool - Creates a new task on a board
import { getSupabaseClient, Task, TaskPriority, Json } from '../lib/supabase.js';

export interface CreateTaskInput {
  board_id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  column_id?: string;
  milestone_id?: string;
  story_points?: number;
  ai_context?: Record<string, unknown>;
  due_date?: string;
  prd_id?: string;
}

export interface CreateTaskOutput {
  task: Task;
}

export async function createTask(input: CreateTaskInput): Promise<CreateTaskOutput> {
  const supabase = getSupabaseClient();

  // Get the board to determine default column
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('column_config')
    .eq('id', input.board_id)
    .single();

  if (boardError) {
    throw new Error(`Failed to get board: ${boardError.message}`);
  }

  // Get the column_id (use provided or default to first column)
  let columnId = input.column_id;
  if (!columnId && board?.column_config && board.column_config.length > 0) {
    columnId = board.column_config[0].id;
  }
  if (!columnId) {
    columnId = 'backlog';
  }

  // Determine status based on column
  let status: Task['status'] = 'backlog';
  if (columnId === 'todo') status = 'todo';
  else if (columnId === 'in_progress') status = 'in_progress';
  else if (columnId === 'review') status = 'review';
  else if (columnId === 'done') status = 'done';

  // Get max position in the column
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('position')
    .eq('board_id', input.board_id)
    .eq('column_id', columnId)
    .order('position', { ascending: false })
    .limit(1);

  const position = existingTasks && existingTasks.length > 0 ? existingTasks[0].position + 1 : 0;

  // Create the task
  const { data: task, error: createError } = await supabase
    .from('tasks')
    .insert({
      board_id: input.board_id,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      column_id: columnId,
      status,
      milestone_id: input.milestone_id || null,
      story_points: input.story_points || null,
      ai_context: (input.ai_context || {}) as Json,
      due_date: input.due_date || null,
      prd_id: input.prd_id || null,
      position,
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create task: ${createError.message}`);
  }

  // Log the activity
  await supabase.from('activity_logs').insert({
    entity_type: 'tasks',
    entity_id: task.id,
    action: 'create',
    payload: { title: input.title, board_id: input.board_id } as Json,
    user_initiated: false,
  });

  return { task };
}

export const createTaskTool = {
  name: 'create_task',
  description: 'Create a new task on a board. Specify the board, title, and optional fields like description, priority, column, milestone, story points, and AI context.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      board_id: {
        type: 'string',
        description: 'The ID of the board to create the task on',
      },
      title: {
        type: 'string',
        description: 'The title of the task',
      },
      description: {
        type: 'string',
        description: 'Optional description of the task',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Task priority level',
      },
      column_id: {
        type: 'string',
        description: 'The column to place the task in (defaults to first column)',
      },
      milestone_id: {
        type: 'string',
        description: 'Optional milestone to associate the task with',
      },
      story_points: {
        type: 'number',
        description: 'Story points for the task',
      },
      ai_context: {
        type: 'object',
        description: 'AI-specific context for the task',
      },
      due_date: {
        type: 'string',
        description: 'Due date in ISO format',
      },
      prd_id: {
        type: 'string',
        description: 'Optional PRD to link the task to',
      },
    },
    required: ['board_id', 'title'],
  },
  handler: createTask,
};
