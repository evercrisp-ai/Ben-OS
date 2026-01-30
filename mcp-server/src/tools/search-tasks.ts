// search_tasks tool - Semantic search across tasks
import { getSupabaseClient, Task } from '../lib/supabase.js';

export interface SearchTasksInput {
  query: string;
  status?: string;
  priority?: string;
  board_id?: string;
  project_id?: string;
  limit?: number;
}

export interface SearchTasksOutput {
  tasks: Array<Task & {
    board?: { id: string; name: string };
    project?: { id: string; title: string };
    relevance_score?: number;
  }>;
  total_count: number;
}

export async function searchTasks(input: SearchTasksInput): Promise<SearchTasksOutput> {
  const supabase = getSupabaseClient();

  const searchLimit = input.limit || 20;
  const searchTerms = input.query.toLowerCase().split(/\s+/).filter(Boolean);

  // Build the base query
  let query = supabase
    .from('tasks')
    .select(`
      *,
      boards!tasks_board_id_fkey(
        id,
        name,
        project_id,
        projects!boards_project_id_fkey(id, title)
      )
    `);

  // Apply filters
  if (input.status) {
    query = query.eq('status', input.status);
  }

  if (input.priority) {
    query = query.eq('priority', input.priority);
  }

  if (input.board_id) {
    query = query.eq('board_id', input.board_id);
  }

  // If project_id filter is provided, we need to join through boards
  // For now, fetch all and filter in memory
  const { data: allTasks, error } = await query;

  if (error) {
    throw new Error(`Failed to search tasks: ${error.message}`);
  }

  // Filter by project_id if specified
  let filteredTasks = allTasks || [];
  if (input.project_id) {
    filteredTasks = filteredTasks.filter(
      (t) => t.boards?.project_id === input.project_id
    );
  }

  // Score each task based on search term matches
  const scoredTasks = filteredTasks.map((task) => {
    const titleLower = (task.title || '').toLowerCase();
    const descLower = (task.description || '').toLowerCase();
    const aiContextStr = JSON.stringify(task.ai_context || {}).toLowerCase();

    let score = 0;

    for (const term of searchTerms) {
      // Title matches are weighted highest
      if (titleLower.includes(term)) {
        score += 10;
        // Exact word match in title
        if (titleLower.split(/\s+/).includes(term)) {
          score += 5;
        }
      }

      // Description matches
      if (descLower.includes(term)) {
        score += 5;
      }

      // AI context matches
      if (aiContextStr.includes(term)) {
        score += 2;
      }
    }

    return {
      ...task,
      board: task.boards ? { id: task.boards.id, name: task.boards.name } : undefined,
      project: task.boards?.projects
        ? { id: task.boards.projects.id, title: task.boards.projects.title }
        : undefined,
      relevance_score: score,
    };
  });

  // Filter out tasks with no matches and sort by relevance
  const matchingTasks = scoredTasks
    .filter((t) => t.relevance_score > 0)
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    .slice(0, searchLimit);

  return {
    tasks: matchingTasks,
    total_count: matchingTasks.length,
  };
}

export const searchTasksTool = {
  name: 'search_tasks',
  description: 'Search for tasks by keyword across titles, descriptions, and AI context. Optionally filter by status, priority, board, or project.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Search query to find tasks',
      },
      status: {
        type: 'string',
        enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
        description: 'Filter by task status',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high', 'critical'],
        description: 'Filter by priority',
      },
      board_id: {
        type: 'string',
        description: 'Filter by board ID',
      },
      project_id: {
        type: 'string',
        description: 'Filter by project ID',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 20)',
      },
    },
    required: ['query'],
  },
  handler: searchTasks,
};
