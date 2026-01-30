// list_projects tool - Returns all projects with status
import { getSupabaseClient, Project, ProjectStatus } from '../lib/supabase.js';

export interface ListProjectsInput {
  area_id?: string;
  status?: ProjectStatus;
}

export interface ListProjectsOutput {
  projects: Array<Project & {
    area?: { id: string; name: string; color: string };
    task_count?: number;
    completed_task_count?: number;
  }>;
}

export async function listProjects(input: ListProjectsInput): Promise<ListProjectsOutput> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('projects')
    .select(`
      *,
      areas!projects_area_id_fkey(id, name, color)
    `)
    .order('position', { ascending: true });

  if (input.area_id) {
    query = query.eq('area_id', input.area_id);
  }

  if (input.status) {
    query = query.eq('status', input.status);
  }

  const { data: projects, error } = await query;

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  // Get task counts for each project
  const projectIds = (projects || []).map((p) => p.id);

  const { data: boards } = await supabase
    .from('boards')
    .select('id, project_id')
    .in('project_id', projectIds);

  const boardIds = (boards || []).map((b) => b.id);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, board_id, status')
    .in('board_id', boardIds);

  // Create a map of project_id -> task counts
  const boardToProject = new Map<string, string>();
  (boards || []).forEach((b) => {
    boardToProject.set(b.id, b.project_id);
  });

  const projectTaskCounts = new Map<string, { total: number; completed: number }>();
  (tasks || []).forEach((t) => {
    const projectId = boardToProject.get(t.board_id);
    if (projectId) {
      const counts = projectTaskCounts.get(projectId) || { total: 0, completed: 0 };
      counts.total++;
      if (t.status === 'done') {
        counts.completed++;
      }
      projectTaskCounts.set(projectId, counts);
    }
  });

  const enrichedProjects = (projects || []).map((p) => {
    const counts = projectTaskCounts.get(p.id) || { total: 0, completed: 0 };
    return {
      ...p,
      area: p.areas,
      task_count: counts.total,
      completed_task_count: counts.completed,
    };
  });

  return { projects: enrichedProjects };
}

export const listProjectsTool = {
  name: 'list_projects',
  description: 'List all projects with their status and progress. Optionally filter by area or status.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      area_id: {
        type: 'string',
        description: 'Filter by area ID',
      },
      status: {
        type: 'string',
        enum: ['active', 'paused', 'completed', 'archived'],
        description: 'Filter by project status',
      },
    },
  },
  handler: listProjects,
};
