// Reports API - GET all, POST generate
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  parseQueryParams,
  ValidationErrors,
  type PaginatedResponse,
} from '@/lib/api';
import type { Report, ReportInsert, ReportType, Json } from '@/types/database';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport } from '@/lib/report-generator';
import { format, parseISO } from 'date-fns';

// GET /api/v1/reports - List all reports
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { limit, offset, type } = parseQueryParams(request);
    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('reports')
      .select('*', { count: 'exact' })
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply type filter
    if (type) {
      const validTypes: ReportType[] = ['daily', 'weekly', 'monthly'];
      if (validTypes.includes(type as ReportType)) {
        query = query.eq('type', type as ReportType);
      }
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return errorResponse('Failed to fetch reports', 500, headers);
    }

    const response: PaginatedResponse<Report> = {
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
    console.error('Unexpected error in GET /api/v1/reports:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

// POST /api/v1/reports - Generate new report
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const body = await request.json() as {
      type: ReportType;
      period_start?: string;
      period_end?: string;
    };

    // Validate type
    if (!body.type) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('type'), 400, headers);
    }

    const validTypes: ReportType[] = ['daily', 'weekly', 'monthly'];
    if (!validTypes.includes(body.type)) {
      return errorResponse(`Invalid type. Valid values: ${validTypes.join(', ')}`, 400, headers);
    }

    const supabase = createServiceRoleClient();

    // Calculate period dates if not provided
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    if (body.period_start && body.period_end) {
      periodStart = new Date(body.period_start);
      periodEnd = new Date(body.period_end);
    } else {
      switch (body.type) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 1);
          periodEnd.setMilliseconds(-1);
          break;
        case 'weekly':
          // Start from Monday of current week
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          periodStart = new Date(now.getFullYear(), now.getMonth(), diff);
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 7);
          periodEnd.setMilliseconds(-1);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          periodEnd.setHours(23, 59, 59, 999);
          break;
      }
    }

    // Generate report content using the report generator
    let reportContent: Json;
    try {
      switch (body.type) {
        case 'daily':
          reportContent = JSON.parse(JSON.stringify(await generateDailyReport(periodStart)));
          break;
        case 'weekly':
          reportContent = JSON.parse(JSON.stringify(await generateWeeklyReport(periodStart, periodEnd)));
          break;
        case 'monthly':
          const monthString = format(periodStart, 'yyyy-MM');
          reportContent = JSON.parse(JSON.stringify(await generateMonthlyReport(monthString)));
          break;
        default:
          reportContent = {};
      }
    } catch (genError) {
      console.error('Error generating report content:', genError);
      // If generation fails, create empty report structure
      reportContent = {
        error: 'Failed to generate report content',
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      };
    }

    const newReport: ReportInsert = {
      type: body.type,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      content: reportContent,
    };

    const { data, error } = await supabase
      .from('reports')
      .insert(newReport)
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return errorResponse('Failed to create report', 500, headers);
    }

    return successResponse(data, 201, headers);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/reports:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
