// get_prd tool - Returns a PRD with its sections and linked tasks
import { getSupabaseClient, PRD, Task, PRDSection, Json } from '../lib/supabase.js';

export interface GetPRDInput {
  prd_id: string;
}

export interface GetPRDOutput {
  prd: PRD & {
    project?: { id: string; title: string };
  };
  sections: PRDSection[];
  linked_tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    column_id: string;
  }>;
  progress: {
    total_tasks: number;
    completed_tasks: number;
    percentage: number;
  };
}

export async function getPRD(input: GetPRDInput): Promise<GetPRDOutput> {
  const supabase = getSupabaseClient();

  // Fetch PRD with project info
  const { data: prd, error: prdError } = await supabase
    .from('prds')
    .select(`
      *,
      projects!prds_project_id_fkey(id, title)
    `)
    .eq('id', input.prd_id)
    .single();

  if (prdError) {
    throw new Error(`Failed to get PRD: ${prdError.message}`);
  }

  if (!prd) {
    throw new Error(`PRD not found: ${input.prd_id}`);
  }

  // Fetch linked tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, status, priority, column_id')
    .eq('prd_id', input.prd_id)
    .order('position', { ascending: true });

  if (tasksError) {
    throw new Error(`Failed to get linked tasks: ${tasksError.message}`);
  }

  const linkedTasks = tasks || [];
  const completedTasks = linkedTasks.filter((t) => t.status === 'done').length;

  // Parse sections from the PRD
  const sections = (prd.sections as PRDSection[]) || [];

  return {
    prd: {
      ...prd,
      project: prd.projects,
    },
    sections,
    linked_tasks: linkedTasks,
    progress: {
      total_tasks: linkedTasks.length,
      completed_tasks: completedTasks,
      percentage: linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0,
    },
  };
}

export const getPRDTool = {
  name: 'get_prd',
  description: 'Get a Product Requirements Document (PRD) with its sections and linked tasks. Use this to understand the specification for a feature or initiative.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      prd_id: {
        type: 'string',
        description: 'The ID of the PRD to retrieve',
      },
    },
    required: ['prd_id'],
  },
  handler: getPRD,
};
