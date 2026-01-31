// PRD Upload API - Upload markdown file and create/update PRD
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  successResponse,
  isValidUUID,
  ValidationErrors,
  extractActivityContext,
} from '@/lib/api';
import { logCreate, logUpdate } from '@/lib/activity-logger-server';
import { parseMarkdownToSections } from '@/lib/prd-export';
import type { PRDSection, Json } from '@/types/database';

// POST /api/v1/prds/upload - Upload markdown file to create/update PRD
export async function POST(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('project_id') as string | null;
    const prdId = formData.get('prd_id') as string | null; // Optional: update existing PRD
    const title = formData.get('title') as string | null;

    // Validate required fields
    if (!file) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('file'), 400, headers);
    }

    if (!projectId) {
      return errorResponse(ValidationErrors.MISSING_REQUIRED_FIELD('project_id'), 400, headers);
    }

    if (!isValidUUID(projectId)) {
      return errorResponse('Invalid project_id format', 400, headers);
    }

    if (prdId && !isValidUUID(prdId)) {
      return errorResponse('Invalid prd_id format', 400, headers);
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.md') && !fileName.endsWith('.markdown')) {
      return errorResponse('Only markdown files (.md, .markdown) are supported', 400, headers);
    }

    // Read file content
    const fileContent = await file.text();

    // Parse markdown into sections
    const sections = parseMarkdownToSections(fileContent);

    // Extract title from file name or first H1 if not provided
    let prdTitle = title;
    if (!prdTitle) {
      // Try to extract title from first H1 in content
      const h1Match = fileContent.match(/^#\s+(.+)$/m);
      if (h1Match) {
        prdTitle = h1Match[1].trim();
      } else {
        // Use file name without extension
        prdTitle = fileName.replace(/\.(md|markdown)$/i, '');
      }
    }

    const supabase = createServiceRoleClient();

    // Verify project exists
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return errorResponse(ValidationErrors.NOT_FOUND('Project'), 404, headers);
    }

    const activityContext = await extractActivityContext(request);

    if (prdId) {
      // Update existing PRD - fetch full data for activity logging
      const { data: existingPRD } = await supabase
        .from('prds')
        .select('*')
        .eq('id', prdId)
        .single();

      if (!existingPRD) {
        return errorResponse(ValidationErrors.NOT_FOUND('PRD'), 404, headers);
      }

      const { data, error } = await supabase
        .from('prds')
        .update({
          title: prdTitle,
          content: fileContent,
          sections: sections as unknown as Json,
          file_path: fileName,
        })
        .eq('id', prdId)
        .select()
        .single();

      if (error) {
        console.error('Error updating PRD:', error);
        return errorResponse('Failed to update PRD', 500, headers);
      }

      await logUpdate('prds', data.id, existingPRD as Record<string, unknown>, data as Record<string, unknown>, activityContext);

      return successResponse({
        ...data,
        sections_count: sections.length,
        message: 'PRD updated from uploaded markdown file',
      }, 200, headers);
    } else {
      // Create new PRD
      const { data, error } = await supabase
        .from('prds')
        .insert({
          project_id: projectId,
          title: prdTitle,
          content: fileContent,
          sections: sections as unknown as Json,
          file_path: fileName,
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating PRD:', error);
        return errorResponse('Failed to create PRD', 500, headers);
      }

      await logCreate('prds', data.id, {
        title: data.title,
        project_id: data.project_id,
        action: 'upload_markdown',
        file_name: fileName,
      }, activityContext);

      return successResponse({
        ...data,
        sections_count: sections.length,
        message: 'PRD created from uploaded markdown file',
      }, 201, headers);
    }
  } catch (err) {
    if (err instanceof SyntaxError) {
      return errorResponse(ValidationErrors.INVALID_JSON, 400, headers);
    }
    console.error('Unexpected error in POST /api/v1/prds/upload:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}
