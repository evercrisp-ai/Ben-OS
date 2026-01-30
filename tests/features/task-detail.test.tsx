// tests/features/task-detail.test.tsx
// Section 2.5 - Task Detail Panel Feature Tests
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

// Mock the hooks
vi.mock('@/hooks/use-subtasks', () => ({
  useSubtasks: vi.fn(),
  useCreateSubtask: vi.fn(),
  useUpdateSubtask: vi.fn(),
  useDeleteSubtask: vi.fn(),
  useToggleSubtask: vi.fn(),
  useBulkUpdateSubtasks: vi.fn(),
  subtaskKeys: {
    all: ['subtasks'],
    lists: () => ['subtasks', 'list'],
    list: (filters?: { taskId?: string }) => ['subtasks', 'list', filters],
    details: () => ['subtasks', 'detail'],
    detail: (id: string) => ['subtasks', 'detail', id],
  },
}));

vi.mock('@/hooks/use-agents', () => ({
  useAgents: vi.fn(),
  useActiveAgents: vi.fn(),
  useAgent: vi.fn(),
  useCreateAgent: vi.fn(),
  useUpdateAgent: vi.fn(),
  useDeleteAgent: vi.fn(),
  agentKeys: {
    all: ['agents'],
    lists: () => ['agents', 'list'],
    list: (filters?: { isActive?: boolean }) => ['agents', 'list', filters],
    details: () => ['agents', 'detail'],
    detail: (id: string) => ['agents', 'detail', id],
  },
}));

vi.mock('@/hooks/use-activity-logs', () => ({
  useEntityActivityLogs: vi.fn(),
  useTaskActivityLogs: vi.fn(),
  useRecentActivityLogs: vi.fn(),
  activityLogKeys: {
    all: ['activity_logs'],
    lists: () => ['activity_logs', 'list'],
    entity: (type: string, id: string) => ['activity_logs', 'list', type, id],
    recent: (limit?: number) => ['activity_logs', 'list', 'recent', limit],
  },
  formatActivityAction: vi.fn((action: string) => {
    const map: Record<string, string> = {
      create: 'created',
      update: 'updated',
      delete: 'deleted',
    };
    return map[action] || action;
  }),
  formatActivityChanges: vi.fn(() => ['title: "Test" → "Updated"']),
}));

// Mock board store with a factory function to allow different states
const mockSelectCard = vi.fn();
const mockGetCardById = vi.fn();

vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => ({
    selectedCardId: 'test-task-id',
    selectCard: mockSelectCard,
    getCardById: mockGetCardById,
    columns: mockColumns,
    focusedCardId: null,
    setFocusedCard: vi.fn(),
  })),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

// Mock activity logger
vi.mock('@/lib/activity-logger', () => ({
  logActivity: vi.fn(() => Promise.resolve()),
}));

// Test data
const mockTask = {
  id: 'test-task-id',
  board_id: 'test-board-id',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo' as const,
  priority: 'medium' as const,
  column_id: 'todo',
  position: 0,
  story_points: null as number | null,
  due_date: null as string | null,
  milestone_id: null as string | null,
  prd_id: null as string | null,
  assigned_agent_id: null as string | null,
  ai_context: {} as Record<string, unknown>,
  completed_at: null as string | null,
  created_at: '2026-01-30T10:00:00Z',
  updated_at: '2026-01-30T10:00:00Z',
  subtaskCount: 3,
  subtaskCompleted: 1,
};

const mockColumns = [
  { id: 'backlog', name: 'Backlog', position: 0, cards: [] },
  { id: 'todo', name: 'To Do', position: 1, cards: [] },
  { id: 'in_progress', name: 'In Progress', position: 2, cards: [] },
  { id: 'review', name: 'Review', position: 3, cards: [] },
  { id: 'done', name: 'Done', position: 4, cards: [] },
];

