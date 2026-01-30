/**
 * Activity API - GET activity logs with filtering
 * Section 4.4.5 - Activity Feed API
 *
 * Provides access to activity logs with filtering by:
 * - entity_type: Filter by type (tasks, projects, etc.)
 * - entity_id: Filter by specific entity
 * - agent_id: Filter by agent
 * - user_initiated: Filter by user vs agent actions
 * - action: Filter by action type
 * - start_date / end_date: Date range filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  parseQueryParams,
  isValidUUID,
  type PaginatedResponse,
} from '@/lib/api';
import { runRetentionCleanup } from '@/lib/activity-logger-server';
import type { ActivityLog } from '@/types/database';

// GET /api/v1/activity - List activity logs
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { limit, offset } = parseQueryParams(request);
    const { searchParams } = new URL(request.url);

    // Extract additional query parameters
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const agentId = searchParams.get('agent_id');
    const userInitiatedParam = searchParams.get('user_initiated');
    const action = searchParams.get('action');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Validate UUIDs if provided
    if (entityId && !isValidUUID(entityId)) {
      return errorResponse('Invalid entity_id format', 400, headers);
    }
    if (agentId && !isValidUUID(agentId)) {
      return errorResponse('Invalid agent_id format', 400, headers);
    }

    // Validate entity_type if provided
    const validEntityTypes = [
      'areas',
      'projects',
      'milestones',
      'tasks',
      'subtasks',
      'boards',
      'prds',
      'agents',
      'reports',
    ];
    if (entityType && !validEntityTypes.includes(entityType)) {
      return errorResponse(
        `Invalid entity_type. Valid values: ${validEntityTypes.join(', ')}`,
        400,
        headers
      );
    }

    const supabase = createServiceRoleClient();

    // Build query with agent join
    let query = supabase
      .from('activity_logs')
      .select('*, agents(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }
    if (entityId) {
      query = query.eq('entity_id', entityId);
    }
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    if (userInitiatedParam !== null) {
      const userInitiated = userInitiatedParam === 'true';
      query = query.eq('user_initiated', userInitiated);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);
      return errorResponse('Failed to fetch activity logs', 500, headers);
    }

    const response: PaginatedResponse<ActivityLog> = {
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
    console.error('Unexpected error in GET /api/v1/activity:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/activity/cleanup - Run retention cleanup (admin only)
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as { action?: string; retention_days?: number };

    if (body.action !== 'cleanup') {
      return errorResponse('Invalid action. Use action: "cleanup"', 400, headers);
    }

    const retentionDays = body.retention_days || 90;

    if (retentionDays < 1 || retentionDays > 365) {
      return errorResponse('retention_days must be between 1 and 365', 400, headers);
    }

    // Run cleanup
    const result = await runRetentionCleanup(retentionDays);

    if (!result.success) {
      return errorResponse(`Cleanup failed: ${result.error}`, 500, headers);
    }

    return NextResponse.json(
      {
        message: `Successfully cleaned up ${result.deletedCount} activity logs older than ${retentionDays} days`,
        deleted_count: result.deletedCount,
      },
      { status: 200, headers }
    );
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/activity:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
