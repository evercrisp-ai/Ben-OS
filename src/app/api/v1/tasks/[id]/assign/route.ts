// Tasks Assign API - PUT assign agent
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

interface AssignBody {
  agent_id: string | null;
}

// PUT /api/v1/tasks/:id/assign - Assign task to agent
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

    const body = await request.json() as AssignBody;

    // agent_id can be null to unassign, but if provided must be valid UUID
    if (body.agent_id !== null && body.agent_id !== undefined) {
      if (!isValidUUID(body.agent_id)) {
        return errorResponse('Invalid agent_id format', 400, headers);
      }
    }

    const supabase = createServiceRoleClient();

    // Check if task exists
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse(ValidationErrors.NOT_FOUND('Task'), 404, headers);
    }

    // If agent_id is provided, verify agent exists
    if (body.agent_id) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id, is_active')
        .eq('id', body.agent_id)
        .single();

      if (!agent) {
        return errorResponse(ValidationErrors.NOT_FOUND('Agent'), 404, headers);
      }

      if (!agent.is_active) {
        return errorResponse('Cannot assign to inactive agent', 400, headers);
      }
    }

    // Update the task assignment
    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_agent_id: body.agent_id || null })
      .eq('id', id)
      .select('*, agents(name)')
      .single();

    if (error) {
      console.error('Error assigning task:', error);
      return errorResponse('Failed to assign task', 500, headers);
    }

    return successResponse(data, 200, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in PUT /api/v1/tasks/:id/assign:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
