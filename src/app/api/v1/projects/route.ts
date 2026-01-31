// Projects API - GET all, POST new
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
import type { Project, ProjectInsert, ProjectStatus } from '@/types/database';

// GET /api/v1/projects - List all projects
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { limit, offset, search, status, area_id } = parseQueryParams(request);
    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('projects')
      .select('*, areas!inner(name, color)', { count: 'exact' })
      .order('position', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status && status.length > 0) {
      query = query.in('status', status as ProjectStatus[]);
    }
    if (area_id) {
      query = query.eq('area_id', area_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return errorResponse('Failed to fetch projects', 500, headers);
    }

    const response: PaginatedResponse<Project> = {
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
    console.error('Unexpected error in GET /api/v1/projects:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/projects - Create new project
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as Partial<ProjectInsert>;

    // Validate required fields
    if (!body.title) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('title'), 400, headers);
    }
    if (!body.area_id) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('area_id'), 400, headers);
    }
    if (!isValidUUID(body.area_id)) {
      return errorResponse('Invalid area_id format', 400, headers);
    }

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['active', 'paused', 'completed', 'archived'];
      if (!validStatuses.includes(body.status)) {
        return errorResponse(ValidationErrors.INVALID_STATUS(validStatuses), 400, headers);
      }
    }

    const supabase = createServiceRoleClient();

    // Verify area exists
    const { data: area } = await supabase
      .from('areas')
      .select('id')
      .eq('id', body.area_id)
      .single();

    if (!area) {
      return errorResponse(ValidationErrors.NOT_FOUND('Area'), 404, headers);
    }

    // Get next position atomically using database function
    const { data: positionResult, error: posError } = await supabase
      .rpc('get_next_project_position', {
        p_area_id: body.area_id,
      });

    if (posError) {
      console.error('Error getting next position:', posError);
      return errorResponse('Failed to calculate position', 500, headers);
    }

    const newProject: ProjectInsert = {
      title: body.title,
      area_id: body.area_id,
      description: body.description || null,
      status: body.status || 'active',
      target_date: body.target_date || null,
      metadata: body.metadata || {},
      position: positionResult ?? 0,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return errorResponse('Failed to create project', 500, headers);
    }

    // Fetch the auto-created board (created by database trigger)
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('project_id', data.id)
      .single();

    if (boardError) {
      console.error('Error fetching auto-created board:', boardError);
      // Don't fail the request, board might be created async
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logCreate('projects', data.id, {
      title: data.title,
      area_id: data.area_id,
      status: data.status,
    }, activityContext);

    // Return project with its board
    return successResponse({ ...data, board: board || null }, 201, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/projects:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
