// Tasks API - GET all, POST new
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  parseQueryParams,
  isValidUUID,
  ValidationErrors,
  extractActivityContext,
  type PaginatedResponse,
} from '@/lib/api';
import { logCreate } from '@/lib/activity-logger-server';
import type { Task, TaskInsert, TaskStatus, TaskPriority } from '@/types/database';

// GET /api/v1/tasks - List all tasks
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { limit, offset, search, status, priority, board_id, milestone_id, assigned_agent, prd_id } = parseQueryParams(request);
    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('tasks')
      .select('*, boards(name, project_id), milestones(title), agents(name)', { count: 'exact' })
      .order('position', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status && status.length > 0) {
      query = query.in('status', status as TaskStatus[]);
    }
    if (priority && priority.length > 0) {
      query = query.in('priority', priority as TaskPriority[]);
    }
    if (board_id) {
      query = query.eq('board_id', board_id);
    }
    if (milestone_id) {
      query = query.eq('milestone_id', milestone_id);
    }
    if (assigned_agent) {
      query = query.eq('assigned_agent_id', assigned_agent);
    }
    if (prd_id) {
      query = query.eq('prd_id', prd_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return errorResponse('Failed to fetch tasks', 500, headers);
    }

    const response: PaginatedResponse<Task> = {
      data: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/tasks:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/tasks - Create new task
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as Partial<TaskInsert>;

    // Validate required fields
    if (!body.title) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('title'), 400, headers);
    }
    if (!body.board_id) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('board_id'), 400, headers);
    }
    if (!isValidUUID(body.board_id)) {
      return errorResponse('Invalid board_id format', 400, headers);
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse(ValidationErrors.INVALID_STATUS(validStatuses), 400, headers);
      }
    }

    // Validate priority if provided
    if (body.priority) {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (!validPriorities.includes(body.priority)) {
        return errorResponse(ValidationErrors.INVALID_PRIORITY, 400, headers);
      }
    }

    // Validate optional UUID fields
    if (body.milestone_id && !isValidUUID(body.milestone_id)) {
      return errorResponse('Invalid milestone_id format', 400, headers);
    }
    if (body.prd_id && !isValidUUID(body.prd_id)) {
      return errorResponse('Invalid prd_id format', 400, headers);
    }
    if (body.assigned_agent_id && !isValidUUID(body.assigned_agent_id)) {
      return errorResponse('Invalid assigned_agent_id format', 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Verify board exists
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('id', body.board_id)
      .single();

    if (!board) {
      return errorResponse(ValidationErrors.NOT_FOUND('Board'), 404, headers);
    }

    const status = body.status || 'backlog';
    const columnId = body.column_id || status;

    // Get next position atomically using database function
    // This prevents race conditions when multiple tasks are created simultaneously
    const { data: positionResult, error: posError } = await supabase
      .rpc('get_next_task_position', {
        p_board_id: body.board_id,
        p_column_id: columnId,
      });

    if (posError) {
      console.error('Error getting next position:', posError);
      return errorResponse('Failed to calculate position', 500, headers);
    }

    const newTask: TaskInsert = {
      title: body.title,
      board_id: body.board_id,
      description: body.description || null,
      status: status,
      priority: body.priority || 'medium',
      column_id: columnId,
      milestone_id: body.milestone_id || null,
      prd_id: body.prd_id || null,
      assigned_agent_id: body.assigned_agent_id || null,
      story_points: body.story_points || null,
      ai_context: body.ai_context || {},
      due_date: body.due_date || null,
      position: positionResult ?? 0,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return errorResponse('Failed to create task', 500, headers);
    }

    // Log the activity (4.4.1, 4.4.2, 4.4.3, 4.4.4)
    const activityContext = await extractActivityContext(request);
    await logCreate('tasks', data.id, {
      title: data.title,
      board_id: data.board_id,
      status: data.status,
      priority: data.priority,
    }, activityContext);

    return successResponse(data, 201, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/tasks:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
