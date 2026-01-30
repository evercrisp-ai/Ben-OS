// Milestones API - GET all, POST new
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
import type { Milestone, MilestoneInsert, MilestoneStatus } from '@/types/database';

// GET /api/v1/milestones - List all milestones
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { limit, offset, search, status, project_id } = parseQueryParams(request);
    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('milestones')
      .select('*, projects!inner(title)', { count: 'exact' })
      .order('position', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status && status.length > 0) {
      query = query.in('status', status as MilestoneStatus[]);
    }
    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching milestones:', error);
      return errorResponse('Failed to fetch milestones', 500, headers);
    }

    const response: PaginatedResponse<Milestone> = {
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
    console.error('Unexpected error in GET /api/v1/milestones:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/milestones - Create new milestone
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as Partial<MilestoneInsert>;

    // Validate required fields
    if (!body.title) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('title'), 400, headers);
    }
    if (!body.project_id) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('project_id'), 400, headers);
    }
    if (!isValidUUID(body.project_id)) {
      return errorResponse('Invalid project_id format', 400, headers);
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse(ValidationErrors.INVALID_STATUS(validStatuses), 400, headers);
      }
    }

    const supabase = createServiceRoleClient();

    // Verify project exists
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.project_id)
      .single();

    if (!project) {
      return errorResponse(ValidationErrors.NOT_FOUND('Project'), 404, headers);
    }

    // Get max position
    const { data: maxPos } = await supabase
      .from('milestones')
      .select('position')
      .eq('project_id', body.project_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newMilestone: MilestoneInsert = {
      title: body.title,
      project_id: body.project_id,
      description: body.description || null,
      status: body.status || 'pending',
      target_date: body.target_date || null,
      position: (maxPos?.position ?? -1) + 1,
    };

    const { data, error } = await supabase
      .from('milestones')
      .insert(newMilestone)
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      return errorResponse('Failed to create milestone', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logCreate('milestones', data.id, {
      title: data.title,
      project_id: data.project_id,
      status: data.status,
    }, activityContext);

    return successResponse(data, 201, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/milestones:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
