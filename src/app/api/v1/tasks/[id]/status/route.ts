// Tasks Status API - PUT status only
import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  isValidUUID,
  ValidationErrors,
} from '@/lib/api';
import type { TaskStatus } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface StatusUpdateBody {
  status: TaskStatus;
}

// PUT /api/v1/tasks/:id/status - Update task status only
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

    const body = await request.json() as StatusUpdateBody;

    // Validate status
    if (!body.status) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('status'), 400, headers);
    }

    const validStatuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(body.status)) {
      return errorResponse(ValidationErrors.INVALID_STATUS(validStatuses), 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Check if task exists and get current status
    const { data: existing } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Task'), 404, headers);
    }

    // Build update object
    const updateData: {
      status: TaskStatus;
      column_id: string;
      completed_at: string | null;
    } = {
      status: body.status,
      column_id: body.status,
      completed_at: null,
    };

    // Set completed_at if status is 'done'
    if (body.status === 'done' && existing.status !== 'done') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task status:', error);
      return errorResponse('Failed to update task status', 500, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/tasks/:id/status:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
