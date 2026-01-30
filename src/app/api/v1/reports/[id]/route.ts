// Reports API - GET one
import { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  isValidUUID,
  ValidationErrors,
} from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/reports/:id - Get single report
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
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ValidationErrors.NOT_FOUND('Report'), 404, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/reports/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// DELETE /api/v1/reports/:id - Delete report
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

    // Check if report exists
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Report'), 404, headers);
    }

    // Delete the report
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting report:', error);
      return errorResponse('Failed to delete report', 500, headers);
    }

    return new Response(null, { status: 204, headers });
  } catch (err) {
    console.error('Unexpected error in DELETE /api/v1/reports/:id:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