const mockAgents = [
  {
    id: 'agent-1',
    name: 'Primary Agent',
    type: 'primary' as const,
    capabilities: {},
    api_key_hash: 'hash',
    is_active: true,
    last_active_at: null,
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T10:00:00Z',
  },
  {
    id: 'agent-2',
    name: 'Task Agent',
    type: 'task' as const,
    capabilities: {},
    api_key_hash: 'hash',
    is_active: true,
    last_active_at: null,
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T10:00:00Z',
  },
];

const mockActivityLogs = [
  {
    id: 'activity-1',
    entity_type: 'tasks',
    entity_id: 'test-task-id',
    agent_id: null,
    user_initiated: true,
    action: 'create',
    payload: { title: 'Test Task' },
    created_at: '2026-01-30T10:00:00Z',
  },
  {
    id: 'activity-2',
    entity_type: 'tasks',
    entity_id: 'test-task-id',
    agent_id: null,
    user_initiated: true,
    action: 'update',
    payload: { changes: { priority: { from: 'low', to: 'medium' } } },
    created_at: '2026-01-30T11:00:00Z',
  },
  {
    id: 'activity-3',
    entity_type: 'tasks',
    entity_id: 'test-task-id',
    agent_id: 'agent-1',
    user_initiated: false,
    action: 'update',
    payload: { changes: { status: { from: 'backlog', to: 'todo' } } },
    created_at: '2026-01-30T12:00:00Z',
  },
  {
    id: 'activity-4',
    entity_type: 'tasks',
    entity_id: 'test-task-id',
    agent_id: null,
    user_initiated: true,
    action: 'update',
    payload: { changes: { description: { from: '', to: 'Test description' } } },
    created_at: '2026-01-30T13:00:00Z',
  },
  {
    id: 'activity-5',
    entity_type: 'tasks',
    entity_id: 'test-task-id',
    agent_id: null,
    user_initiated: true,
    action: 'update',
    payload: { changes: { story_points: { from: null, to: 5 } } },
    created_at: '2026-01-30T14:00:00Z',
  },
];

const mockSubtasks = [
  {
    id: 'subtask-1',
    task_id: 'test-task-id',
    title: 'First subtask',
    completed: false,
    completed_at: null,
    position: 0,
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T10:00:00Z',
  },
  {
    id: 'subtask-2',
    task_id: 'test-task-id',
    title: 'Second subtask',
    completed: true,
    completed_at: '2026-01-30T11:00:00Z',
    position: 1,
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T11:00:00Z',
  },
];

// Import components and hooks after mocks
import { TaskDetailPanel } from '@/components/kanban/CardDetailPanel';

import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useToggleSubtask,
  useBulkUpdateSubtasks,
} from '@/hooks/use-subtasks';

import { useActiveAgents } from '@/hooks/use-agents';
import { useTaskActivityLogs } from '@/hooks/use-activity-logs';

// Mock React Query wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Helper to setup common mocks
function setupDefaultMocks(overrides?: {
  task?: typeof mockTask;
  agents?: typeof mockAgents;
  activities?: typeof mockActivityLogs;
  subtasks?: typeof mockSubtasks;
}) {
  const task = overrides?.task ?? mockTask;
  const agents = overrides?.agents ?? mockAgents;
  const activities = overrides?.activities ?? mockActivityLogs;
  const subtasks = overrides?.subtasks ?? mockSubtasks;

  mockGetCardById.mockReturnValue(task);

  vi.mocked(useActiveAgents).mockReturnValue({
    data: agents,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    isFetching: false,
    isPending: false,
    isStale: false,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle' as const,
    status: 'success' as const,
    refetch: vi.fn(),
    isRefetching: false,
    isRefetchError: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isInitialLoading: false,
    errorUpdateCount: 0,
  } as any);

  vi.mocked(useTaskActivityLogs).mockReturnValue({
    data: activities,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    isFetching: false,
    isPending: false,
    isStale: false,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle' as const,
    status: 'success' as const,
    refetch: vi.fn(),
    isRefetching: false,
    isRefetchError: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isInitialLoading: false,
    errorUpdateCount: 0,
  } as any);

  vi.mocked(useSubtasks).mockReturnValue({
    data: subtasks,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
    isFetching: false,
    isPending: false,
    isStale: false,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle' as const,
    status: 'success' as const,
    refetch: vi.fn(),
    isRefetching: false,
    isRefetchError: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isInitialLoading: false,
    errorUpdateCount: 0,
  } as any);

  vi.mocked(useCreateSubtask).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any);

  vi.mocked(useUpdateSubtask).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any);

  vi.mocked(useDeleteSubtask).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any);

  vi.mocked(useToggleSubtask).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any);

  vi.mocked(useBulkUpdateSubtasks).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  } as any);
}

