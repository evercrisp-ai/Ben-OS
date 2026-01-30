// Tasks API - GET one, PUT, DELETE
import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  isValidUUID,
  ValidationErrors,
  extractActivityContext,
} from '@/lib/api';
import { logUpdate, logDelete } from '@/lib/activity-logger-server';
import type { TaskUpdate, Task } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/tasks/:id - Get single task
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return errorResponse(ValidationErrors.INVALID_ID, 400, headers);
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('tasks')
      .select('*, boards(name, project_id), milestones(title), agents(name), subtasks(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ValidationErrors.NOT_FOUND('Task'), 404, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/tasks/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// PUT /api/v1/tasks/:id - Update task
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return errorResponse(ValidationErrors.INVALID_ID, 400, headers);
    }

    const body = await request.json() as Partial<TaskUpdate>;

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

    // Validate UUID fields if provided
    if (body.board_id && !isValidUUID(body.board_id)) {
      return errorResponse('Invalid board_id format', 400, headers);
    }
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

    // Check if task exists (get full data for activity logging)
    const { data: existing } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Task'), 404, headers);
    }

    // Store old data for activity logging
    const oldData = { ...(existing as Task) };

    // Build update object
    const updateData: TaskUpdate = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      updateData.column_id = body.column_id || body.status;
      // Set completed_at if status is 'done'
      if (body.status === 'done' && existing.status !== 'done') {
        updateData.completed_at = new Date().toISOString();
      } else if (body.status !== 'done') {
        updateData.completed_at = null;
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.board_id !== undefined) updateData.board_id = body.board_id;
    if (body.milestone_id !== undefined) updateData.milestone_id = body.milestone_id;
    if (body.prd_id !== undefined) updateData.prd_id = body.prd_id;
    if (body.assigned_agent_id !== undefined) updateData.assigned_agent_id = body.assigned_agent_id;
    if (body.story_points !== undefined) updateData.story_points = body.story_points;
    if (body.ai_context !== undefined) updateData.ai_context = body.ai_context;
    if (body.column_id !== undefined) updateData.column_id = body.column_id;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return errorResponse('Failed to update task', 500, headers);
    }

    // Log the activity (4.4.1, 4.4.2, 4.4.3, 4.4.4)
    const activityContext = await extractActivityContext(request);
    await logUpdate('tasks', id, oldData as Record<string, unknown>, data as Record<string, unknown>, activityContext);

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/tasks/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// DELETE /api/v1/tasks/:id - Delete task
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return errorResponse(ValidationErrors.INVALID_ID, 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Check if task exists (get data for activity logging)
    const { data: existing } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Task'), 404, headers);
    }

    // Delete the task (cascades to subtasks)
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return errorResponse('Failed to delete task', 500, headers);
    }

    // Log the activity (4.4.1, 4.4.2, 4.4.3, 4.4.4)
    const activityContext = await extractActivityContext(request);
    await logDelete('tasks', id, {
      title: existing.title,
      board_id: existing.board_id,
      status: existing.status,
    }, activityContext);

    return new Response(null, { status: 204, headers });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/v1/tasks/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
