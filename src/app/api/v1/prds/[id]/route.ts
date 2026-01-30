// PRDs API - GET one, PUT, DELETE
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
import type { PRDUpdate, PRD } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/prds/:id - Get single PRD with linked tasks
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
      .from('prds')
      .select('*, projects(title), tasks(id, title, status, priority)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ValidationErrors.NOT_FOUND('PRD'), 404, headers);
    }

    // Also fetch version history
    const { data: versions } = await supabase
      .from('prd_versions')
      .select('*')
      .eq('prd_id', id)
      .order('version_number', { ascending: false });

    return successResponse({ ...data, versions: versions || [] }, 200, headers);
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/prds/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// PUT /api/v1/prds/:id - Update PRD
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

    const body = await request.json() as Partial<PRDUpdate> & { create_version?: boolean };

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['draft', 'approved', 'in_progress', 'completed'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse(ValidationErrors.INVALID_STATUS(validStatuses), 400, headers);
      }
    }

    // Validate project_id if provided
    if (body.project_id && !isValidUUID(body.project_id)) {
      return errorResponse('Invalid project_id format', 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Check if PRD exists (get full data for activity logging)
    const { data: existing } = await supabase
      .from('prds')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('PRD'), 404, headers);
    }

    // Store old data for activity logging
    const oldData = { ...(existing as PRD) };

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

    // Create version if requested
    if (body.create_version) {
      // Get current max version number
      const { data: maxVersion } = await supabase
        .from('prd_versions')
        .select('version_number')
        .eq('prd_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (maxVersion?.version_number || 0) + 1;

      // Create version snapshot
      await supabase.from('prd_versions').insert({
        prd_id: id,
        version_number: nextVersion,
        title: existing.title,
        content: existing.content,
        sections: existing.sections,
        status: existing.status,
      });
    }

    // Update the PRD
    const updateData: PRDUpdate = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.project_id !== undefined) updateData.project_id = body.project_id;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.sections !== undefined) updateData.sections = body.sections;

    const { data, error } = await supabase
      .from('prds')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating PRD:', error);
      return errorResponse('Failed to update PRD', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logUpdate('prds', id, oldData as Record<string, unknown>, data as Record<string, unknown>, activityContext);

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/prds/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// DELETE /api/v1/prds/:id - Delete PRD
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

    // Check if PRD exists (get data for activity logging)
    const { data: existing } = await supabase
      .from('prds')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('PRD'), 404, headers);
    }

    // Delete version history first (due to foreign key)
    await supabase
      .from('prd_versions')
      .delete()
      .eq('prd_id', id);

    // Delete the PRD
    const { error } = await supabase
      .from('prds')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting PRD:', error);
      return errorResponse('Failed to delete PRD', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logDelete('prds', id, {
      title: existing.title,
      project_id: existing.project_id,
      status: existing.status,
    }, activityContext);

    return new Response(null, { status: 204, headers });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/v1/prds/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
