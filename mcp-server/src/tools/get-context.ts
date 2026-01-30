// get_context tool - Returns relevant context for a task
import { getSupabaseClient, Task, Project, Milestone, Board } from '../lib/supabase.js';

export interface GetContextInput {
  task_id: string;
}

export interface GetContextOutput {
  task: Task;
  project: Project | null;
  board: Board | null;
  milestone: Milestone | null;
  related_tasks: Task[];
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    position: number;
  }>;
  prd: {
    id: string;
    title: string;
    status: string;
  } | null;
}

export async function getContext(input: GetContextInput): Promise<GetContextOutput> {
  const supabase = getSupabaseClient();

  // Fetch the task with all relationships
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', input.task_id)
    .single();

  if (taskError) {
    throw new Error(`Failed to get task: ${taskError.message}`);
  }

  if (!task) {
    throw new Error(`Task not found: ${input.task_id}`);
  }

  // Fetch the board
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', task.board_id)
    .single();

  // Fetch the project
  let project: Project | null = null;
  if (board?.project_id) {
    const { data: projectData } = await supabase
      .from('projects')
      .select('*')
      .eq('id', board.project_id)
      .single();
    project = projectData;
  }

  // Fetch the milestone if assigned
  let milestone: Milestone | null = null;
  if (task.milestone_id) {
    const { data: milestoneData } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', task.milestone_id)
      .single();
    milestone = milestoneData;
  }

  // Fetch related tasks (same milestone or same board, excluding current task)
  let relatedTasks: Task[] = [];

  if (task.milestone_id) {
    // Get other tasks in the same milestone
    const { data: milestoneTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('milestone_id', task.milestone_id)
      .neq('id', input.task_id)
      .order('position', { ascending: true })
      .limit(10);

    relatedTasks = milestoneTasks || [];
  }

  if (relatedTasks.length < 5) {
    // Get other tasks on the same board if we need more
    const { data: boardTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', task.board_id)
      .neq('id', input.task_id)
      .order('position', { ascending: true })
      .limit(10 - relatedTasks.length);

    // Add board tasks that aren't already in related tasks
    const existingIds = new Set(relatedTasks.map((t) => t.id));
    (boardTasks || []).forEach((t) => {
      if (!existingIds.has(t.id)) {
        relatedTasks.push(t);
      }
    });
  }

  // Fetch subtasks
  const { data: subtasks } = await supabase
    .from('subtasks')
    .select('id, title, completed, position')
    .eq('task_id', input.task_id)
    .order('position', { ascending: true });

  // Fetch PRD if linked
  let prd: GetContextOutput['prd'] = null;
  if (task.prd_id) {
    const { data: prdData } = await supabase
      .from('prds')
      .select('id, title, status')
      .eq('id', task.prd_id)
      .single();
    prd = prdData;
  }

  return {
    task,
    project,
    board,
    milestone,
    related_tasks: relatedTasks,
    subtasks: subtasks || [],
    prd,
  };
}

export const getContextTool = {
  name: 'get_context',
  description: 'Get comprehensive context for a task including its project, board, milestone, related tasks, subtasks, and linked PRD.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'The ID of the task to get context for',
      },
    },
    required: ['task_id'],
  },
  handler: getContext,
};
