// PRD Task Extraction API - Extract tasks from PRD using AI
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  isValidUUID,
  ValidationErrors,
  extractActivityContext,
} from '@/lib/api';
import { logActivityServer } from '@/lib/activity-logger-server';
import { extractTasksFromPRD, estimateTotalEffort } from '@/lib/ai-task-extraction';
import type { PRDSection } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/v1/prds/[id]/extract-tasks - Extract tasks from PRD using AI
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return errorResponse('Invalid PRD ID format', 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Fetch the PRD
    const { data: prd, error: prdError } = await supabase
      .from('prds')
      .select('*')
      .eq('id', id)
      .single();

    if (prdError || !prd) {
      return errorResponse(ValidationErrors.NOT_FOUND('PRD'), 404, headers);
    }

    // Extract sections from PRD
    const sections = (prd.sections as PRDSection[] | null) || [];
    const sectionData = sections.map((s) => ({
      title: s.title,
      content: s.content,
    }));

    // Call AI to extract tasks
    const extractionResult = await extractTasksFromPRD(
      prd.title,
      prd.content || '',
      sectionData
    );

    // Calculate effort estimate
    const effortEstimate = estimateTotalEffort(extractionResult.tasks);

    // Log the extraction activity
    const activityContext = await extractActivityContext(request);
    await logActivityServer({
      entityType: 'prds',
      entityId: id,
      action: 'extract_tasks',
      payload: {
        task_count: extractionResult.tasks.length,
        total_story_points: effortEstimate.totalPoints,
      },
      ...activityContext,
    });

    return successResponse({
      prd_id: id,
      prd_title: prd.title,
      project_id: prd.project_id,
      extraction: extractionResult,
      effort_estimate: effortEstimate,
    }, 200, headers);
  } catch (err) {
    console.error('Unexpected error in POST /api/v1/prds/[id]/extract-tasks:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/prds/[id]/extract-tasks/create - Create tasks from extraction results
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { id } = await params;
    const body = await request.json() as {
      tasks: Array<{
        title: string;
        description: string;
        priority: string;
        story_points: number | null;
        suggested_column: string;
      }>;
    };

    if (!isValidUUID(id)) {
      return errorResponse('Invalid PRD ID format', 400, headers);
    }

    if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      return errorResponse('No tasks provided', 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Fetch the PRD to get project_id
    const { data: prd, error: prdError } = await supabase
      .from('prds')
      .select('id, project_id, title')
      .eq('id', id)
      .single();

    if (prdError || !prd) {
      return errorResponse(ValidationErrors.NOT_FOUND('PRD'), 404, headers);
    }

    // Get the board for this project (1:1 relationship)
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id')
      .eq('project_id', prd.project_id)
      .single();

    if (boardError || !board) {
      return errorResponse('No board found for this project', 404, headers);
    }

    // Get next positions for tasks in each column
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('column_id, position')
      .eq('board_id', board.id)
      .order('position', { ascending: false });

    const columnPositions: Record<string, number> = {};
    existingTasks?.forEach((task) => {
      if (!columnPositions[task.column_id] || task.position >= columnPositions[task.column_id]) {
        columnPositions[task.column_id] = task.position + 1;
      }
    });

    // Create tasks
    const tasksToInsert = body.tasks.map((task) => {
      const columnId = task.suggested_column === 'todo' ? 'todo' : 'backlog';
      const position = columnPositions[columnId] || 0;
      columnPositions[columnId] = position + 1;

      return {
        board_id: board.id,
        prd_id: id,
        title: task.title,
        description: task.description || null,
        priority: task.priority || 'medium',
        story_points: task.story_points,
        column_id: columnId,
        status: columnId === 'todo' ? 'todo' : 'backlog',
        position,
      };
    });

    const { data: createdTasks, error: createError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (createError) {
      console.error('Error creating tasks:', createError);
      return errorResponse('Failed to create tasks', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logActivityServer({
      entityType: 'prds',
      entityId: id,
      action: 'create_tasks_from_extraction',
      payload: {
        task_count: createdTasks.length,
        board_id: board.id,
      },
      ...activityContext,
    });

    return successResponse({
      prd_id: id,
      board_id: board.id,
      created_tasks: createdTasks,
      message: `Created ${createdTasks.length} tasks from PRD`,
    }, 201, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/prds/[id]/extract-tasks:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
