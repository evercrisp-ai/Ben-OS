// Boards API - GET one, PUT, DELETE
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
import type { BoardUpdate, Board } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/boards/:id - Get single board with tasks
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
      .from('boards')
      .select('*, projects(title), tasks(*, agents(name))')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ValidationErrors.NOT_FOUND('Board'), 404, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/boards/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// PUT /api/v1/boards/:id - Update board
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

    const body = await request.json() as Partial<BoardUpdate>;

    // Validate project_id if provided
    if (body.project_id && !isValidUUID(body.project_id)) {
      return errorResponse('Invalid project_id format', 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Check if board exists (get full data for activity logging)
    const { data: existing } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Board'), 404, headers);
    }

    // Store old data for activity logging
    const oldData = { ...(existing as Board) };

    // If project_id is being changed, verify new project exists
    if (body.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', body.project_id)
        .single();

      if (!project) {
        return errorResponse(ValidationErrors.NOT_FOUND('Project'), 404, headers);
      }
    }

    // Update the board
    const updateData: BoardUpdate = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.project_id !== undefined) updateData.project_id = body.project_id;
    if (body.column_config !== undefined) updateData.column_config = body.column_config;
    if (body.position !== undefined) updateData.position = body.position;

    const { data, error } = await supabase
      .from('boards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating board:', error);
      return errorResponse('Failed to update board', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logUpdate('boards', id, oldData as Record<string, unknown>, data as Record<string, unknown>, activityContext);

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/boards/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// DELETE /api/v1/boards/:id - Delete board
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

    // Check if board exists (get data for activity logging)
    const { data: existing } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Board'), 404, headers);
    }

    // Delete the board (cascades to tasks)
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting board:', error);
      return errorResponse('Failed to delete board', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logDelete('boards', id, {
      name: existing.name,
      project_id: existing.project_id,
    }, activityContext);

    return new Response(null, { status: 204, headers });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/v1/boards/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
