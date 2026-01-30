// Boards API - GET all, POST new
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
import type { Board, BoardInsert, ColumnConfig } from '@/types/database';

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'backlog', name: 'Backlog', position: 0 },
  { id: 'todo', name: 'To Do', position: 1 },
  { id: 'in_progress', name: 'In Progress', position: 2 },
  { id: 'review', name: 'Review', position: 3 },
  { id: 'done', name: 'Done', position: 4 },
];

// GET /api/v1/boards - List all boards
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { limit, offset, search, project_id } = parseQueryParams(request);
    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('boards')
      .select('*, projects!inner(title)', { count: 'exact' })
      .order('position', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching boards:', error);
      return errorResponse('Failed to fetch boards', 500, headers);
    }

    const response: PaginatedResponse<Board> = {
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
    console.error('Unexpected error in GET /api/v1/boards:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/boards - Create new board
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as Partial<BoardInsert>;

    // Validate required fields
    if (!body.name) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('name'), 400, headers);
    }
    if (!body.project_id) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('project_id'), 400, headers);
    }
    if (!isValidUUID(body.project_id)) {
      return errorResponse('Invalid project_id format', 400, headers);
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
      .from('boards')
      .select('position')
      .eq('project_id', body.project_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const newBoard: BoardInsert = {
      name: body.name,
      project_id: body.project_id,
      column_config: body.column_config || DEFAULT_COLUMNS,
      position: (maxPos?.position ?? -1) + 1,
    };

    const { data, error } = await supabase
      .from('boards')
      .insert(newBoard)
      .select()
      .single();

    if (error) {
      console.error('Error creating board:', error);
      return errorResponse('Failed to create board', 500, headers);
    }

    // Log the activity
    const activityContext = await extractActivityContext(request);
    await logCreate('boards', data.id, {
      name: data.name,
      project_id: data.project_id,
    }, activityContext);

    return successResponse(data, 201, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/boards:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
