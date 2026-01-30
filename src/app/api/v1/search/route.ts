// Search API - Full-text search across entities
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  applyRateLimit,
  errorResponse,
  sanitizeSearchQuery,
} from '@/lib/api';

interface SearchResult {
  type: 'area' | 'project' | 'milestone' | 'task' | 'prd' | 'board';
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  parent?: {
    type: string;
    id: string;
    title: string;
  };
  score: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  counts: {
    areas: number;
    projects: number;
    milestones: number;
    tasks: number;
    prds: number;
    boards: number;
    total: number;
  };
}

// GET /api/v1/search - Full-text search across all entities
export async function GET(request: NextRequest) {
  const { result, headers } = applyRateLimit(request);
  if (!result.allowed) {
    return errorResponse('Rate limit exceeded', 429, headers);
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('search') || '';
    const typesParam = searchParams.get('types');
    const limitParam = searchParams.get('limit');
    
    if (!query || query.trim().length === 0) {
      return errorResponse('Search query (q) is required', 400, headers);
    }

    if (query.length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400, headers);
    }

    // Sanitize search query to prevent LIKE pattern injection
    const searchQuery = sanitizeSearchQuery(query.trim());
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;
    
    // Parse types to search
    const validTypes = ['areas', 'projects', 'milestones', 'tasks', 'prds', 'boards'];
    const typesToSearch = typesParam
      ? typesParam.split(',').filter(t => validTypes.includes(t.trim()))
      : validTypes;

    const supabase = createServiceRoleClient();
    const results: SearchResult[] = [];
    const counts = {
      areas: 0,
      projects: 0,
      milestones: 0,
      tasks: 0,
      prds: 0,
      boards: 0,
      total: 0,
    };

    // Search areas
    if (typesToSearch.includes('areas')) {
      const { data: areas, count } = await supabase
        .from('areas')
        .select('id, name, type', { count: 'exact' })
        .ilike('name', `%${searchQuery}%`)
        .limit(limit);

      counts.areas = count || 0;
      if (areas) {
        results.push(
          ...areas.map((area) => ({
            type: 'area' as const,
            id: area.id,
            title: area.name,
            status: area.type,
            score: calculateScore(area.name, searchQuery),
          }))
        );
      }
    }

    // Search projects
    if (typesToSearch.includes('projects')) {
      const { data: projects, count } = await supabase
        .from('projects')
        .select('id, title, description, status, areas(id, name)', { count: 'exact' })
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(limit);

      counts.projects = count || 0;
      if (projects) {
        results.push(
          ...projects.map((project) => ({
            type: 'project' as const,
            id: project.id,
            title: project.title,
            description: project.description,
            status: project.status,
            parent: project.areas ? {
              type: 'area',
              id: (project.areas as { id: string; name: string }).id,
              title: (project.areas as { id: string; name: string }).name,
            } : undefined,
            score: calculateScore(project.title, searchQuery),
          }))
        );
      }
    }

    // Search milestones
    if (typesToSearch.includes('milestones')) {
      const { data: milestones, count } = await supabase
        .from('milestones')
        .select('id, title, description, status, projects(id, title)', { count: 'exact' })
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(limit);

      counts.milestones = count || 0;
      if (milestones) {
        results.push(
          ...milestones.map((milestone) => ({
            type: 'milestone' as const,
            id: milestone.id,
            title: milestone.title,
            description: milestone.description,
            status: milestone.status,
            parent: milestone.projects ? {
              type: 'project',
              id: (milestone.projects as { id: string; title: string }).id,
              title: (milestone.projects as { id: string; title: string }).title,
            } : undefined,
            score: calculateScore(milestone.title, searchQuery),
          }))
        );
      }
    }

    // Search tasks
    if (typesToSearch.includes('tasks')) {
      const { data: tasks, count } = await supabase
        .from('tasks')
        .select('id, title, description, status, priority, boards(id, name)', { count: 'exact' })
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(limit);

      counts.tasks = count || 0;
      if (tasks) {
        results.push(
          ...tasks.map((task) => ({
            type: 'task' as const,
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            parent: task.boards ? {
              type: 'board',
              id: (task.boards as { id: string; name: string }).id,
              title: (task.boards as { id: string; name: string }).name,
            } : undefined,
            score: calculateScore(task.title, searchQuery),
          }))
        );
      }
    }

    // Search PRDs
    if (typesToSearch.includes('prds')) {
      const { data: prds, count } = await supabase
        .from('prds')
        .select('id, title, content, status, projects(id, title)', { count: 'exact' })
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .limit(limit);

      counts.prds = count || 0;
      if (prds) {
        results.push(
          ...prds.map((prd) => ({
            type: 'prd' as const,
            id: prd.id,
            title: prd.title,
            description: prd.content,
            status: prd.status,
            parent: prd.projects ? {
              type: 'project',
              id: (prd.projects as { id: string; title: string }).id,
              title: (prd.projects as { id: string; title: string }).title,
            } : undefined,
            score: calculateScore(prd.title, searchQuery),
          }))
        );
      }
    }

    // Search boards
    if (typesToSearch.includes('boards')) {
      const { data: boards, count } = await supabase
        .from('boards')
        .select('id, name, projects(id, title)', { count: 'exact' })
        .ilike('name', `%${searchQuery}%`)
        .limit(limit);

      counts.boards = count || 0;
      if (boards) {
        results.push(
          ...boards.map((board) => ({
            type: 'board' as const,
            id: board.id,
            title: board.name,
            parent: board.projects ? {
              type: 'project',
              id: (board.projects as { id: string; title: string }).id,
              title: (board.projects as { id: string; title: string }).title,
            } : undefined,
            score: calculateScore(board.name, searchQuery),
          }))
        );
      }
    }

    // Calculate total count
    counts.total = counts.areas + counts.projects + counts.milestones + 
                   counts.tasks + counts.prds + counts.boards;

    // Sort results by score (highest first) and limit
    results.sort((a, b) => b.score - a.score);
    const limitedResults = results.slice(0, limit);

    const response: SearchResponse = {
      query: searchQuery,
      results: limitedResults,
      counts,
    };

    return NextResponse.json(response, { status: 200, headers });
  } catch (err) {
    console.error('Unexpected error in GET /api/v1/search:', err);
    return errorResponse('Internal server error', 500, headers);
  }
}

/**
 * Calculate a relevance score for search results
 * Higher score = more relevant
 */
function calculateScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match gets highest score
  if (lowerText === lowerQuery) {
    return 100;
  }

  // Starts with query
  if (lowerText.startsWith(lowerQuery)) {
    return 90;
  }

  // Contains query as a word
  const words = lowerText.split(/\s+/);
  if (words.some(word => word === lowerQuery)) {
    return 80;
  }

  // Contains query at word boundary
  if (words.some(word => word.startsWith(lowerQuery))) {
    return 70;
  }

  // Contains query anywhere
  if (lowerText.includes(lowerQuery)) {
    return 60;
  }

  // Default score
  return 50;
}
