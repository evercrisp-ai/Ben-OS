// Areas API - GET all, POST new
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  parseQueryParams,
  ValidationErrors,
  extractActivityContext,
  type PaginatedResponse,
} from '@/lib/api';
import { logCreate } from '@/lib/activity-logger-server';
import type { Area, AreaInsert } from '@/types/database';

// GET /api/v1/areas - List all areas
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { limit, offset, search } = parseQueryParams(request);
    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('areas')
      .select('*', { count: 'exact' })
      .order('position', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching areas:', error);
      return errorResponse('Failed to fetch areas', 500, headers);
    }

    const response: PaginatedResponse<Area> = {
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
    console.error('Unexpected error in GET /api/v1/areas:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/areas - Create new area
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as Partial<AreaInsert>;

    // Validate required fields
    if (!body.name) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('name'), 400, headers);
    }
    if (!body.type) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('type'), 400, headers);
    }

    // Validate type
    const validTypes = ['personal', 'work', 'project', 'content', 'community', 'other'];
    if (!validTypes.includes(body.type)) {
      return errorResponse(
        `Invalid type. Valid values: ${validTypes.join(', ')}`,
        400,
        headers
      );
    }

    const supabase = createServiceRoleClient();

    // Get next position atomically using database function
    const { data: positionResult, error: posError } = await supabase
      .rpc('get_next_area_position');

    if (posError) {
      console.error('Error getting next position:', posError);
      return errorResponse('Failed to calculate position', 500, headers);
    }

    const newArea: AreaInsert = {
      name: body.name,
      type: body.type,
      color: body.color || '#6366f1',
      icon: body.icon || null,
      position: positionResult ?? 0,
    };

    const { data, error } = await supabase
      .from('areas')
      .insert(newArea)
      .select()
      .single();

    if (error) {
      console.error('Error creating area:', error);
      return errorResponse('Failed to create area', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logCreate('areas', data.id, {
      name: data.name,
      type: data.type,
    }, activityContext);

    return successResponse(data, 201, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/areas:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
