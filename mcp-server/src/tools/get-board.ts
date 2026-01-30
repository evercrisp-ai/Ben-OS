// get_board tool - Returns board with columns and tasks
import { getSupabaseClient, Board, Task, ColumnConfig } from '../lib/supabase.js';

export interface GetBoardInput {
  board_id: string;
}

export interface GetBoardOutput {
  board: Board & {
    project?: { id: string; title: string; status: string };
  };
  columns: ColumnConfig[];
  tasks: Task[];
}

export async function getBoard(input: GetBoardInput): Promise<GetBoardOutput> {
  const supabase = getSupabaseClient();

  // Fetch board with project info
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select(`
      *,
      projects!boards_project_id_fkey(id, title, status)
    `)
    .eq('id', input.board_id)
    .single();

  if (boardError) {
    throw new Error(`Failed to get board: ${boardError.message}`);
  }

  if (!board) {
    throw new Error(`Board not found: ${input.board_id}`);
  }

  // Fetch all tasks for this board
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('board_id', input.board_id)
    .order('position', { ascending: true });

  if (tasksError) {
    throw new Error(`Failed to get tasks: ${tasksError.message}`);
  }

  return {
    board: {
      ...board,
      project: board.projects,
    },
    columns: board.column_config || [],
    tasks: tasks || [],
  };
}

export const getBoardTool = {
  name: 'get_board',
  description: 'Get a Kanban board with all columns and tasks. Returns the board configuration, column definitions, and all tasks on the board.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      board_id: {
        type: 'string',
        description: 'The ID of the board to retrieve',
      },
    },
    required: ['board_id'],
  },
  handler: getBoard,
};