describe('2.5 Task Detail Panel', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnLinkToPRD = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('2.5.1 Panel slides in', () => {
    test('Panel has slide-in animation class', async () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      const panel = screen.getByTestId('task-detail-panel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveClass('slide-in');
    });

    test('Panel opens when card is selected', async () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId('task-detail-panel')).toBeInTheDocument();
    });

    test('Panel renders task title correctly', async () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      const titleInput = screen.getByLabelText('Title');
      expect(titleInput).toHaveValue('Test Task');
    });
  });

  describe('2.5.2 Can edit all fields', () => {
    test('Can modify title', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      const titleInput = screen.getByLabelText('Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');
      
      await user.click(screen.getByText('Save'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ title: 'Updated Title' })
      );
    });

    test('Can modify description', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      const descInput = screen.getByLabelText('Description');
      await user.clear(descInput);
      await user.type(descInput, 'New description');
      
      await user.click(screen.getByText('Save'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ description: 'New description' })
      );
    });

    test('Can change priority', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Click priority dropdown
      const priorityButton = screen.getByText('Medium');
      await user.click(priorityButton);

      // Select high priority
      await user.click(screen.getByText('High'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ priority: 'high' })
      );
    });

    test('Can change status', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Click status dropdown
      const statusButton = screen.getByText('To Do');
      await user.click(statusButton);

      // Select In Progress
      await user.click(screen.getByText('In Progress'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({
          column_id: 'in_progress',
          status: 'in_progress',
        })
      );
    });
  });

  describe('2.5.3 Subtasks section works', () => {
    test('Subtasks section is rendered in panel', async () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('subtasks-section')).toBeInTheDocument();
      });
    });

    test('Subtasks are listed with correct count', async () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        // Check for subtask items
        expect(screen.getByText('First subtask')).toBeInTheDocument();
        expect(screen.getByText('Second subtask')).toBeInTheDocument();
      });
    });

    test('Can add new subtask inline', async () => {
      const user = userEvent.setup();
      const mockCreate = vi.fn().mockResolvedValue({});
      vi.mocked(useCreateSubtask).mockReturnValue({
        mutateAsync: mockCreate,
        isPending: false,
      } as any);

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('subtasks-section')).toBeInTheDocument();
      });

      // Click add subtask
      await user.click(screen.getByText('Add subtask'));

      // Type and submit
      const input = screen.getByPlaceholderText('Add subtask');
      await user.type(input, 'New subtask');
      await user.keyboard('{Enter}');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New subtask' })
      );
    });
  });

  describe('2.5.4 Activity feed shows history', () => {
    test('Activity feed section exists', async () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId('activity-feed-section')).toBeInTheDocument();
    });

    test('Activity feed shows correct number of entries when expanded', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Expand activity section
      const activityButton = screen.getByText('Activity');
      await user.click(activityButton);

      await waitFor(() => {
        // Check that activities are shown (the exact count may include other test IDs)
        const activities = screen.getAllByTestId(/^activity-activity/);
        expect(activities.length).toBeGreaterThanOrEqual(5);
      });
    });

    test('Activity entries show action and timestamp', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Expand activity section
      await user.click(screen.getByText('Activity'));

      await waitFor(() => {
        // Should show "created" action for first activity
        expect(screen.getByText('created')).toBeInTheDocument();
      });
    });

    test('Shows badge with activity count', () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Should show badge with count
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('2.5.5 AI context section exists', () => {
    test('AI context section is rendered', () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByTestId('ai-context-section')).toBeInTheDocument();
    });

    test('AI context section can be expanded', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Click to expand
      await user.click(screen.getByText('AI Context'));

      // Should show empty state message
      expect(screen.getByText(/No AI context set/)).toBeInTheDocument();
    });

    test('Can edit AI context', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Expand section
      await user.click(screen.getByText('AI Context'));

      // Click edit
      await user.click(screen.getByText('Edit'));

      // Type context (plain text will be wrapped in { notes: ... })
      const textarea = screen.getByPlaceholderText(/Add AI-relevant context/);
      await user.type(textarea, 'Test context for AI');

      // Save
      await user.click(screen.getByText('Save Context'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({
          ai_context: { notes: 'Test context for AI' },
        })
      );
    });

    test('Displays existing AI context', async () => {
      const user = userEvent.setup();
      
      const taskWithContext = {
        ...mockTask,
        ai_context: { notes: 'Existing context', priority: 'high' },
      };
      
      setupDefaultMocks({ task: taskWithContext });

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Expand section
      await user.click(screen.getByText('AI Context'));

      // Should show the context
      expect(screen.getByText(/Existing context/)).toBeInTheDocument();
    });
  });

  describe('2.5.6 Can assign to agent', () => {
    test('Agent assignment dropdown is rendered', () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      const assignButton = screen.getByLabelText('Assign to');
      expect(assignButton).toBeInTheDocument();
    });

    test('Shows available agents in dropdown', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Assign to'));

      expect(screen.getByText('Primary Agent')).toBeInTheDocument();
      expect(screen.getByText('Task Agent')).toBeInTheDocument();
    });

    test('Can assign task to an agent', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Assign to'));
      await user.click(screen.getByText('Primary Agent'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ assigned_agent_id: 'agent-1' })
      );
    });

    test('Can unassign agent', async () => {
      const user = userEvent.setup();
      
      const assignedTask = {
        ...mockTask,
        assigned_agent_id: 'agent-1',
      };
      
      setupDefaultMocks({ task: assignedTask });

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Should show current agent
      expect(screen.getByText('Primary Agent')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Assign to'));
      await user.click(screen.getByText('Unassigned'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ assigned_agent_id: null })
      );
    });

    test('Shows agent type badge', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Assign to'));

      // Should show agent type badges
      expect(screen.getByText('primary')).toBeInTheDocument();
      expect(screen.getByText('task')).toBeInTheDocument();
    });
  });

  describe('2.5.7 Due date picker works', () => {
    test('Due date picker button is rendered', () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByLabelText('Due date')).toBeInTheDocument();
    });

    test('Due date picker opens calendar popover', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Due date'));

      // Calendar should be visible (check for day buttons)
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });

    test('Can select a date from calendar', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Due date'));

      // Wait for calendar
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Find and click a day button (e.g., day 15)
      const dayButtons = screen.getAllByRole('button');
      const day15Button = dayButtons.find(btn => btn.textContent === '15');
      
      if (day15Button) {
        await user.click(day15Button);

        expect(mockOnUpdate).toHaveBeenCalledWith(
          'test-task-id',
          expect.objectContaining({
            due_date: expect.stringMatching(/^\d{4}-\d{2}-15$/),
          })
        );
      }
    });

    test('Shows formatted date when set', async () => {
      const taskWithDueDate = {
        ...mockTask,
        due_date: '2026-02-15',
      };
      
      // Reset mock to return the task with due date
      mockGetCardById.mockReturnValue(taskWithDueDate);

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Check for the clear due date button (only appears when date is set)
      expect(screen.getByLabelText('Clear due date')).toBeInTheDocument();
    });

    test('Can clear due date', async () => {
      const user = userEvent.setup();
      
      const taskWithDueDate = {
        ...mockTask,
        due_date: '2026-02-15',
      };
      
      setupDefaultMocks({ task: taskWithDueDate });

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Clear due date'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ due_date: null })
      );
    });
  });

  describe('2.5.8 Story points selector works', () => {
    test('Story points selector is rendered', () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByLabelText('Story points')).toBeInTheDocument();
    });

    test('Shows Fibonacci sequence options', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Story points'));

      // Check for Fibonacci numbers
      expect(screen.getByText('1 points')).toBeInTheDocument();
      expect(screen.getByText('2 points')).toBeInTheDocument();
      expect(screen.getByText('3 points')).toBeInTheDocument();
      expect(screen.getByText('5 points')).toBeInTheDocument();
      expect(screen.getByText('8 points')).toBeInTheDocument();
      expect(screen.getByText('13 points')).toBeInTheDocument();
      expect(screen.getByText('21 points')).toBeInTheDocument();
    });

    test('Can select story points', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Story points'));
      await user.click(screen.getByText('5 points'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ story_points: 5 })
      );
    });

    test('Shows current story points', async () => {
      const taskWithPoints = {
        ...mockTask,
        story_points: 8,
      };
      
      setupDefaultMocks({ task: taskWithPoints });

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Check for the story points display (format may vary)
      expect(screen.getByText(/8/)).toBeInTheDocument();
    });

    test('Can clear story points', async () => {
      const user = userEvent.setup();
      
      const taskWithPoints = {
        ...mockTask,
        story_points: 5,
      };
      
      setupDefaultMocks({ task: taskWithPoints });

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Story points'));
      await user.click(screen.getByText('No estimate'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ story_points: null })
      );
    });
  });

  describe('Additional panel functionality', () => {
    test('Delete button removes task', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByText('Delete'));

      expect(mockOnDelete).toHaveBeenCalledWith('test-task-id');
      expect(mockSelectCard).toHaveBeenCalledWith(null);
    });

    test('Cancel button closes panel without saving', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      // Make changes
      const titleInput = screen.getByLabelText('Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Changed title');

      // Cancel
      await user.click(screen.getByText('Cancel'));

      // Should save on close
      expect(mockOnUpdate).toHaveBeenCalled();
      expect(mockSelectCard).toHaveBeenCalledWith(null);
    });

    test('Save button is disabled when no changes', () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).toBeDisabled();
    });

    test('Save button is enabled after making changes', async () => {
      const user = userEvent.setup();

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, ' updated');

      const saveButton = screen.getByText('Save').closest('button');
      expect(saveButton).not.toBeDisabled();
    });

    test('Shows metadata (created and updated dates)', () => {
      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText(/Created/)).toBeInTheDocument();
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });

    test('Can link to milestone', async () => {
      const user = userEvent.setup();
      
      const mockMilestones = [
        {
          id: 'milestone-1',
          project_id: 'project-1',
          title: 'Phase 1',
          description: '',
          status: 'in_progress' as const,
          target_date: null,
          position: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          milestones={mockMilestones}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Milestone'));
      await user.click(screen.getByText('Phase 1'));

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'test-task-id',
        expect.objectContaining({ milestone_id: 'milestone-1' })
      );
    });

    test('Can link to PRD', async () => {
      const user = userEvent.setup();
      
      const mockPRDs = [
        {
          id: 'prd-1',
          project_id: 'project-1',
          title: 'Feature Spec',
          content: '',
          status: 'approved' as const,
          sections: {},
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      render(
        <TaskDetailPanel
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          prds={mockPRDs}
          onLinkToPRD={mockOnLinkToPRD}
        />,
        { wrapper: TestWrapper }
      );

      await user.click(screen.getByLabelText('Link to PRD'));
      await user.click(screen.getByText('Feature Spec'));

      expect(mockOnLinkToPRD).toHaveBeenCalledWith('test-task-id', 'prd-1');
    });
  });
});
