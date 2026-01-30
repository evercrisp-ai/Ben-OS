// Projects API - GET one, PUT, DELETE
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
import type { ProjectUpdate, Project } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/projects/:id - Get single project
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
      .from('projects')
      .select('*, areas(name, color)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ValidationErrors.NOT_FOUND('Project'), 404, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/projects/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// PUT /api/v1/projects/:id - Update project
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

    const body = await request.json() as Partial<ProjectUpdate>;

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['active', 'paused', 'completed', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse(ValidationErrors.INVALID_STATUS(validStatuses), 400, headers);
      }
    }

    // Validate area_id if provided
    if (body.area_id && !isValidUUID(body.area_id)) {
      return errorResponse('Invalid area_id format', 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Check if project exists (get full data for activity logging)
    const { data: existing } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Project'), 404, headers);
    }

    // Store old data for activity logging
    const oldData = { ...(existing as Project) };

    // If area_id is being changed, verify new area exists
    if (body.area_id) {
      const { data: area } = await supabase
        .from('areas')
        .select('id')
        .eq('id', body.area_id)
        .single();

      if (!area) {
        return errorResponse(ValidationErrors.NOT_FOUND('Area'), 404, headers);
      }
    }

    // Update the project
    const updateData: ProjectUpdate = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.area_id !== undefined) updateData.area_id = body.area_id;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.target_date !== undefined) updateData.target_date = body.target_date;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.position !== undefined) updateData.position = body.position;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return errorResponse('Failed to update project', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logUpdate('projects', id, oldData as Record<string, unknown>, data as Record<string, unknown>, activityContext);

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/projects/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// DELETE /api/v1/projects/:id - Delete project
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

    // Check if project exists (get data for activity logging)
    const { data: existing } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Project'), 404, headers);
    }

    // Delete the project (cascades to milestones, boards, etc.)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return errorResponse('Failed to delete project', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logDelete('projects', id, {
      title: existing.title,
      area_id: existing.area_id,
      status: existing.status,
    }, activityContext);

    return new Response(null, { status: 204, headers });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/v1/projects/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
