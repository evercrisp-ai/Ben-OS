// tests/features/subtasks.test.tsx
// Section 2.2 - Subtasks (Inchstones) Feature Tests
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

// Mock board store
vi.mock('@/stores/board-store', () => ({
  useBoardStore: vi.fn(() => ({
    selectedCardId: 'test-task-id',
    selectCard: vi.fn(),
    getCardById: vi.fn(() => mockTask),
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
  {
    id: 'subtask-3',
    task_id: 'test-task-id',
    title: 'Third subtask',
    completed: false,
    completed_at: null,
    position: 2,
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T10:00:00Z',
  },
  {
    id: 'subtask-4',
    task_id: 'test-task-id',
    title: 'Fourth subtask',
    completed: true,
    completed_at: '2026-01-30T12:00:00Z',
    position: 3,
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T12:00:00Z',
  },
  {
    id: 'subtask-5',
    task_id: 'test-task-id',
    title: 'Fifth subtask',
    completed: false,
    completed_at: null,
    position: 4,
    created_at: '2026-01-30T10:00:00Z',
    updated_at: '2026-01-30T10:00:00Z',
  },
];

const mockTask = {
  id: 'test-task-id',
  board_id: 'test-board-id',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo' as const,
  priority: 'medium' as const,
  column_id: 'todo',
  position: 0,
  story_points: null,
  due_date: null,
  milestone_id: null,
  prd_id: null,
  assigned_agent_id: null,
  ai_context: {},
  completed_at: null,
  created_at: '2026-01-30T10:00:00Z',
  updated_at: '2026-01-30T10:00:00Z',
  subtaskCount: 5,
  subtaskCompleted: 2,
};

const mockColumns = [
  { id: 'backlog', name: 'Backlog', position: 0 },
  { id: 'todo', name: 'To Do', position: 1 },
  { id: 'in_progress', name: 'In Progress', position: 2 },
  { id: 'review', name: 'Review', position: 3 },
  { id: 'done', name: 'Done', position: 4 },
];

// Import components after mocks
import { SubtaskItem } from '@/components/subtasks/SubtaskItem';
import { SubtaskList } from '@/components/subtasks/SubtaskList';
import { AddSubtaskInline } from '@/components/subtasks/AddSubtaskInline';
import { Card } from '@/components/kanban/Card';

// Import hooks for mocking
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useToggleSubtask,
  useBulkUpdateSubtasks,
} from '@/hooks/use-subtasks';

// Mock React Query wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

describe('2.2 Subtasks (Inchstones)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useSubtasks).mockReturnValue({
      data: mockSubtasks,
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
      isError: false,
      isSuccess: false,
      isIdle: true,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle' as const,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      context: undefined,
      submittedAt: 0,
      isPaused: false,
    } as any);

    vi.mocked(useUpdateSubtask).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle' as const,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      context: undefined,
      submittedAt: 0,
      isPaused: false,
    } as any);

    vi.mocked(useDeleteSubtask).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle' as const,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      context: undefined,
      submittedAt: 0,
      isPaused: false,
    } as any);

    vi.mocked(useToggleSubtask).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle' as const,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      context: undefined,
      submittedAt: 0,
      isPaused: false,
    } as any);

    vi.mocked(useBulkUpdateSubtasks).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: 'idle' as const,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      variables: undefined,
      context: undefined,
      submittedAt: 0,
      isPaused: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('2.2.1 Subtask list in task detail', () => {
    test('Subtask list renders all subtasks for a task', async () => {
      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      // Wait for subtasks to render
      await waitFor(() => {
        expect(screen.getByTestId('subtasks-section')).toBeInTheDocument();
      });

      // Check all 5 subtasks are rendered
      const subtasks = screen.getAllByTestId(/^subtask-/);
      expect(subtasks).toHaveLength(5);
    });

    test('Subtask list shows correct count and progress', async () => {
      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      await waitFor(() => {
        // 2 of 5 completed
        expect(screen.getByText('(2/5)')).toBeInTheDocument();
        expect(screen.getByText('40%')).toBeInTheDocument();
      });
    });

    test('Subtask list shows loading state', () => {
      vi.mocked(useSubtasks).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        isSuccess: false,
      } as any);

      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      // Should show loading spinner (Loader2 component)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('Subtask list shows error state', () => {
      vi.mocked(useSubtasks).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
        isError: true,
        isSuccess: false,
      } as any);

      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      expect(screen.getByText('Failed to load subtasks')).toBeInTheDocument();
    });
  });

  describe('2.2.2 Inline subtask creation', () => {
    test('Can add subtask inline without modal', async () => {
      const user = userEvent.setup();
      const mockCreate = vi.fn().mockResolvedValue({});
      vi.mocked(useCreateSubtask).mockReturnValue({
        mutateAsync: mockCreate,
        isPending: false,
      } as any);

      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      // Click add subtask button
      await user.click(screen.getByText('Add subtask'));

      // Type new subtask title
      const input = screen.getByPlaceholderText('Add subtask');
      await user.type(input, 'New step');
      await user.keyboard('{Enter}');

      // Verify create was called
      expect(mockCreate).toHaveBeenCalledWith({
        task_id: 'test-task-id',
        title: 'New step',
        position: 5, // After existing 5 subtasks
      });
    });

    test('AddSubtaskInline component works correctly', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();

      render(<AddSubtaskInline onAdd={onAdd} />, { wrapper: TestWrapper });

      // Initially shows "Add subtask" button
      expect(screen.getByText('Add subtask')).toBeInTheDocument();

      // Click to show input
      await user.click(screen.getByText('Add subtask'));

      // Input should be focused
      const input = screen.getByPlaceholderText('Add subtask');
      expect(input).toHaveValue('');

      // Type and submit
      await user.type(input, 'New subtask title');
      await user.keyboard('{Enter}');

      expect(onAdd).toHaveBeenCalledWith('New subtask title');
    });

    test('Pressing Escape cancels inline creation', async () => {
      const user = userEvent.setup();
      const onAdd = vi.fn();

      render(<AddSubtaskInline onAdd={onAdd} />, { wrapper: TestWrapper });

      // Click to show input
      await user.click(screen.getByText('Add subtask'));

      // Press Escape
      await user.keyboard('{Escape}');

      // Should return to button state
      expect(screen.getByText('Add subtask')).toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  describe('2.2.3 Subtask checkbox toggle', () => {
    test('Checkbox toggles completion status', async () => {
      const user = userEvent.setup();
      const mockToggle = vi.fn();

      render(
        <SubtaskItem
          subtask={mockSubtasks[0]} // uncompleted
          onToggle={mockToggle}
          onDelete={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(mockToggle).toHaveBeenCalledWith('subtask-1', false);
    });

    test('Completed subtask shows checked checkbox', () => {
      render(
        <SubtaskItem
          subtask={mockSubtasks[1]} // completed
          onToggle={vi.fn()}
          onDelete={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    test('Completed subtask shows strikethrough text', () => {
      render(
        <SubtaskItem
          subtask={mockSubtasks[1]} // completed
          onToggle={vi.fn()}
          onDelete={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      const title = screen.getByText('Second subtask');
      expect(title).toHaveClass('line-through');
    });
  });

  describe('2.2.4 Subtask reordering', () => {
    test('Subtasks have drag handles visible on hover', async () => {
      render(
        <SubtaskItem
          subtask={mockSubtasks[0]}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      // Drag handle should exist (visible on hover)
      const dragHandle = screen.getByLabelText('Drag to reorder');
      expect(dragHandle).toBeInTheDocument();
    });

    test('Subtask list uses DnD context', async () => {
      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      await waitFor(() => {
        // Check subtasks section exists
        expect(screen.getByTestId('subtasks-section')).toBeInTheDocument();
      });

      // All subtasks should be rendered with sortable items
      const subtasks = screen.getAllByTestId(/^subtask-/);
      expect(subtasks.length).toBe(5);
    });

    // Note: Full drag-and-drop testing requires integration tests with Playwright
    // due to the complexity of simulating drag events
  });

  describe('2.2.5 Subtask count on card', () => {
    test('Card shows subtask count correctly', () => {
      render(<Card task={mockTask} />, { wrapper: TestWrapper });

      // 2/5 subtasks completed
      expect(screen.getByText('2/5')).toBeInTheDocument();
    });

    test('Card without subtasks does not show count', () => {
      const taskWithoutSubtasks = {
        ...mockTask,
        subtaskCount: 0,
        subtaskCompleted: 0,
      };

      render(<Card task={taskWithoutSubtasks} />, { wrapper: TestWrapper });

      // Should not show any subtask count
      expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument();
    });
  });

  describe('2.2.6 Progress bar on card', () => {
    test('Card shows progress bar with correct percentage', () => {
      render(<Card task={mockTask} />, { wrapper: TestWrapper });

      // 2/5 = 40%
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '40');
    });

    test('Progress bar shows 100% when all completed', () => {
      const allCompletedTask = {
        ...mockTask,
        subtaskCount: 5,
        subtaskCompleted: 5,
      };

      render(<Card task={allCompletedTask} />, { wrapper: TestWrapper });

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    test('Progress bar shows percentage text', () => {
      render(<Card task={mockTask} />, { wrapper: TestWrapper });

      // 40% text should be displayed
      expect(screen.getByText('40%')).toBeInTheDocument();
    });

    test('Card without subtasks does not show progress bar', () => {
      const taskWithoutSubtasks = {
        ...mockTask,
        subtaskCount: 0,
        subtaskCompleted: 0,
      };

      render(<Card task={taskWithoutSubtasks} />, { wrapper: TestWrapper });

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('SubtaskItem component', () => {
    test('Renders subtask title correctly', () => {
      render(
        <SubtaskItem
          subtask={mockSubtasks[0]}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
        />,
        { wrapper: TestWrapper }
      );

      expect(screen.getByText('First subtask')).toBeInTheDocument();
    });

    test('Delete button triggers onDelete', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <SubtaskItem
          subtask={mockSubtasks[0]}
          onToggle={vi.fn()}
          onDelete={onDelete}
        />,
        { wrapper: TestWrapper }
      );

      const deleteButton = screen.getByLabelText('Delete subtask "First subtask"');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith('subtask-1');
    });

    test('Double click enables editing mode when onUpdate is provided', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();

      render(
        <SubtaskItem
          subtask={mockSubtasks[0]}
          onToggle={vi.fn()}
          onDelete={vi.fn()}
          onUpdate={onUpdate}
        />,
        { wrapper: TestWrapper }
      );

      const title = screen.getByText('First subtask');
      await user.dblClick(title);

      // Input should appear
      const input = screen.getByDisplayValue('First subtask');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    test('SubtaskList correctly counts completed subtasks', async () => {
      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      await waitFor(() => {
        // 2 completed out of 5 total = 40%
        expect(screen.getByText('(2/5)')).toBeInTheDocument();
      });
    });

    test('Progress bar updates based on completed count', async () => {
      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '40');
      });
    });

    test('Empty subtask list shows only add button', async () => {
      vi.mocked(useSubtasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        isError: false,
        isSuccess: true,
      } as any);

      render(<SubtaskList taskId="test-task-id" />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText('Add subtask')).toBeInTheDocument();
      });

      // No progress bar when empty
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
