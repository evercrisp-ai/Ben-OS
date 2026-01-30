// Tests for MCP Server (Section 4.3)
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('../../mcp-server/src/lib/supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));

// Helper to create mock chain for Supabase queries
function createMockQueryChain(data: unknown = null, error: unknown = null) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.lte = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data, error });
  chain.then = vi.fn().mockImplementation((resolve) => resolve({ data, error }));
  
  // Make the chain thenable
  Object.defineProperty(chain, 'then', {
    value: (resolve: (value: { data: unknown; error: unknown }) => void) => {
      return Promise.resolve({ data, error }).then(resolve);
    },
  });
  
  return chain;
}

describe('4.3 MCP Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.3.1 MCP server setup', () => {
    test('server module exports required functions', async () => {
      // Import the tools index to verify it exports all tools
      const toolsModule = await import('../../mcp-server/src/tools/index');
      
      expect(toolsModule.tools).toBeDefined();
      expect(Array.isArray(toolsModule.tools)).toBe(true);
      expect(toolsModule.tools.length).toBe(9);
      
      // Verify all tool names
      const toolNames = toolsModule.tools.map(t => t.name);
      expect(toolNames).toContain('list_projects');
      expect(toolNames).toContain('get_board');
      expect(toolNames).toContain('create_task');
      expect(toolNames).toContain('update_task');
      expect(toolNames).toContain('move_task');
      expect(toolNames).toContain('get_context');
      expect(toolNames).toContain('log_activity');
      expect(toolNames).toContain('search_tasks');
      expect(toolNames).toContain('generate_report');
    });

    test('each tool has required properties', async () => {
      const { tools } = await import('../../mcp-server/src/tools/index');
      
      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      }
    });
  });

  describe('4.3.2 list_projects tool', () => {
    test('returns projects array', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          title: 'Test Project',
          status: 'active',
          area_id: 'area-1',
          areas: { id: 'area-1', name: 'Work', color: '#ff0000' },
        },
      ];

      const projectChain = createMockQueryChain(mockProjects);
      const boardChain = createMockQueryChain([{ id: 'board-1', project_id: 'proj-1' }]);
      const taskChain = createMockQueryChain([
        { id: 'task-1', board_id: 'board-1', status: 'done' },
        { id: 'task-2', board_id: 'board-1', status: 'in_progress' },
      ]);

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'projects') return projectChain;
        if (table === 'boards') return boardChain;
        if (table === 'tasks') return taskChain;
        return createMockQueryChain([]);
      });

      const { listProjects } = await import('../../mcp-server/src/tools/list-projects');
      const result = await listProjects({});

      expect(result.projects).toBeInstanceOf(Array);
      expect(result.projects.length).toBe(1);
      expect(result.projects[0].title).toBe('Test Project');
    });

    test('filters by status', async () => {
      const projectChain = createMockQueryChain([]);
      mockSupabaseClient.from.mockReturnValue(projectChain);

      const { listProjects } = await import('../../mcp-server/src/tools/list-projects');
      await listProjects({ status: 'active' });

      expect(projectChain.eq).toHaveBeenCalledWith('status', 'active');
    });

    test('filters by area_id', async () => {
      const projectChain = createMockQueryChain([]);
      mockSupabaseClient.from.mockReturnValue(projectChain);

      const { listProjects } = await import('../../mcp-server/src/tools/list-projects');
      await listProjects({ area_id: 'area-123' });

      expect(projectChain.eq).toHaveBeenCalledWith('area_id', 'area-123');
    });
  });

  describe('4.3.3 get_board tool', () => {
    test('returns board with columns and tasks', async () => {
      const mockBoard = {
        id: 'board-1',
        name: 'Test Board',
        column_config: [
          { id: 'backlog', name: 'Backlog', position: 0 },
          { id: 'done', name: 'Done', position: 1 },
        ],
        projects: { id: 'proj-1', title: 'Test Project', status: 'active' },
      };

      const mockTasks = [
        { id: 'task-1', title: 'Task 1', board_id: 'board-1', column_id: 'backlog' },
        { id: 'task-2', title: 'Task 2', board_id: 'board-1', column_id: 'done' },
      ];

      const boardChain = createMockQueryChain(mockBoard);
      const taskChain = createMockQueryChain(mockTasks);

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'boards') return boardChain;
        if (table === 'tasks') return taskChain;
        return createMockQueryChain([]);
      });

      const { getBoard } = await import('../../mcp-server/src/tools/get-board');
      const result = await getBoard({ board_id: 'board-1' });

      expect(result.board).toBeDefined();
      expect(result.columns).toBeInstanceOf(Array);
      expect(result.columns.length).toBe(2);
      expect(result.tasks).toBeInstanceOf(Array);
      expect(result.tasks.length).toBe(2);
    });

    test('throws error for missing board', async () => {
      const boardChain = createMockQueryChain(null, { message: 'Not found' });
      mockSupabaseClient.from.mockReturnValue(boardChain);

      const { getBoard } = await import('../../mcp-server/src/tools/get-board');
      
      await expect(getBoard({ board_id: 'non-existent' })).rejects.toThrow();
    });
  });

  describe('4.3.4 create_task tool', () => {
    test('creates task with required fields', async () => {
      const mockBoard = {
        column_config: [{ id: 'backlog', name: 'Backlog', position: 0 }],
      };

      const mockCreatedTask = {
        id: 'task-new',
        title: 'MCP Created Task',
        board_id: 'board-1',
        priority: 'high',
        status: 'backlog',
        column_id: 'backlog',
        position: 0,
      };

      const boardChain = createMockQueryChain(mockBoard);
      const taskSelectChain = createMockQueryChain([]);
      const taskInsertChain = createMockQueryChain(mockCreatedTask);
      const activityChain = createMockQueryChain({});

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'boards') return boardChain;
        if (table === 'tasks') {
          // Differentiate between select (for position) and insert
          const chain = createMockQueryChain(mockCreatedTask);
          chain.select = vi.fn().mockReturnValue(taskSelectChain);
          chain.insert = vi.fn().mockReturnValue({
            ...taskInsertChain,
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockCreatedTask, error: null }),
            }),
          });
          return chain;
        }
        if (table === 'activity_logs') return activityChain;
        return createMockQueryChain([]);
      });

      const { createTask } = await import('../../mcp-server/src/tools/create-task');
      const result = await createTask({
        board_id: 'board-1',
        title: 'MCP Created Task',
        priority: 'high',
      });

      expect(result.task).toBeDefined();
      expect(result.task.id).toBe('task-new');
      expect(result.task.title).toBe('MCP Created Task');
    });
  });

  describe('4.3.5 update_task tool', () => {
    test('updates task title', async () => {
      const mockUpdatedTask = {
        id: 'task-1',
        title: 'Updated via MCP',
        status: 'in_progress',
      };

      const taskChain = createMockQueryChain(mockUpdatedTask);
      const activityChain = createMockQueryChain({});

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tasks') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockUpdatedTask, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'activity_logs') return activityChain;
        return createMockQueryChain([]);
      });

      const { updateTask } = await import('../../mcp-server/src/tools/update-task');
      const result = await updateTask({
        task_id: 'task-1',
        title: 'Updated via MCP',
      });

      expect(result.task.title).toBe('Updated via MCP');
    });
  });

  describe('4.3.6 move_task tool', () => {
    test('moves task to different column', async () => {
      const mockCurrentTask = {
        id: 'task-1',
        board_id: 'board-1',
        column_id: 'backlog',
        status: 'backlog',
      };

      const mockMovedTask = {
        ...mockCurrentTask,
        column_id: 'in_progress',
        status: 'in_progress',
      };

      // Create a chainable mock that can handle multiple .eq() calls
      const createChainableEq = (depth = 0, endWith = 'single'): unknown => {
        const obj: Record<string, unknown> = {};
        
        obj.eq = vi.fn().mockImplementation(() => createChainableEq(depth + 1, endWith));
        obj.neq = vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        });
        obj.single = vi.fn().mockResolvedValue({ data: mockCurrentTask, error: null });
        obj.select = vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockMovedTask, error: null }),
        });
        
        return obj;
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tasks') {
          return {
            select: vi.fn().mockReturnValue(createChainableEq()),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockMovedTask, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'activity_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return createMockQueryChain([]);
      });

      const { moveTask } = await import('../../mcp-server/src/tools/move-task');
      const result = await moveTask({
        task_id: 'task-1',
        column_id: 'in_progress',
      });

      expect(result.task.column_id).toBe('in_progress');
    });
  });

  describe('4.3.7 get_context tool', () => {
    test('returns task with related context', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        board_id: 'board-1',
        milestone_id: null,
        prd_id: null,
      };

      const mockBoard = {
        id: 'board-1',
        name: 'Test Board',
        project_id: 'proj-1',
      };

      const mockProject = {
        id: 'proj-1',
        title: 'Test Project',
      };

      const mockRelatedTasks = [
        { id: 'task-2', title: 'Related Task 1' },
      ];

      const mockSubtasks = [
        { id: 'sub-1', title: 'Subtask 1', completed: false, position: 0 },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tasks') {
          const chain = createMockQueryChain(mockTask);
          chain.neq = vi.fn().mockReturnValue({
            ...chain,
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockRelatedTasks, error: null }),
            }),
          });
          return chain;
        }
        if (table === 'boards') return createMockQueryChain(mockBoard);
        if (table === 'projects') return createMockQueryChain(mockProject);
        if (table === 'milestones') return createMockQueryChain(null);
        if (table === 'subtasks') return createMockQueryChain(mockSubtasks);
        if (table === 'prds') return createMockQueryChain(null);
        return createMockQueryChain([]);
      });

      const { getContext } = await import('../../mcp-server/src/tools/get-context');
      const result = await getContext({ task_id: 'task-1' });

      expect(result.task).toBeDefined();
      expect(result.project).toBeDefined();
      expect(result.related_tasks).toBeInstanceOf(Array);
    });
  });

  describe('4.3.8 log_activity tool', () => {
    test('records agent action', async () => {
      const mockActivityLog = { id: 'log-1' };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'activity_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockActivityLog, error: null }),
              }),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const { logActivity } = await import('../../mcp-server/src/tools/log-activity');
      const result = await logActivity({
        entity_type: 'tasks',
        entity_id: 'task-1',
        action: 'analyzed',
        payload: { finding: 'Needs more context' },
      });

      expect(result.success).toBe(true);
      expect(result.activity_id).toBe('log-1');
    });
  });

  describe('4.3.9 search_tasks tool', () => {
    test('finds matching tasks', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Fix authentication bug',
          description: 'Users cannot login',
          ai_context: {},
          boards: {
            id: 'board-1',
            name: 'Sprint Board',
            project_id: 'proj-1',
            projects: { id: 'proj-1', title: 'Auth Project' },
          },
        },
        {
          id: 'task-2',
          title: 'Implement password reset',
          description: 'Add authentication flow for password reset',
          ai_context: {},
          boards: {
            id: 'board-1',
            name: 'Sprint Board',
            project_id: 'proj-1',
            projects: { id: 'proj-1', title: 'Auth Project' },
          },
        },
      ];

      mockSupabaseClient.from.mockImplementation(() => {
        return createMockQueryChain(mockTasks);
      });

      const { searchTasks } = await import('../../mcp-server/src/tools/search-tasks');
      const result = await searchTasks({ query: 'authentication bug' });

      expect(result.tasks).toBeInstanceOf(Array);
      expect(result.tasks.length).toBeGreaterThan(0);
      // First result should have highest relevance (matches both terms)
      expect(result.tasks[0].title).toContain('authentication');
    });

    test('returns empty array for no matches', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Unrelated task',
          description: 'Nothing here',
          ai_context: {},
          boards: null,
        },
      ];

      mockSupabaseClient.from.mockImplementation(() => {
        return createMockQueryChain(mockTasks);
      });

      const { searchTasks } = await import('../../mcp-server/src/tools/search-tasks');
      const result = await searchTasks({ query: 'authentication bug' });

      expect(result.tasks).toBeInstanceOf(Array);
      expect(result.tasks.length).toBe(0);
    });
  });

  describe('4.3.10 generate_report tool', () => {
    test('generates daily report', async () => {
      const mockReport = {
        id: 'report-1',
        type: 'daily',
        period_start: '2026-01-30',
        period_end: '2026-01-30',
        generated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tasks') {
          return createMockQueryChain([]);
        }
        if (table === 'reports') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockReport, error: null }),
              }),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const { generateReport } = await import('../../mcp-server/src/tools/generate-report');
      const result = await generateReport({ type: 'daily' });

      expect(result.report).toBeDefined();
      expect(result.report.content).toBeDefined();
    });

    test('generates weekly report', async () => {
      const mockReport = {
        id: 'report-2',
        type: 'weekly',
        period_start: '2026-01-27',
        period_end: '2026-02-02',
        generated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tasks') return createMockQueryChain([]);
        if (table === 'milestones') return createMockQueryChain([]);
        if (table === 'reports') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockReport, error: null }),
              }),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const { generateReport } = await import('../../mcp-server/src/tools/generate-report');
      const result = await generateReport({ type: 'weekly' });

      expect(result.report).toBeDefined();
      expect(result.report.type).toBe('weekly');
    });

    test('generates monthly report', async () => {
      const mockReport = {
        id: 'report-3',
        type: 'monthly',
        period_start: '2026-01-01',
        period_end: '2026-01-31',
        generated_at: new Date().toISOString(),
      };

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'tasks') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
              // For count queries
              then: vi.fn().mockImplementation((resolve) =>
                resolve({ data: null, count: 10, error: null })
              ),
            }),
          };
        }
        if (table === 'projects') return createMockQueryChain([]);
        if (table === 'milestones') return createMockQueryChain([]);
        if (table === 'reports') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockReport, error: null }),
              }),
            }),
          };
        }
        return createMockQueryChain([]);
      });

      const { generateReport } = await import('../../mcp-server/src/tools/generate-report');
      const result = await generateReport({ type: 'monthly' });

      expect(result.report).toBeDefined();
      expect(result.report.type).toBe('monthly');
    });
  });
});

