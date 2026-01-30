/**
 * REST API Tests for Ben OS
 * Section 4.1 - REST API Endpoints
 * 
 * Tests all CRUD operations for:
 * - Areas (4.1.1)
 * - Projects (4.1.2)
 * - Milestones (4.1.3)
 * - Tasks (4.1.4)
 * - Boards (4.1.5)
 * - PRDs (4.1.6)
 * - Reports (4.1.7)
 * - Search (4.1.8)
 * - OpenAPI spec (4.1.9)
 * - Rate limiting (4.1.10)
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client for testing
vi.mock('@/lib/supabase/server', () => {
  type MockRecord = Record<string, unknown>;
  const mockData: Record<string, MockRecord[]> = {
    areas: [],
    projects: [],
    milestones: [],
    boards: [],
    tasks: [],
    subtasks: [],
    prds: [],
    prd_versions: [],
    reports: [],
    agents: [],
  };

  let idCounter = 1;
  // Generate valid UUID-like IDs for testing
  const generateId = () => {
    const counter = idCounter++;
    // Create a valid UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const hex = counter.toString(16).padStart(12, '0');
    return `00000000-0000-0000-0000-${hex}`;
  };

  const createMockQuery = (table: string) => {
    const filters: Array<{ type: string; args: unknown[] }> = [];
    let countMode = false;
    let rangeStart = 0;
    let rangeEnd = 100;
    let isSingle = false;
    let insertData: unknown = null;
    let updateData: unknown = null;
    let deleteMode = false;

    const query = {
      select: (_fields: string = '*', options?: { count?: string }) => {
        if (options?.count === 'exact') {
          countMode = true;
        }
        return query;
      },
      insert: (data: unknown) => {
        insertData = data;
        return query;
      },
      update: (data: unknown) => {
        updateData = data;
        return query;
      },
      delete: () => {
        deleteMode = true;
        return query;
      },
      eq: (field: string, value: unknown) => {
        filters.push({ type: 'eq', args: [field, value] });
        return query;
      },
      neq: (_field: string, _value: unknown) => {
        return query;
      },
      in: (field: string, values: unknown[]) => {
        filters.push({ type: 'in', args: [field, values] });
        return query;
      },
      ilike: (field: string, pattern: string) => {
        filters.push({ type: 'ilike', args: [field, pattern] });
        return query;
      },
      or: (_conditions: string) => {
        return query;
      },
      order: (_field: string, _opts?: { ascending?: boolean }) => {
        return query;
      },
      range: (start: number, end: number) => {
        rangeStart = start;
        rangeEnd = end;
        return query;
      },
      limit: (count: number) => {
        rangeEnd = rangeStart + count - 1;
        return query;
      },
      single: () => {
        isSingle = true;
        return query;
      },
      then: async (resolve: (result: unknown) => void) => {
        let result: unknown;
        
        if (insertData) {
          // Handle insert
          const newItem: MockRecord = {
            ...(insertData as MockRecord),
            id: generateId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          mockData[table] = mockData[table] || [];
          mockData[table].push(newItem);
          result = { data: isSingle ? newItem : [newItem], error: null };
        } else if (updateData) {
          // Handle update
          const matchingItems = mockData[table].filter((item) => {
            return filters.every(f => {
              if (f.type === 'eq') return item[f.args[0] as string] === f.args[1];
              return true;
            });
          });
          if (matchingItems.length > 0) {
            const updated: MockRecord = { ...matchingItems[0], ...(updateData as MockRecord), updated_at: new Date().toISOString() };
            const idx = mockData[table].indexOf(matchingItems[0]);
            mockData[table][idx] = updated;
            result = { data: isSingle ? updated : [updated], error: null };
          } else {
            result = { data: null, error: { message: 'Not found' } };
          }
        } else if (deleteMode) {
          // Handle delete
          const initialLength = mockData[table].length;
          mockData[table] = mockData[table].filter((item) => {
            return !filters.every(f => {
              if (f.type === 'eq') return item[f.args[0] as string] === f.args[1];
              return true;
            });
          });
          result = { data: null, error: initialLength !== mockData[table].length ? null : { message: 'Not found' } };
        } else {
          // Handle select
          let filtered = [...(mockData[table] || [])];
          
          for (const filter of filters) {
            if (filter.type === 'eq') {
              filtered = filtered.filter((item) => 
                item[filter.args[0] as string] === filter.args[1]
              );
            } else if (filter.type === 'in') {
              filtered = filtered.filter((item) =>
                (filter.args[1] as unknown[]).includes(item[filter.args[0] as string])
              );
            } else if (filter.type === 'ilike') {
              const pattern = (filter.args[1] as string).replace(/%/g, '.*').toLowerCase();
              filtered = filtered.filter((item) => {
                const value = item[filter.args[0] as string];
                return typeof value === 'string' && new RegExp(pattern, 'i').test(value);
              });
            }
          }
          
          const count = filtered.length;
          filtered = filtered.slice(rangeStart, rangeEnd + 1);
          
          if (isSingle) {
            result = {
              data: filtered.length > 0 ? filtered[0] : null,
              error: filtered.length === 0 ? { message: 'Not found' } : null,
              count: countMode ? count : undefined,
            };
          } else {
            result = {
              data: filtered,
              error: null,
              count: countMode ? count : undefined,
            };
          }
        }
        
        resolve(result);
      },
    };
    
    return query;
  };

  return {
    createServiceRoleClient: () => ({
      from: (table: string) => createMockQuery(table),
    }),
    createClient: async () => ({
      from: (table: string) => createMockQuery(table),
    }),
  };
});

// Import route handlers after mocking
import { GET as getAreas, POST as postArea } from '@/app/api/v1/areas/route';
import { GET as getArea, PUT as putArea, DELETE as deleteArea } from '@/app/api/v1/areas/[id]/route';
import { GET as getProjects, POST as postProject } from '@/app/api/v1/projects/route';
import { GET as getProject, PUT as putProject, DELETE as deleteProject } from '@/app/api/v1/projects/[id]/route';
import { GET as getMilestones, POST as postMilestone } from '@/app/api/v1/milestones/route';
import { GET as getMilestone, PUT as putMilestone, DELETE as deleteMilestone } from '@/app/api/v1/milestones/[id]/route';
import { GET as getTasks, POST as postTask } from '@/app/api/v1/tasks/route';
import { GET as getTask, PUT as putTask, DELETE as deleteTask } from '@/app/api/v1/tasks/[id]/route';
import { POST as postBulkTasks } from '@/app/api/v1/tasks/bulk/route';
import { PUT as putTaskStatus } from '@/app/api/v1/tasks/[id]/status/route';
import { PUT as putTaskAssign } from '@/app/api/v1/tasks/[id]/assign/route';
import { GET as getBoards, POST as postBoard } from '@/app/api/v1/boards/route';
import { GET as getBoard, PUT as putBoard, DELETE as deleteBoard } from '@/app/api/v1/boards/[id]/route';
import { GET as getPRDs, POST as postPRD } from '@/app/api/v1/prds/route';
import { GET as getPRD, PUT as putPRD, DELETE as deletePRD } from '@/app/api/v1/prds/[id]/route';
import { GET as getReports, POST as postReport } from '@/app/api/v1/reports/route';
import { GET as getReport, DELETE as deleteReport } from '@/app/api/v1/reports/[id]/route';
import { GET as getSearch } from '@/app/api/v1/search/route';
import { GET as getOpenAPI } from '@/app/api/v1/openapi.json/route';
import { resetAllRateLimits, checkRateLimit } from '@/lib/api/rate-limiter';

// Helper to create mock NextRequest
function createRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;
  
  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  return request;
}

// Helper to parse JSON response
async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

describe('4.1 REST API', () => {
  beforeAll(() => {
    resetAllRateLimits();
  });

  afterAll(() => {
    resetAllRateLimits();
  });

  describe('4.1.1 Areas API', () => {
    let createdAreaId: string;

    test('GET /api/v1/areas returns 200', async () => {
      const request = createRequest('/api/v1/areas');
      const response = await getAreas(request);
      
      expect(response.status).toBe(200);
      const data = await parseResponse<{ data: unknown[]; pagination: unknown }>(response);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
    });

    test('POST /api/v1/areas creates area and returns 201', async () => {
      const request = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'Test Area', type: 'personal' },
      });
      
      const response = await postArea(request);
      expect(response.status).toBe(201);
      
      const data = await parseResponse<{ data: { id: string; name: string; type: string } }>(response);
      expect(data.data).toHaveProperty('id');
      expect(data.data.name).toBe('Test Area');
      expect(data.data.type).toBe('personal');
      
      createdAreaId = data.data.id;
    });

    test('POST /api/v1/areas validates required fields', async () => {
      const request = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'Test' }, // Missing type
      });
      
      const response = await postArea(request);
      expect(response.status).toBe(400);
    });

    test('GET /api/v1/areas/:id returns 200', async () => {
      const request = createRequest(`/api/v1/areas/${createdAreaId}`);
      const response = await getArea(request, { params: Promise.resolve({ id: createdAreaId }) });
      
      expect(response.status).toBe(200);
      const data = await parseResponse<{ data: { id: string } }>(response);
      expect(data.data.id).toBe(createdAreaId);
    });

    test('GET /api/v1/areas/:id returns 400 for invalid UUID', async () => {
      const request = createRequest('/api/v1/areas/invalid-id');
      const response = await getArea(request, { params: Promise.resolve({ id: 'invalid-id' }) });
      
      expect(response.status).toBe(400);
    });

    test('PUT /api/v1/areas/:id updates area and returns 200', async () => {
      const request = createRequest(`/api/v1/areas/${createdAreaId}`, {
        method: 'PUT',
        body: { name: 'Updated Area' },
      });
      
      const response = await putArea(request, { params: Promise.resolve({ id: createdAreaId }) });
      expect(response.status).toBe(200);
      
      const data = await parseResponse<{ data: { name: string } }>(response);
      expect(data.data.name).toBe('Updated Area');
    });

    test('DELETE /api/v1/areas/:id returns 204', async () => {
      const request = createRequest(`/api/v1/areas/${createdAreaId}`, { method: 'DELETE' });
      const response = await deleteArea(request, { params: Promise.resolve({ id: createdAreaId }) });
      
      expect(response.status).toBe(204);
    });
  });

  describe('4.1.2 Projects API', () => {
    let areaId: string;
    let projectId: string;

    beforeAll(async () => {
      // Create an area for projects
      const request = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'Project Area', type: 'work' },
      });
      const response = await postArea(request);
      const data = await parseResponse<{ data: { id: string } }>(response);
      areaId = data.data.id;
    });

    test('GET /api/v1/projects returns 200', async () => {
      const request = createRequest('/api/v1/projects');
      const response = await getProjects(request);
      
      expect(response.status).toBe(200);
    });

    test('POST /api/v1/projects creates project and returns 201', async () => {
      const request = createRequest('/api/v1/projects', {
        method: 'POST',
        body: { title: 'Test Project', area_id: areaId },
      });
      
      const response = await postProject(request);
      expect(response.status).toBe(201);
      
      const data = await parseResponse<{ data: { id: string; title: string } }>(response);
      expect(data.data.title).toBe('Test Project');
      projectId = data.data.id;
    });

    test('GET /api/v1/projects/:id returns 200', async () => {
      const request = createRequest(`/api/v1/projects/${projectId}`);
      const response = await getProject(request, { params: Promise.resolve({ id: projectId }) });
      
      expect(response.status).toBe(200);
    });

    test('PUT /api/v1/projects/:id returns 200', async () => {
      const request = createRequest(`/api/v1/projects/${projectId}`, {
        method: 'PUT',
        body: { title: 'Updated Project', status: 'active' },
      });
      
      const response = await putProject(request, { params: Promise.resolve({ id: projectId }) });
      expect(response.status).toBe(200);
    });

    test('DELETE /api/v1/projects/:id returns 204', async () => {
      const request = createRequest(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
      const response = await deleteProject(request, { params: Promise.resolve({ id: projectId }) });
      
      expect(response.status).toBe(204);
    });
  });

  describe('4.1.3 Milestones API', () => {
    let projectId: string;
    let milestoneId: string;

    beforeAll(async () => {
      // Create area and project for milestones
      const areaRequest = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'Milestone Area', type: 'project' },
      });
      const areaResponse = await postArea(areaRequest);
      const areaData = await parseResponse<{ data: { id: string } }>(areaResponse);
      
      const projectRequest = createRequest('/api/v1/projects', {
        method: 'POST',
        body: { title: 'Milestone Project', area_id: areaData.data.id },
      });
      const projectResponse = await postProject(projectRequest);
      const projectData = await parseResponse<{ data: { id: string } }>(projectResponse);
      projectId = projectData.data.id;
    });

    test('GET /api/v1/milestones returns 200', async () => {
      const request = createRequest('/api/v1/milestones');
      const response = await getMilestones(request);
      
      expect(response.status).toBe(200);
    });

    test('POST /api/v1/milestones creates milestone', async () => {
      const request = createRequest('/api/v1/milestones', {
        method: 'POST',
        body: { title: 'Test Milestone', project_id: projectId },
      });
      
      const response = await postMilestone(request);
      expect(response.status).toBe(201);
      
      const data = await parseResponse<{ data: { id: string; title: string } }>(response);
      expect(data.data.title).toBe('Test Milestone');
      milestoneId = data.data.id;
    });

    test('GET /api/v1/milestones/:id returns 200', async () => {
      const request = createRequest(`/api/v1/milestones/${milestoneId}`);
      const response = await getMilestone(request, { params: Promise.resolve({ id: milestoneId }) });
      
      expect(response.status).toBe(200);
    });

    test('PUT /api/v1/milestones/:id returns 200', async () => {
      const request = createRequest(`/api/v1/milestones/${milestoneId}`, {
        method: 'PUT',
        body: { status: 'in_progress' },
      });
      
      const response = await putMilestone(request, { params: Promise.resolve({ id: milestoneId }) });
      expect(response.status).toBe(200);
    });

    test('DELETE /api/v1/milestones/:id returns 204', async () => {
      const request = createRequest(`/api/v1/milestones/${milestoneId}`, { method: 'DELETE' });
      const response = await deleteMilestone(request, { params: Promise.resolve({ id: milestoneId }) });
      
      expect(response.status).toBe(204);
    });
  });

  describe('4.1.4 Tasks API', () => {
    let boardId: string;
    let taskId: string;

    beforeAll(async () => {
      // Create area, project, and board for tasks
      const areaRequest = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'Task Area', type: 'work' },
      });
      const areaResponse = await postArea(areaRequest);
      const areaData = await parseResponse<{ data: { id: string } }>(areaResponse);
      
      const projectRequest = createRequest('/api/v1/projects', {
        method: 'POST',
        body: { title: 'Task Project', area_id: areaData.data.id },
      });
      const projectResponse = await postProject(projectRequest);
      const projectData = await parseResponse<{ data: { id: string } }>(projectResponse);
      
      const boardRequest = createRequest('/api/v1/boards', {
        method: 'POST',
        body: { name: 'Task Board', project_id: projectData.data.id },
      });
      const boardResponse = await postBoard(boardRequest);
      const boardData = await parseResponse<{ data: { id: string } }>(boardResponse);
      boardId = boardData.data.id;
    });

    test('GET /api/v1/tasks returns 200', async () => {
      const request = createRequest('/api/v1/tasks');
      const response = await getTasks(request);
      
      expect(response.status).toBe(200);
    });

    test('POST /api/v1/tasks creates task', async () => {
      const request = createRequest('/api/v1/tasks', {
        method: 'POST',
        body: { title: 'Test Task', board_id: boardId, priority: 'high' },
      });
      
      const response = await postTask(request);
      expect(response.status).toBe(201);
      
      const data = await parseResponse<{ data: { id: string; title: string; priority: string } }>(response);
      expect(data.data.title).toBe('Test Task');
      expect(data.data.priority).toBe('high');
      taskId = data.data.id;
    });

    test('GET /api/v1/tasks/:id returns 200', async () => {
      const request = createRequest(`/api/v1/tasks/${taskId}`);
      const response = await getTask(request, { params: Promise.resolve({ id: taskId }) });
      
      expect(response.status).toBe(200);
    });

    test('PUT /api/v1/tasks/:id returns 200', async () => {
      const request = createRequest(`/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        body: { title: 'Updated Task', status: 'in_progress' },
      });
      
      const response = await putTask(request, { params: Promise.resolve({ id: taskId }) });
      expect(response.status).toBe(200);
    });

    test('PUT /api/v1/tasks/:id/status updates status only', async () => {
      const request = createRequest(`/api/v1/tasks/${taskId}/status`, {
        method: 'PUT',
        body: { status: 'review' },
      });
      
      const response = await putTaskStatus(request, { params: Promise.resolve({ id: taskId }) });
      expect(response.status).toBe(200);
      
      const data = await parseResponse<{ data: { status: string } }>(response);
      expect(data.data.status).toBe('review');
    });

    test('PUT /api/v1/tasks/:id/assign handles assignment', async () => {
      const request = createRequest(`/api/v1/tasks/${taskId}/assign`, {
        method: 'PUT',
        body: { agent_id: null }, // Unassign
      });
      
      const response = await putTaskAssign(request, { params: Promise.resolve({ id: taskId }) });
      expect(response.status).toBe(200);
    });

    test('POST /api/v1/tasks/bulk handles bulk operations', async () => {
      const request = createRequest('/api/v1/tasks/bulk', {
        method: 'POST',
        body: {
          operations: [
            { operation: 'create', data: { title: 'Bulk Task 1', board_id: boardId } },
            { operation: 'create', data: { title: 'Bulk Task 2', board_id: boardId } },
          ],
        },
      });
      
      const response = await postBulkTasks(request);
      expect(response.status).toBe(200);
      
      const data = await parseResponse<{ data: { results: unknown[]; summary: { success: number } } }>(response);
      expect(data.data.results).toHaveLength(2);
      expect(data.data.summary.success).toBe(2);
    });

    test('DELETE /api/v1/tasks/:id returns 204', async () => {
      const request = createRequest(`/api/v1/tasks/${taskId}`, { method: 'DELETE' });
      const response = await deleteTask(request, { params: Promise.resolve({ id: taskId }) });
      
      expect(response.status).toBe(204);
    });
  });

  describe('4.1.5 Boards API', () => {
    let projectId: string;
    let boardId: string;

    beforeAll(async () => {
      // Create area and project for boards
      const areaRequest = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'Board Area', type: 'project' },
      });
      const areaResponse = await postArea(areaRequest);
      const areaData = await parseResponse<{ data: { id: string } }>(areaResponse);
      
      const projectRequest = createRequest('/api/v1/projects', {
        method: 'POST',
        body: { title: 'Board Project', area_id: areaData.data.id },
      });
      const projectResponse = await postProject(projectRequest);
      const projectData = await parseResponse<{ data: { id: string } }>(projectResponse);
      projectId = projectData.data.id;
    });

    test('GET /api/v1/boards returns 200', async () => {
      const request = createRequest('/api/v1/boards');
      const response = await getBoards(request);
      
      expect(response.status).toBe(200);
    });

    test('POST /api/v1/boards creates board', async () => {
      const request = createRequest('/api/v1/boards', {
        method: 'POST',
        body: { name: 'Test Board', project_id: projectId },
      });
      
      const response = await postBoard(request);
      expect(response.status).toBe(201);
      
      const data = await parseResponse<{ data: { id: string; name: string } }>(response);
      expect(data.data.name).toBe('Test Board');
      boardId = data.data.id;
    });

    test('GET /api/v1/boards/:id returns 200 with tasks', async () => {
      const request = createRequest(`/api/v1/boards/${boardId}`);
      const response = await getBoard(request, { params: Promise.resolve({ id: boardId }) });
      
      expect(response.status).toBe(200);
    });

    test('PUT /api/v1/boards/:id returns 200', async () => {
      const request = createRequest(`/api/v1/boards/${boardId}`, {
        method: 'PUT',
        body: { name: 'Updated Board' },
      });
      
      const response = await putBoard(request, { params: Promise.resolve({ id: boardId }) });
      expect(response.status).toBe(200);
    });

    test('DELETE /api/v1/boards/:id returns 204', async () => {
      const request = createRequest(`/api/v1/boards/${boardId}`, { method: 'DELETE' });
      const response = await deleteBoard(request, { params: Promise.resolve({ id: boardId }) });
      
      expect(response.status).toBe(204);
    });
  });

  describe('4.1.6 PRDs API', () => {
    let projectId: string;
    let prdId: string;

    beforeAll(async () => {
      // Create area and project for PRDs
      const areaRequest = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'PRD Area', type: 'content' },
      });
      const areaResponse = await postArea(areaRequest);
      const areaData = await parseResponse<{ data: { id: string } }>(areaResponse);
      
      const projectRequest = createRequest('/api/v1/projects', {
        method: 'POST',
        body: { title: 'PRD Project', area_id: areaData.data.id },
      });
      const projectResponse = await postProject(projectRequest);
      const projectData = await parseResponse<{ data: { id: string } }>(projectResponse);
      projectId = projectData.data.id;
    });

    test('GET /api/v1/prds returns 200', async () => {
      const request = createRequest('/api/v1/prds');
      const response = await getPRDs(request);
      
      expect(response.status).toBe(200);
    });

    test('POST /api/v1/prds creates PRD', async () => {
      const request = createRequest('/api/v1/prds', {
        method: 'POST',
        body: { title: 'Test PRD', project_id: projectId },
      });
      
      const response = await postPRD(request);
      expect(response.status).toBe(201);
      
      const data = await parseResponse<{ data: { id: string; title: string } }>(response);
      expect(data.data.title).toBe('Test PRD');
      prdId = data.data.id;
    });

    test('GET /api/v1/prds/:id returns 200 with versions', async () => {
      const request = createRequest(`/api/v1/prds/${prdId}`);
      const response = await getPRD(request, { params: Promise.resolve({ id: prdId }) });
      
      expect(response.status).toBe(200);
    });

    test('PUT /api/v1/prds/:id returns 200', async () => {
      const request = createRequest(`/api/v1/prds/${prdId}`, {
        method: 'PUT',
        body: { title: 'Updated PRD', status: 'approved' },
      });
      
      const response = await putPRD(request, { params: Promise.resolve({ id: prdId }) });
      expect(response.status).toBe(200);
    });

    test('DELETE /api/v1/prds/:id returns 204', async () => {
      const request = createRequest(`/api/v1/prds/${prdId}`, { method: 'DELETE' });
      const response = await deletePRD(request, { params: Promise.resolve({ id: prdId }) });
      
      expect(response.status).toBe(204);
    });
  });

  describe('4.1.7 Reports API', () => {
    let reportId: string;

    test('GET /api/v1/reports returns 200', async () => {
      const request = createRequest('/api/v1/reports');
      const response = await getReports(request);
      
      expect(response.status).toBe(200);
    });

    test('POST /api/v1/reports generates report', async () => {
      const request = createRequest('/api/v1/reports', {
        method: 'POST',
        body: { type: 'daily' },
      });
      
      const response = await postReport(request);
      expect(response.status).toBe(201);
      
      const data = await parseResponse<{ data: { id: string; type: string } }>(response);
      expect(data.data.type).toBe('daily');
      reportId = data.data.id;
    });

    test('POST /api/v1/reports validates type', async () => {
      const request = createRequest('/api/v1/reports', {
        method: 'POST',
        body: { type: 'invalid' },
      });
      
      const response = await postReport(request);
      expect(response.status).toBe(400);
    });

    test('GET /api/v1/reports/:id returns 200', async () => {
      const request = createRequest(`/api/v1/reports/${reportId}`);
      const response = await getReport(request, { params: Promise.resolve({ id: reportId }) });
      
      expect(response.status).toBe(200);
    });

    test('DELETE /api/v1/reports/:id returns 204', async () => {
      const request = createRequest(`/api/v1/reports/${reportId}`, { method: 'DELETE' });
      const response = await deleteReport(request, { params: Promise.resolve({ id: reportId }) });
      
      expect(response.status).toBe(204);
    });
  });

  describe('4.1.8 Search API', () => {
    test('GET /api/v1/search requires query', async () => {
      const request = createRequest('/api/v1/search');
      const response = await getSearch(request);
      
      expect(response.status).toBe(400);
    });

    test('GET /api/v1/search returns results', async () => {
      // First create some data to search
      const areaRequest = createRequest('/api/v1/areas', {
        method: 'POST',
        body: { name: 'Searchable Area', type: 'personal' },
      });
      await postArea(areaRequest);

      const request = createRequest('/api/v1/search?q=Searchable&types=areas,projects');
      const response = await getSearch(request);
      
      expect(response.status).toBe(200);
      const data = await parseResponse<{ query: string; results: unknown[]; counts: object }>(response);
      expect(data.query).toBe('Searchable');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('counts');
    });

    test('GET /api/v1/search validates query length', async () => {
      const request = createRequest('/api/v1/search?q=a'); // Too short
      const response = await getSearch(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('4.1.9 OpenAPI spec', () => {
    test('GET /api/v1/openapi.json returns spec', async () => {
      const request = createRequest('/api/v1/openapi.json');
      const response = await getOpenAPI(request);
      
      expect(response.status).toBe(200);
      const spec = await parseResponse<{ openapi: string; info: { version: string } }>(response);
      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info.version).toBe('1.0.0');
    });
  });

  describe('4.1.10 Rate limiting', () => {
    beforeAll(() => {
      resetAllRateLimits();
    });

    test('Rate limit allows 100 requests per minute', () => {
      const identifier = 'test-rate-limit-agent';
      
      // First 100 requests should be allowed
      for (let i = 0; i < 100; i++) {
        const result = checkRateLimit(identifier);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(100);
      }
      
      // 101st request should be denied
      const result = checkRateLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    test('Rate limit headers are returned', async () => {
      resetAllRateLimits();
      
      const request = createRequest('/api/v1/areas', {
        headers: { 'x-agent-id': 'test-agent-headers' },
      });
      const response = await getAreas(request);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.has('X-RateLimit-Remaining')).toBe(true);
      expect(response.headers.has('X-RateLimit-Reset')).toBe(true);
    });

    test('Rate limit returns 429 when exceeded', async () => {
      const agentId = 'rate-limit-test-agent-429';
      
      // Exhaust rate limit
      for (let i = 0; i < 101; i++) {
        checkRateLimit(agentId);
      }
      
      const request = createRequest('/api/v1/areas', {
        headers: { 'x-agent-id': agentId },
      });
      const response = await getAreas(request);
      
      expect(response.status).toBe(429);
    });
  });

  describe('Query Parameters', () => {
    test('List endpoints support pagination', async () => {
      const request = createRequest('/api/v1/areas?limit=10&offset=0');
      const response = await getAreas(request);
      
      expect(response.status).toBe(200);
      const data = await parseResponse<{ pagination: { limit: number; offset: number } }>(response);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(0);
    });

    test('List endpoints support status filter', async () => {
      const request = createRequest('/api/v1/projects?status=active,paused');
      const response = await getProjects(request);
      
      expect(response.status).toBe(200);
    });

    test('List endpoints support search filter', async () => {
      const request = createRequest('/api/v1/tasks?search=test');
      const response = await getTasks(request);
      
      expect(response.status).toBe(200);
    });

    test('Tasks endpoint supports priority filter', async () => {
      const request = createRequest('/api/v1/tasks?priority=high,critical');
      const response = await getTasks(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    test('Invalid JSON returns 400', async () => {
      // Create a request with invalid body by not using JSON.stringify
      const request = new NextRequest(new URL('/api/v1/areas', 'http://localhost:3000'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      });
      
      const response = await postArea(request);
      expect(response.status).toBe(400);
    });

    test('Not found returns 404', async () => {
      const request = createRequest('/api/v1/areas/00000000-0000-0000-0000-000000000000');
      const response = await getArea(request, { 
        params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) 
      });
      
      expect(response.status).toBe(404);
    });
  });
});
