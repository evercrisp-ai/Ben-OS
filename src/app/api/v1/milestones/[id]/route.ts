// Milestones API - GET one, PUT, DELETE
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
import type { MilestoneUpdate, Milestone } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/milestones/:id - Get single milestone
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
      .from('milestones')
      .select('*, projects(title)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ValidationErrors.NOT_FOUND('Milestone'), 404, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/milestones/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// PUT /api/v1/milestones/:id - Update milestone
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

    const body = await request.json() as Partial<MilestoneUpdate>;

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse(ValidationErrors.INVALID_STATUS(validStatuses), 400, headers);
      }
    }

    // Validate project_id if provided
    if (body.project_id && !isValidUUID(body.project_id)) {
      return errorResponse('Invalid project_id format', 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Check if milestone exists (get full data for activity logging)
    const { data: existing } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Milestone'), 404, headers);
    }

    // Store old data for activity logging
    const oldData = { ...(existing as Milestone) };

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

    // Update the milestone
    const updateData: MilestoneUpdate = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.project_id !== undefined) updateData.project_id = body.project_id;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.target_date !== undefined) updateData.target_date = body.target_date;
    if (body.position !== undefined) updateData.position = body.position;

    const { data, error } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      return errorResponse('Failed to update milestone', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logUpdate('milestones', id, oldData as Record<string, unknown>, data as Record<string, unknown>, activityContext);

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/milestones/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// DELETE /api/v1/milestones/:id - Delete milestone
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

    // Check if milestone exists (get data for activity logging)
    const { data: existing } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Milestone'), 404, headers);
    }

    // Delete the milestone
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting milestone:', error);
      return errorResponse('Failed to delete milestone', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logDelete('milestones', id, {
      title: existing.title,
      project_id: existing.project_id,
      status: existing.status,
    }, activityContext);

    return new Response(null, { status: 204, headers });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/v1/milestones/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