describe('MCP Tool Schema Validation', () => {
  test('all tools have valid inputSchema', async () => {
    const { tools } = await import('../../mcp-server/src/tools/index');

    for (const tool of tools) {
      // Verify schema structure
      expect(tool.inputSchema.type).toBe('object');
      expect(typeof tool.inputSchema.properties).toBe('object');

      // Verify required fields are listed in properties
      if (tool.inputSchema.required) {
        for (const requiredField of tool.inputSchema.required) {
          expect(tool.inputSchema.properties).toHaveProperty(requiredField);
        }
      }
    }
  });

  test('list_projects has correct schema', async () => {
    const { tools } = await import('../../mcp-server/src/tools/index');
    const tool = tools.find((t) => t.name === 'list_projects');

    expect(tool).toBeDefined();
    expect(tool!.inputSchema.properties.area_id).toBeDefined();
    expect(tool!.inputSchema.properties.status).toBeDefined();
    expect((tool!.inputSchema.properties.status as { enum: string[] }).enum).toEqual([
      'active', 'paused', 'completed', 'archived'
    ]);
  });

  test('create_task has correct required fields', async () => {
    const { tools } = await import('../../mcp-server/src/tools/index');
    const tool = tools.find((t) => t.name === 'create_task');

    expect(tool).toBeDefined();
    expect(tool!.inputSchema.required).toContain('board_id');
    expect(tool!.inputSchema.required).toContain('title');
  });

  test('generate_report has correct type enum', async () => {
    const { tools } = await import('../../mcp-server/src/tools/index');
    const tool = tools.find((t) => t.name === 'generate_report');

    expect(tool).toBeDefined();
    expect((tool!.inputSchema.properties.type as { enum: string[] }).enum).toEqual([
      'daily', 'weekly', 'monthly'
    ]);
  });
});
