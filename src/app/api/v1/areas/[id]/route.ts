// Areas API - GET one, PUT, DELETE
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
import type { AreaUpdate, Area } from '@/types/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/areas/:id - Get single area
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
      .from('areas')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ValidationErrors.NOT_FOUND('Area'), 404, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/areas/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// PUT /api/v1/areas/:id - Update area
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

    const body = await request.json() as Partial<AreaUpdate>;

    // Validate type if provided
    if (body.type) {
      const validTypes = ['personal', 'work', 'project', 'content', 'community', 'other'];
      if (!validTypes.includes(body.type)) {
        return errorResponse(
          `Invalid type. Valid values: ${validTypes.join(', ')}`,
          400,
          headers
        );
      }
    }

    const supabase = createServiceRoleClient();

    // Check if area exists (get full data for activity logging)
    const { data: existing } = await supabase
      .from('areas')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Area'), 404, headers);
    }

    // Store old data for activity logging
    const oldData = { ...(existing as Area) };

    // Update the area
    const updateData: AreaUpdate = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.position !== undefined) updateData.position = body.position;

    const { data, error } = await supabase
      .from('areas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating area:', error);
      return errorResponse('Failed to update area', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logUpdate('areas', id, oldData as Record<string, unknown>, data as Record<string, unknown>, activityContext);

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/areas/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// DELETE /api/v1/areas/:id - Delete area
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

    // Check if area exists (get data for activity logging)
    const { data: existing } = await supabase
      .from('areas')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Area'), 404, headers);
    }

    // Delete the area (cascades to projects, etc.)
    const { error } = await supabase
      .from('areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting area:', error);
      return errorResponse('Failed to delete area', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logDelete('areas', id, {
      name: existing.name,
      type: existing.type,
    }, activityContext);

    // Return 204 No Content
    return new Response(null, { status: 204, headers });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/v1/areas/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
