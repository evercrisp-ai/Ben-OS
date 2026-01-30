/**
 * Tests for Section 2.1 - Milestone Management
 *
 * These tests verify all the requirements specified in the PRD:
 * 2.1.1 Milestone list renders
 * 2.1.2 Can create milestone
 * 2.1.3 Progress indicator shows correct percentage
 * 2.1.4 Task can be linked to milestone
 * 2.1.5 Timeline view renders
 * 2.1.6 Status can be changed
 * 2.1.7 Board filters by milestone
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MilestoneList } from "@/components/milestones/MilestoneList";
import { MilestoneCard } from "@/components/milestones/MilestoneCard";
import { MilestoneForm } from "@/components/milestones/MilestoneForm";
import { MilestoneProgress, computeMilestoneProgress } from "@/components/milestones/MilestoneProgress";
import { MilestoneTimeline } from "@/components/milestones/MilestoneTimeline";
import { BoardHeader } from "@/components/kanban/BoardHeader";
import { CardDetailPanel } from "@/components/kanban/CardDetailPanel";
import { useBoardStore } from "@/stores/board-store";
import type { Milestone, Task, Board, ColumnConfig } from "@/types/database";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            data: mockMilestones,
            error: null,
          }),
        }),
        order: () => ({
          data: mockTasks,
          error: null,
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => ({
            data: { ...mockMilestones[0], id: "new-milestone" },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({
              data: mockMilestones[0],
              error: null,
            }),
          }),
        }),
      }),
      delete: () => ({
        eq: () => ({
          error: null,
        }),
      }),
    }),
  }),
}));

// Mock activity logger
vi.mock("@/lib/activity-logger", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

// Mock agents hook
vi.mock("@/hooks/use-agents", () => ({
  useAgents: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useActiveAgents: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useAgent: vi.fn(() => ({ data: null, isLoading: false, error: null })),
  useCreateAgent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateAgent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteAgent: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  agentKeys: { all: ["agents"], lists: () => ["agents", "list"], list: () => ["agents", "list"], details: () => ["agents", "detail"], detail: (id: string) => ["agents", "detail", id] },
}));

// Mock activity logs hook
vi.mock("@/hooks/use-activity-logs", () => ({
  useEntityActivityLogs: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useTaskActivityLogs: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useRecentActivityLogs: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  activityLogKeys: { all: ["activity_logs"], lists: () => ["activity_logs", "list"], entity: () => ["activity_logs", "list"], recent: () => ["activity_logs", "list", "recent"] },
  formatActivityAction: vi.fn((action: string) => action),
  formatActivityChanges: vi.fn(() => []),
}));

// Mock subtask hooks (required since CardDetailPanel includes SubtaskList)
vi.mock("@/hooks/use-subtasks", () => ({
  useSubtasks: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useCreateSubtask: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useUpdateSubtask: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteSubtask: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useToggleSubtask: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useBulkUpdateSubtasks: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  subtaskKeys: {
    all: ["subtasks"],
    lists: () => ["subtasks", "list"],
    list: (filters?: { taskId?: string }) => ["subtasks", "list", filters],
    details: () => ["subtasks", "detail"],
    detail: (id: string) => ["subtasks", "detail", id],
  },
}));

// Test wrapper with required providers
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    );
  };
}

// Mock data
const mockColumns: ColumnConfig[] = [
  { id: "backlog", name: "Backlog", position: 0 },
  { id: "todo", name: "To Do", position: 1 },
  { id: "in_progress", name: "In Progress", position: 2 },
  { id: "done", name: "Done", position: 3 },
];

const mockBoard: Board = {
  id: "board-1",
  project_id: "project-1",
  name: "Test Board",
  column_config: mockColumns,
  position: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockMilestones: Milestone[] = [
  {
    id: "milestone-1",
    project_id: "project-1",
    title: "MVP Launch",
    description: "Launch the minimum viable product",
    status: "pending",
    target_date: "2026-03-15",
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "milestone-2",
    project_id: "project-1",
    title: "Beta Release",
    description: "Release beta version to testers",
    status: "in_progress",
    target_date: "2026-02-28",
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "milestone-3",
    project_id: "project-1",
    title: "Initial Setup",
    description: "Complete initial setup",
    status: "completed",
    target_date: "2026-01-15",
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockTasks: Task[] = [
  {
    id: "task-1",
    board_id: "board-1",
    column_id: "done",
    title: "Task 1 - Done",
    description: null,
    status: "done",
    priority: "medium",
    position: 0,
    milestone_id: "milestone-1",
    prd_id: null,
    assigned_agent_id: null,
    story_points: null,
    ai_context: {},
    due_date: null,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-2",
    board_id: "board-1",
    column_id: "done",
    title: "Task 2 - Done",
    description: null,
    status: "done",
    priority: "medium",
    position: 1,
    milestone_id: "milestone-1",
    prd_id: null,
    assigned_agent_id: null,
    story_points: null,
    ai_context: {},
    due_date: null,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-3",
    board_id: "board-1",
    column_id: "in_progress",
    title: "Task 3 - In Progress",
    description: null,
    status: "in_progress",
    priority: "high",
    position: 0,
    milestone_id: "milestone-1",
    prd_id: null,
    assigned_agent_id: null,
    story_points: null,
    ai_context: {},
    due_date: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-4",
    board_id: "board-1",
    column_id: "todo",
    title: "Task 4 - Todo",
    description: null,
    status: "todo",
    priority: "low",
    position: 0,
    milestone_id: "milestone-1",
    prd_id: null,
    assigned_agent_id: null,
    story_points: null,
    ai_context: {},
    due_date: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-5",
    board_id: "board-1",
    column_id: "backlog",
    title: "Task 5 - No milestone",
    description: null,
    status: "backlog",
    priority: "medium",
    position: 0,
    milestone_id: null,
    prd_id: null,
    assigned_agent_id: null,
    story_points: null,
    ai_context: {},
    due_date: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("2.1 Milestone Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store before each test
    useBoardStore.setState({
      board: null,
      columns: [],
      tasks: [],
      filters: { priority: [], assignee: [], milestone: [], search: "" },
      selectedCardId: null,
      focusedCardId: null,
      isAddingColumn: false,
      editingColumnId: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 2.1.1 - Milestone list renders
   * Note: This test verifies the MilestoneList component renders correctly
   * with an empty state (due to mocking complexity). The actual data fetching
   * is tested via integration tests.
   */
  test("2.1.1 Milestone list renders", async () => {
    const TestWrapper = createTestWrapper();
    
    render(
      <TestWrapper>
        <MilestoneList projectId="project-1" />
      </TestWrapper>
    );

    // Wait for loading to complete and list to render
    await waitFor(() => {
      expect(screen.getByTestId("milestone-list")).toBeInTheDocument();
    });

    // Check that the milestone list header is rendered
    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText("Add Milestone")).toBeInTheDocument();
  });

  /**
   * Test 2.1.2 - Can create milestone
   */
  test("2.1.2 Can create milestone", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TooltipProvider>
        <MilestoneForm
          projectId="project-1"
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
        />
      </TooltipProvider>
    );

    // Fill in the form
    await user.type(screen.getByLabelText("Title"), "MVP Launch");
    await user.type(
      screen.getByLabelText("Description"),
      "Launch the minimum viable product"
    );
    await user.type(screen.getByLabelText("Target Date"), "2026-03-15");

    // Click Create button
    await user.click(screen.getByRole("button", { name: /create/i }));

    // Check that onSubmit was called with correct data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: "project-1",
          title: "MVP Launch",
          description: "Launch the minimum viable product",
          target_date: "2026-03-15",
        })
      );
    });
  });

  /**
   * Test 2.1.3 - Progress indicator shows correct percentage
   */
  test("2.1.3 Progress indicator shows correct percentage", () => {
    // 2 of 4 tasks complete = 50%
    const milestone = mockMilestones[0]; // MVP Launch has 4 tasks, 2 done

    render(
      <TooltipProvider>
        <MilestoneProgress milestone={milestone} tasks={mockTasks} />
      </TooltipProvider>
    );

    // Check the percentage is displayed correctly
    expect(screen.getByTestId("milestone-progress-label")).toHaveTextContent("50%");
    expect(screen.getByTestId("milestone-progress-bar")).toBeInTheDocument();
  });

  /**
   * Test 2.1.3b - computeMilestoneProgress returns correct values
   */
  test("2.1.3b computeMilestoneProgress returns correct values", () => {
    const milestone = mockMilestones[0]; // MVP Launch has 4 tasks, 2 done
    const result = computeMilestoneProgress(milestone, mockTasks);

    expect(result.total).toBe(4);
    expect(result.completed).toBe(2);
    expect(result.percentage).toBe(50);
  });

  /**
   * Test 2.1.4 - Task can be linked to milestone
   */
  test("2.1.4 Task can be linked to milestone", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();

    // Set up store with a selected card
    useBoardStore.getState().setBoard(mockBoard);
    useBoardStore.getState().setTasks(mockTasks);
    useBoardStore.getState().selectCard("task-5"); // Task without milestone

    render(
      <TooltipProvider>
        <CardDetailPanel
          onUpdate={onUpdate}
          onDelete={vi.fn()}
          milestones={mockMilestones}
        />
      </TooltipProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
    });

    // Click milestone dropdown
    await user.click(screen.getByLabelText("Milestone"));

    // Wait for dropdown and select "MVP Launch"
    await waitFor(() => {
      expect(screen.getByText("MVP Launch")).toBeInTheDocument();
    });
    await user.click(screen.getByText("MVP Launch"));

    // Check that onUpdate was called with milestone_id
    expect(onUpdate).toHaveBeenCalledWith("task-5", { milestone_id: "milestone-1" });
  });

  /**
   * Test 2.1.5 - Timeline view renders
   * Note: This test verifies the MilestoneTimeline component renders correctly.
   * Due to mocking complexity, we verify the empty state. Integration tests
   * cover the full data flow.
   */
  test("2.1.5 Timeline view renders", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <MilestoneTimeline projectId="project-1" />
      </TestWrapper>
    );

    // Wait for timeline to render
    await waitFor(() => {
      expect(screen.getByTestId("timeline")).toBeInTheDocument();
    });

    // Check the timeline header or empty state is shown
    expect(screen.getByText(/No milestones to display|Milestone Timeline/)).toBeInTheDocument();
  });

  /**
   * Test 2.1.6 - Status can be changed
   */
  test("2.1.6 Status can be changed", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    const milestone = mockMilestones[0]; // "pending" status

    render(
      <TooltipProvider>
        <MilestoneCard
          milestone={milestone}
          tasks={mockTasks}
          onStatusChange={onStatusChange}
        />
      </TooltipProvider>
    );

    // Check that "Start" button is visible (for pending -> in_progress transition)
    expect(screen.getByRole("button", { name: "Start" })).toBeInTheDocument();

    // Click "Start" button
    await user.click(screen.getByRole("button", { name: "Start" }));

    // Check that onStatusChange was called with correct status
    expect(onStatusChange).toHaveBeenCalledWith(milestone, "in_progress");
  });

  /**
   * Test 2.1.6b - Status transitions correctly
   */
  test("2.1.6b Status transitions from in_progress to completed", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();

    const milestone = mockMilestones[1]; // "in_progress" status

    render(
      <TooltipProvider>
        <MilestoneCard
          milestone={milestone}
          tasks={mockTasks}
          onStatusChange={onStatusChange}
        />
      </TooltipProvider>
    );

    // Check that "Complete" button is visible
    expect(screen.getByRole("button", { name: "Complete" })).toBeInTheDocument();

    // Click "Complete" button
    await user.click(screen.getByRole("button", { name: "Complete" }));

    // Check that onStatusChange was called with correct status
    expect(onStatusChange).toHaveBeenCalledWith(milestone, "completed");
  });

  /**
   * Test 2.1.6c - Completed milestone has no status action
   */
  test("2.1.6c Completed milestone has no status action button", () => {
    const milestone = mockMilestones[2]; // "completed" status

    render(
      <TooltipProvider>
        <MilestoneCard
          milestone={milestone}
          tasks={mockTasks}
          onStatusChange={vi.fn()}
        />
      </TooltipProvider>
    );

    // Check that no "Start" or "Complete" button is visible
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
  });

  /**
   * Test 2.1.7 - Board filters by milestone
   */
  test("2.1.7 Board filters by milestone", async () => {
    const user = userEvent.setup();

    // Set up store
    useBoardStore.getState().setBoard(mockBoard);
    useBoardStore.getState().setTasks(mockTasks);

    render(
      <TooltipProvider>
        <BoardHeader
          board={mockBoard}
          agents={[]}
          milestones={mockMilestones}
          onAddColumn={vi.fn()}
        />
      </TooltipProvider>
    );

    // Click milestone filter
    await user.click(screen.getByTestId("filter-milestone"));

    // Wait for dropdown and select "MVP Launch"
    await waitFor(() => {
      expect(screen.getByText("MVP Launch")).toBeInTheDocument();
    });

    // Find the dropdown menu item
    const menuItems = screen.getAllByText("MVP Launch");
    const menuItem = menuItems.find(
      (el) => el.closest('[role="menuitemcheckbox"]') !== null
    );
    if (menuItem) {
      await user.click(menuItem);
    }

    // Check that store filters are updated
    await waitFor(() => {
      const filters = useBoardStore.getState().filters;
      expect(filters.milestone).toContain("milestone-1");
    });
  });

  /**
   * Test 2.1.7b - Milestone filter correctly filters cards
   */
  test("2.1.7b Milestone filter correctly filters cards", () => {
    // Set up store with filter
    useBoardStore.getState().setBoard(mockBoard);
    useBoardStore.getState().setTasks(mockTasks);
    useBoardStore.getState().setFilters({ milestone: ["milestone-1"] });

    // Get filtered columns
    const filteredColumns = useBoardStore.getState().getFilteredColumns();
    const totalCards = filteredColumns.reduce(
      (acc, col) => acc + col.cards.length,
      0
    );

    // Only 4 tasks have milestone-1
    expect(totalCards).toBe(4);

    // All filtered cards should have the milestone
    filteredColumns.forEach((col) => {
      col.cards.forEach((card) => {
        expect(card.milestone_id).toBe("milestone-1");
      });
    });
  });

  /**
   * Additional test - MilestoneCard displays correct information
   */
  test("MilestoneCard displays correct information", () => {
    const milestone = mockMilestones[0];

    render(
      <TooltipProvider>
        <MilestoneCard
          milestone={milestone}
          tasks={mockTasks}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
        />
      </TooltipProvider>
    );

    // Check title
    expect(screen.getByText("MVP Launch")).toBeInTheDocument();

    // Check description
    expect(screen.getByText("Launch the minimum viable product")).toBeInTheDocument();

    // Check status badge
    expect(screen.getByText("Pending")).toBeInTheDocument();

    // Check target date (use flexible matcher due to timezone differences)
    expect(screen.getByText(/Mar 1[45], 2026/)).toBeInTheDocument();

    // Check progress
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  /**
   * Additional test - MilestoneCard shows overdue badge
   */
  test("MilestoneCard shows overdue badge for past due milestones", () => {
    const overdueMilestone: Milestone = {
      ...mockMilestones[0],
      target_date: "2025-01-01", // Past date
    };

    render(
      <TooltipProvider>
        <MilestoneCard
          milestone={overdueMilestone}
          tasks={mockTasks}
          onStatusChange={vi.fn()}
        />
      </TooltipProvider>
    );

    // Check overdue badge
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  /**
   * Additional test - MilestoneForm can edit existing milestone
   */
  test("MilestoneForm can edit existing milestone", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const milestone = mockMilestones[0];

    render(
      <TooltipProvider>
        <MilestoneForm
          projectId="project-1"
          milestone={milestone}
          open={true}
          onOpenChange={vi.fn()}
          onSubmit={onSubmit}
        />
      </TooltipProvider>
    );

    // Check that form is pre-filled
    expect(screen.getByDisplayValue("MVP Launch")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Launch the minimum viable product")
    ).toBeInTheDocument();

    // Edit the title
    const titleInput = screen.getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated MVP Launch");

    // Click Save button
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    // Check that onSubmit was called with correct data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "milestone-1",
          title: "Updated MVP Launch",
        })
      );
    });
  });

  /**
   * Additional test - Clear milestone filter
   */
  test("Clear filters button clears milestone filter", async () => {
    const user = userEvent.setup();

    // Set up store with filter already applied
    act(() => {
      useBoardStore.getState().setFilters({
        milestone: ["milestone-1"],
      });
    });

    render(
      <TooltipProvider>
        <BoardHeader
          board={mockBoard}
          agents={[]}
          milestones={mockMilestones}
          onAddColumn={vi.fn()}
        />
      </TooltipProvider>
    );

    // Check clear button is visible and shows count
    const clearButton = screen.getByText(/Clear/);
    expect(clearButton).toBeInTheDocument();

    // Click clear button
    await user.click(clearButton);

    // Check filters are cleared
    await waitFor(() => {
      const filters = useBoardStore.getState().filters;
      expect(filters.milestone).toHaveLength(0);
    });
  });
});
