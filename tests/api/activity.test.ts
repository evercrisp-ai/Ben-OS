/**
 * Activity Logging Tests for Ben OS
 * Section 4.4 - Activity Logging
 *
 * Tests all activity logging functionality:
 * - 4.4.1: Mutations are logged
 * - 4.4.2: Agent ID recorded
 * - 4.4.3: User initiated flag set
 * - 4.4.4: Payload captured
 * - 4.4.5: Activity feed API works
 * - 4.4.7: Old logs cleaned up
 */

import { describe, test, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock activity_logs storage
interface MockActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  agent_id: string | null;
  user_initiated: boolean;
  action: string;
  payload: Record<string, unknown>;
  created_at: string;
  [key: string]: unknown;
}
let mockActivityLogs: MockActivityLog[] = [];

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
  const generateId = () => {
    const counter = idCounter++;
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
    let headOnly = false;

    // Use activity_logs from outer scope for that table
    const getTableData = (): MockRecord[] => {
      if (table === 'activity_logs') {
        return mockActivityLogs as MockRecord[];
      }
      return mockData[table] || [];
    };

    const setTableData = (data: MockRecord[]) => {
      if (table === 'activity_logs') {
        mockActivityLogs = data as MockActivityLog[];
      } else {
        mockData[table] = data;
      }
    };

    const query = {
      select: (_fields: string = '*', options?: { count?: string; head?: boolean }) => {
        if (options?.count === 'exact') {
          countMode = true;
        }
        if (options?.head) {
          headOnly = true;
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
      lt: (field: string, value: unknown) => {
        filters.push({ type: 'lt', args: [field, value] });
        return query;
      },
      lte: (field: string, value: unknown) => {
        filters.push({ type: 'lte', args: [field, value] });
        return query;
      },
      gte: (field: string, value: unknown) => {
        filters.push({ type: 'gte', args: [field, value] });
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
        const tableData = getTableData();

        if (insertData) {
          // Handle insert
          const newItem: MockRecord = {
            ...(insertData as MockRecord),
            id: generateId(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setTableData([...tableData, newItem] as MockRecord[]);
          result = { data: isSingle ? newItem : [newItem], error: null };
        } else if (updateData) {
          // Handle update
          const data = [...tableData] as MockRecord[];
          const matchingItems = data.filter((item) => {
            return filters.every((f) => {
              if (f.type === 'eq') return item[f.args[0] as string] === f.args[1];
              return true;
            });
          });
          if (matchingItems.length > 0) {
            const updated: MockRecord = {
              ...matchingItems[0],
              ...(updateData as MockRecord),
              updated_at: new Date().toISOString(),
            };
            const idx = data.indexOf(matchingItems[0]);
            data[idx] = updated;
            setTableData(data);
            result = { data: isSingle ? updated : [updated], error: null };
          } else {
            result = { data: null, error: { message: 'Not found' } };
          }
        } else if (deleteMode) {
          // Handle delete
          const data = [...tableData] as MockRecord[];
          const initialLength = data.length;
          const newData = data.filter((item) => {
            return !filters.every((f) => {
              if (f.type === 'eq') return item[f.args[0] as string] === f.args[1];
              if (f.type === 'lt') {
                const fieldValue = item[f.args[0] as string];
                return new Date(fieldValue as string) < new Date(f.args[1] as string);
              }
              return true;
            });
          });
          setTableData(newData);
          const deletedCount = initialLength - newData.length;
          result = {
            data: null,
            error: deletedCount > 0 ? null : { message: 'Not found' },
            count: deletedCount,
          };
        } else {
          // Handle select
          let filtered = [...tableData];

          for (const filter of filters) {
            if (filter.type === 'eq') {
              filtered = filtered.filter(
                (item) => item[filter.args[0] as string] === filter.args[1]
              );
            } else if (filter.type === 'in') {
              filtered = filtered.filter((item) =>
                (filter.args[1] as unknown[]).includes(item[filter.args[0] as string])
              );
            } else if (filter.type === 'lt') {
              filtered = filtered.filter((item) => {
                const fieldValue = item[filter.args[0] as string];
                return new Date(fieldValue as string) < new Date(filter.args[1] as string);
              });
            } else if (filter.type === 'lte') {
              filtered = filtered.filter((item) => {
                const fieldValue = item[filter.args[0] as string];
                return new Date(fieldValue as string) <= new Date(filter.args[1] as string);
              });
            } else if (filter.type === 'gte') {
              filtered = filtered.filter((item) => {
                const fieldValue = item[filter.args[0] as string];
                return new Date(fieldValue as string) >= new Date(filter.args[1] as string);
              });
            } else if (filter.type === 'ilike') {
              const pattern = (filter.args[1] as string).replace(/%/g, '.*').toLowerCase();
              filtered = filtered.filter((item) => {
                const value = item[filter.args[0] as string];
                return typeof value === 'string' && new RegExp(pattern, 'i').test(value);
              });
            }
          }

          const count = filtered.length;

          if (headOnly) {
            result = {
              data: null,
              error: null,
              count: countMode ? count : undefined,
            };
          } else {
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

// Import after mocking
import { GET as getActivity, POST as postActivity } from '@/app/api/v1/activity/route';
import { POST as postArea } from '@/app/api/v1/areas/route';
import { PUT as putArea, DELETE as deleteArea } from '@/app/api/v1/areas/[id]/route';
import { POST as postBoard } from '@/app/api/v1/boards/route';
import { POST as postTask } from '@/app/api/v1/tasks/route';
import { PUT as putTask } from '@/app/api/v1/tasks/[id]/route';
import {
  logActivityServer,
  logCreate,
  logUpdate,
  logDelete,
  calculateChanges,
  runRetentionCleanup,
  getLogsOlderThanDays,
} from '@/lib/activity-logger-server';
import { resetAllRateLimits } from '@/lib/api/rate-limiter';

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

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Helper to parse JSON response
async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

describe('4.4 Activity Logging', () => {
  beforeAll(() => {
    resetAllRateLimits();
  });

  beforeEach(() => {
    // Clear activity logs before each test
    mockActivityLogs = [];
    resetAllRateLimits();
  });

  afterAll(() => {
    resetAllRateLimits();
  });

  describe('4.4.1 Mutations are logged', () => {
    test('Create operations are logged', async () => {
      const result = await logCreate('tasks', 'test-task-id', {
        title: 'Test Task',
        status: 'backlog',
      });

      expect(result.success).toBe(true);
      expect(result.activityId).toBeDefined();

      // Check log was created
      expect(mockActivityLogs).toHaveLength(1);
      expect(mockActivityLogs[0].action).toBe('create');
      expect(mockActivityLogs[0].entity_type).toBe('tasks');
      expect(mockActivityLogs[0].entity_id).toBe('test-task-id');
    });

    test('Update operations are logged', async () => {
      const oldData = { title: 'Old Title', status: 'backlog' };
      const newData = { title: 'New Title', status: 'in_progress' };

      const result = await logUpdate('tasks', 'test-task-id', oldData, newData);

      expect(result.success).toBe(true);

      // Check log was created with changes
      expect(mockActivityLogs).toHaveLength(1);
      expect(mockActivityLogs[0].action).toBe('update');
      expect(mockActivityLogs[0].payload.changes).toBeDefined();
    });

    test('Delete operations are logged', async () => {
      const result = await logDelete('tasks', 'test-task-id', {
        title: 'Deleted Task',
      });

      expect(result.success).toBe(true);

      // Check log was created
      expect(mockActivityLogs).toHaveLength(1);
      expect(mockActivityLogs[0].action).toBe('delete');
    });

    test('No log created when no changes', async () => {
      const oldData = { title: 'Same Title', status: 'backlog' };
      const newData = { title: 'Same Title', status: 'backlog' };

      const result = await logUpdate('tasks', 'test-task-id', oldData, newData);

      expect(result.success).toBe(true);
      // No log should be created since there are no changes
      expect(mockActivityLogs).toHaveLength(0);
    });
  });

  describe('4.4.2 Agent ID recorded', () => {
    test('Agent ID is recorded when provided', async () => {
      const agentId = 'test-agent-123';

      await logActivityServer({
        entityType: 'tasks',
        entityId: 'test-task-id',
        action: 'create',
        agentId,
        userInitiated: false,
      });

      expect(mockActivityLogs[0].agent_id).toBe(agentId);
    });

    test('Agent ID is null when not provided', async () => {
      await logActivityServer({
        entityType: 'tasks',
        entityId: 'test-task-id',
        action: 'create',
      });

      expect(mockActivityLogs[0].agent_id).toBeNull();
    });
  });

  describe('4.4.3 User initiated flag set', () => {
    test('User initiated flag defaults to true', async () => {
      await logActivityServer({
        entityType: 'tasks',
        entityId: 'test-task-id',
        action: 'create',
      });

      expect(mockActivityLogs[0].user_initiated).toBe(true);
    });

    test('User initiated flag can be set to false', async () => {
      await logActivityServer({
        entityType: 'tasks',
        entityId: 'test-task-id',
        action: 'create',
        userInitiated: false,
      });

      expect(mockActivityLogs[0].user_initiated).toBe(false);
    });

    test('Agent actions have user_initiated false', async () => {
      await logCreate(
        'tasks',
        'test-task-id',
        { title: 'Agent Task' },
        { agentId: 'agent-123', userInitiated: false }
      );

      expect(mockActivityLogs[0].user_initiated).toBe(false);
      expect(mockActivityLogs[0].agent_id).toBe('agent-123');
    });
  });

  describe('4.4.4 Payload captured', () => {
    test('Create payload contains data', async () => {
      await logCreate('tasks', 'test-task-id', {
        title: 'Test Task',
        priority: 'high',
      });

      const payload = mockActivityLogs[0].payload as Record<string, unknown>;
      expect(payload.data).toBeDefined();
      expect((payload.data as Record<string, unknown>).title).toBe('Test Task');
    });

    test('Update payload contains changes', async () => {
      const oldData = { title: 'Old Title', priority: 'low' };
      const newData = { title: 'New Title', priority: 'high' };

      await logUpdate('tasks', 'test-task-id', oldData, newData);

      const payload = mockActivityLogs[0].payload as Record<string, unknown>;
      const changes = payload.changes as Record<string, { from: unknown; to: unknown }>;

      expect(changes.title).toEqual({ from: 'Old Title', to: 'New Title' });
      expect(changes.priority).toEqual({ from: 'low', to: 'high' });
    });

    test('Delete payload contains deleted data', async () => {
      await logDelete('tasks', 'test-task-id', {
        title: 'Deleted Task',
        board_id: 'board-123',
      });

      const payload = mockActivityLogs[0].payload as Record<string, unknown>;
      expect(payload.deleted).toBeDefined();
      expect((payload.deleted as Record<string, unknown>).title).toBe('Deleted Task');
    });

    test('calculateChanges excludes updated_at and created_at', () => {
      const oldData = {
        title: 'Old',
        updated_at: '2024-01-01',
        created_at: '2024-01-01',
      };
      const newData = {
        title: 'New',
        updated_at: '2024-01-02',
        created_at: '2024-01-01',
      };

      const changes = calculateChanges(oldData, newData);

      expect(changes.title).toBeDefined();
      expect(changes.updated_at).toBeUndefined();
      expect(changes.created_at).toBeUndefined();
    });
  });

  describe('4.4.5 Activity feed API works', () => {
    const taskId = '00000000-0000-0000-0000-000000000001';
    const projectId = '00000000-0000-0000-0000-000000000002';

    beforeEach(async () => {
      // Create some activity logs
      await logActivityServer({
        entityType: 'tasks',
        entityId: taskId,
        action: 'create',
        payload: { data: { title: 'Task 1' } },
      });
      await logActivityServer({
        entityType: 'projects',
        entityId: projectId,
        action: 'update',
        payload: { changes: { title: { from: 'Old', to: 'New' } } },
      });
    });

    test('GET /api/v1/activity returns activity logs', async () => {
      const request = createRequest('/api/v1/activity');
      const response = await getActivity(request);

      expect(response.status).toBe(200);

      const data = await parseResponse<{
        data: Array<{ id: string; action: string }>;
        pagination: { total: number };
      }>(response);

      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.pagination.total).toBeGreaterThan(0);
    });

    test('Activity feed supports entity_type filter', async () => {
      const request = createRequest('/api/v1/activity?entity_type=tasks');
      const response = await getActivity(request);

      expect(response.status).toBe(200);

      const data = await parseResponse<{ data: Array<{ entity_type: string }> }>(response);
      expect(data.data.every((log) => log.entity_type === 'tasks')).toBe(true);
    });

    test('Activity feed supports entity_id filter', async () => {
      const request = createRequest(`/api/v1/activity?entity_id=${taskId}`);
      const response = await getActivity(request);

      expect(response.status).toBe(200);

      const data = await parseResponse<{ data: Array<{ entity_id: string }> }>(response);
      expect(data.data.every((log) => log.entity_id === taskId)).toBe(true);
    });

    test('Activity feed validates entity_type', async () => {
      const request = createRequest('/api/v1/activity?entity_type=invalid');
      const response = await getActivity(request);

      expect(response.status).toBe(400);
    });

    test('Activity feed validates entity_id format', async () => {
      const request = createRequest('/api/v1/activity?entity_id=invalid');
      const response = await getActivity(request);

      expect(response.status).toBe(400);
    });
  });

  describe('4.4.7 Old logs cleaned up', () => {
    test('Retention cleanup removes old logs', async () => {
      // Create an old log (100 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      mockActivityLogs.push({
        id: 'old-log-1',
        entity_type: 'tasks',
        entity_id: 'old-task',
        agent_id: null,
        user_initiated: true,
        action: 'create',
        payload: {},
        created_at: oldDate.toISOString(),
      });

      // Create a recent log
      mockActivityLogs.push({
        id: 'new-log-1',
        entity_type: 'tasks',
        entity_id: 'new-task',
        agent_id: null,
        user_initiated: true,
        action: 'create',
        payload: {},
        created_at: new Date().toISOString(),
      });

      // Run cleanup with 90-day retention
      const result = await runRetentionCleanup(90);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);

      // Verify old log was deleted
      expect(mockActivityLogs).toHaveLength(1);
      expect(mockActivityLogs[0].id).toBe('new-log-1');
    });

    test('getLogsOlderThanDays returns old logs', async () => {
      // Create old and new logs
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      mockActivityLogs.push({
        id: 'old-log-1',
        entity_type: 'tasks',
        entity_id: 'old-task',
        agent_id: null,
        user_initiated: true,
        action: 'create',
        payload: {},
        created_at: oldDate.toISOString(),
      });

      mockActivityLogs.push({
        id: 'new-log-1',
        entity_type: 'tasks',
        entity_id: 'new-task',
        agent_id: null,
        user_initiated: true,
        action: 'create',
        payload: {},
        created_at: new Date().toISOString(),
      });

      const oldLogs = await getLogsOlderThanDays(90);

      expect(oldLogs).toHaveLength(1);
      expect(oldLogs[0].id).toBe('old-log-1');
    });

    test('POST /api/v1/activity with cleanup action works', async () => {
      // Create an old log
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);

      mockActivityLogs.push({
        id: 'old-log-1',
        entity_type: 'tasks',
        entity_id: 'old-task',
        agent_id: null,
        user_initiated: true,
        action: 'create',
        payload: {},
        created_at: oldDate.toISOString(),
      });

      const request = createRequest('/api/v1/activity', {
        method: 'POST',
        body: { action: 'cleanup', retention_days: 90 },
      });

      const response = await postActivity(request);

      expect(response.status).toBe(200);

      const data = await parseResponse<{ deleted_count: number }>(response);
      expect(data.deleted_count).toBe(1);
    });

    test('POST /api/v1/activity validates action', async () => {
      const request = createRequest('/api/v1/activity', {
        method: 'POST',
        body: { action: 'invalid' },
      });

      const response = await postActivity(request);
      expect(response.status).toBe(400);
    });

    test('POST /api/v1/activity validates retention_days', async () => {
      const request = createRequest('/api/v1/activity', {
        method: 'POST',
        body: { action: 'cleanup', retention_days: 500 },
      });

      const response = await postActivity(request);
      expect(response.status).toBe(400);
    });
  });
});
