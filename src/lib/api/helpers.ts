// API helper functions and types
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitHeaders, type RateLimitResult } from './rate-limiter';
import { validateApiKey } from './auth';

/**
 * Activity logging context extracted from request
 */
export interface ActivityContext {
  agentId: string | null;
  userInitiated: boolean;
}

// Standard API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Error response helper
export function errorResponse(
  message: string,
  status: number,
  headers?: Record<string, string>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { error: message },
    { status, headers }
  );
}

// Success response helper
export function successResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { data },
    { status, headers }
  );
}

// Message response helper (for operations without data to return)
export function messageResponse(
  message: string,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { message },
    { status, headers }
  );
}

// Get identifier for rate limiting (agent ID, API key, or IP)
export function getRateLimitIdentifier(request: NextRequest): string {
  // Check for API key in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7); // Return the API key as identifier
  }

  // Check for agent ID in custom header
  const agentId = request.headers.get('x-agent-id');
  if (agentId) {
    return agentId;
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Default fallback
  return 'anonymous';
}

// Apply rate limiting to a request
export function applyRateLimit(request: NextRequest): {
  result: RateLimitResult;
  headers: Record<string, string>;
} {
  const identifier = getRateLimitIdentifier(request);
  const result = checkRateLimit(identifier);
  const headers = getRateLimitHeaders(result);
  return { result, headers };
}

// Parse query parameters
export function parseQueryParams(request: NextRequest): {
  limit: number;
  offset: number;
  search?: string;
  status?: string[];
  priority?: string[];
  board_id?: string;
  milestone_id?: string;
  project_id?: string;
  area_id?: string;
  assigned_agent?: string;
  prd_id?: string;
  type?: string;
} {
  const { searchParams } = new URL(request.url);
  
  // Parse limit with default and max
  const limitStr = searchParams.get('limit');
  let limit = limitStr ? parseInt(limitStr, 10) : 50;
  if (isNaN(limit) || limit < 1) limit = 50;
  if (limit > 100) limit = 100;
  
  // Parse offset
  const offsetStr = searchParams.get('offset');
  let offset = offsetStr ? parseInt(offsetStr, 10) : 0;
  if (isNaN(offset) || offset < 0) offset = 0;
  
  // Parse comma-separated arrays
  const statusStr = searchParams.get('status');
  const status = statusStr ? statusStr.split(',').map(s => s.trim()) : undefined;
  
  const priorityStr = searchParams.get('priority');
  const priority = priorityStr ? priorityStr.split(',').map(s => s.trim()) : undefined;
  
  return {
    limit,
    offset,
    search: searchParams.get('search') || undefined,
    status,
    priority,
    board_id: searchParams.get('board_id') || undefined,
    milestone_id: searchParams.get('milestone_id') || undefined,
    project_id: searchParams.get('project_id') || undefined,
    area_id: searchParams.get('area_id') || undefined,
    assigned_agent: searchParams.get('assigned_agent') || undefined,
    prd_id: searchParams.get('prd_id') || undefined,
    type: searchParams.get('type') || undefined,
  };
}

// Validate UUID format
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Common validation errors
export const ValidationErrors = {
  INVALID_ID: 'Invalid ID format',
  MISSING_REQUIRED_FIELD: (field: string) => `Missing required field: ${field}`,
  INVALID_STATUS: (validStatuses: string[]) => `Invalid status. Valid values: ${validStatuses.join(', ')}`,
  INVALID_PRIORITY: 'Invalid priority. Valid values: low, medium, high, critical',
  INVALID_JSON: 'Invalid JSON in request body',
  NOT_FOUND: (entity: string) => `${entity} not found`,
} as const;

/**
 * Extract activity logging context from request
 * Determines if request is from agent (API key) or user (no API key)
 * Returns agent_id if authenticated, and userInitiated flag
 */
export async function extractActivityContext(request: NextRequest): Promise<ActivityContext> {
  const authHeader = request.headers.get('authorization');
  
  // If no auth header, assume user-initiated action
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      agentId: null,
      userInitiated: true,
    };
  }

  // Extract and validate API key
  const apiKey = authHeader.slice(7);
  const agent = await validateApiKey(apiKey);

  if (agent) {
    return {
      agentId: agent.id,
      userInitiated: false, // Agent-initiated action
    };
  }

  // Invalid API key - treat as user action
  return {
    agentId: null,
    userInitiated: true,
  };
}
