/**
 * Tests for Section 3.1 - Dashboard Home
 *
 * These tests verify all the requirements specified in the PRD:
 * 3.1.1 Dashboard layout renders
 * 3.1.2 Today's focus shows priority tasks
 * 3.1.3 Project health shows status
 * 3.1.4 Activity feed shows recent
 * 3.1.5 Quick actions work
 * 3.1.6 Milestone countdown shows
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Dashboard,
  TodayFocusWidget,
  ProjectHealthWidget,
  ActivityFeedWidget,
  QuickActionsWidget,
  MilestoneCountdownWidget,
} from "@/components/dashboard";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Task, Project, Milestone, ActivityLog, Area, Board } from "@/types/database";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock data
const mockTasks: Task[] = [
  {
    id: "task-1",
    board_id: "board-1",
    column_id: "in_progress",
    title: "Critical Task - Due Today",
    description: "High priority task",
    status: "in_progress",
    priority: "critical",
    position: 0,
    milestone_id: "milestone-1",
    prd_id: null,
    assigned_agent_id: null,
    story_points: null,
    ai_context: {},
    due_date: new Date().toISOString().split("T")[0],
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-2",
    board_id: "board-1",
    column_id: "todo",
    title: "High Priority Task",
    description: null,
    status: "todo",
    priority: "high",
    position: 1,
    milestone_id: "milestone-1",
    prd_id: null,
    assigned_agent_id: null,
    story_points: null,
    ai_context: {},
    due_date: new Date(Date.now() - 86400000).toISOString().split("T")[0], // Yesterday (overdue)
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-3",
    board_id: "board-1",
    column_id: "in_progress",
    title: "Medium Priority In Progress",
    description: null,
    status: "in_progress",
    priority: "medium",
    position: 2,
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
    column_id: "done",
    title: "Completed Task",
    description: null,
    status: "done",
    priority: "medium",
    position: 3,
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
];

const mockProjects: Project[] = [
  {
    id: "project-1",
    area_id: "area-1",
    title: "Ben OS",
    description: "Personal project management system",
    status: "active",
    target_date: "2026-06-01",
    metadata: {},
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "project-2",
    area_id: "area-1",
    title: "Side Project",
    description: "Another project",
    status: "paused",
    target_date: null,
    metadata: {},
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "project-3",
    area_id: "area-2",
    title: "Completed Project",
    description: "A finished project",
    status: "completed",
    target_date: null,
    metadata: {},
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockMilestones: Milestone[] = [
  {
    id: "milestone-1",
    project_id: "project-1",
    title: "MVP Launch",
    description: "Launch the minimum viable product",
    status: "in_progress",
    target_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 3 days from now
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "milestone-2",
    project_id: "project-1",
    title: "Beta Release",
    description: "Release beta version",
    status: "pending",
    target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockActivityLogs: ActivityLog[] = [
  {
    id: "activity-1",
    entity_type: "tasks",
    entity_id: "task-1",
    agent_id: null,
    user_initiated: true,
    action: "create",
    payload: { title: "Critical Task - Due Today" },
    created_at: new Date().toISOString(),
  },
  {
    id: "activity-2",
    entity_type: "projects",
    entity_id: "project-1",
    agent_id: null,
    user_initiated: true,
    action: "update",
    payload: { title: "Ben OS", status: "active" },
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "activity-3",
    entity_type: "milestones",
    entity_id: "milestone-1",
    agent_id: null,
    user_initiated: true,
    action: "create",
    payload: { title: "MVP Launch" },
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: "activity-4",
    entity_type: "tasks",
    entity_id: "task-2",
    agent_id: null,
    user_initiated: true,
    action: "update",
    payload: { title: "High Priority Task" },
    created_at: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: "activity-5",
    entity_type: "prds",
    entity_id: "prd-1",
    agent_id: null,
    user_initiated: true,
    action: "create",
    payload: { title: "Feature Spec" },
    created_at: new Date(Date.now() - 240000).toISOString(),
  },
  {
    id: "activity-6",
    entity_type: "tasks",
    entity_id: "task-3",
    agent_id: "agent-1",
    user_initiated: false,
    action: "create",
    payload: { title: "Medium Priority In Progress" },
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "activity-7",
    entity_type: "milestones",
    entity_id: "milestone-2",
    agent_id: null,
    user_initiated: true,
    action: "update",
    payload: { title: "Beta Release" },
    created_at: new Date(Date.now() - 360000).toISOString(),
  },
  {
    id: "activity-8",
    entity_type: "tasks",
    entity_id: "task-4",
    agent_id: null,
    user_initiated: true,
    action: "update",
    payload: { title: "Completed Task" },
    created_at: new Date(Date.now() - 420000).toISOString(),
  },
  {
    id: "activity-9",
    entity_type: "projects",
    entity_id: "project-2",
    agent_id: null,
    user_initiated: true,
    action: "create",
    payload: { title: "Side Project" },
    created_at: new Date(Date.now() - 480000).toISOString(),
  },
  {
    id: "activity-10",
    entity_type: "tasks",
    entity_id: "task-5",
    agent_id: null,
    user_initiated: true,
    action: "delete",
    payload: { title: "Deleted Task" },
    created_at: new Date(Date.now() - 540000).toISOString(),
  },
];

const mockAreas: Area[] = [
  {
    id: "area-1",
    name: "Work",
    color: "#3B82F6",
    icon: "briefcase",
    type: "work",
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockBoards: Board[] = [
  {
    id: "board-1",
    project_id: "project-1",
    name: "Main Board",
    column_config: [
      { id: "backlog", name: "Backlog", position: 0 },
      { id: "todo", name: "To Do", position: 1 },
      { id: "in_progress", name: "In Progress", position: 2 },
      { id: "done", name: "Done", position: 3 },
    ],
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock hooks
vi.mock("@/hooks/use-tasks", () => ({
  useTasks: vi.fn(() => ({
    data: mockTasks,
    isLoading: false,
    error: null,
  })),
  useUpdateTask: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useCreateTask: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new-task" }),
    isPending: false,
  })),
  useBoardTasks: vi.fn(() => ({
    data: mockTasks,
    isLoading: false,
    error: null,
  })),
  taskKeys: {
    all: ["tasks"],
    lists: () => ["tasks", "list"],
    list: () => ["tasks", "list"],
    details: () => ["tasks", "detail"],
    detail: (id: string) => ["tasks", "detail", id],
  },
}));

vi.mock("@/hooks/use-projects", () => ({
  useProjects: vi.fn(() => ({
    data: mockProjects,
    isLoading: false,
    error: null,
  })),
  useCreateProject: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: "new-project" }),
    isPending: false,
  })),
  projectKeys: {
    all: ["projects"],
    lists: () => ["projects", "list"],
    list: () => ["projects", "list"],
    details: () => ["projects", "detail"],
    detail: (id: string) => ["projects", "detail", id],
  },
}));

vi.mock("@/hooks/use-milestones", () => ({
  useMilestones: vi.fn(() => ({
    data: mockMilestones,
    isLoading: false,
    error: null,
  })),
  milestoneKeys: {
    all: ["milestones"],
    lists: () => ["milestones", "list"],
    list: () => ["milestones", "list"],
    details: () => ["milestones", "detail"],
    detail: (id: string) => ["milestones", "detail", id],
  },
}));

vi.mock("@/hooks/use-activity-logs", () => ({
  useRecentActivityLogs: vi.fn(() => ({
    data: mockActivityLogs,
    isLoading: false,
    error: null,
  })),
  activityLogKeys: {
    all: ["activity_logs"],
    lists: () => ["activity_logs", "list"],
    entity: () => ["activity_logs", "list"],
    recent: () => ["activity_logs", "list", "recent"],
  },
}));

vi.mock("@/hooks/use-areas", () => ({
  useAreas: vi.fn(() => ({
    data: mockAreas,
    isLoading: false,
    error: null,
  })),
  areaKeys: {
    all: ["areas"],
    lists: () => ["areas", "list"],
    list: () => ["areas", "list"],
    details: () => ["areas", "detail"],
    detail: (id: string) => ["areas", "detail", id],
  },
}));

vi.mock("@/hooks/use-boards", () => ({
  useBoards: vi.fn(() => ({
    data: mockBoards,
    isLoading: false,
    error: null,
  })),
  boardKeys: {
    all: ["boards"],
    lists: () => ["boards", "list"],
    list: () => ["boards", "list"],
    details: () => ["boards", "detail"],
    detail: (id: string) => ["boards", "detail", id],
  },
}));

// Mock UI store
vi.mock("@/stores/ui-store", () => ({
  useUIStore: vi.fn(() => ({
    toggleCommandPalette: vi.fn(),
  })),
}));

// Mock Supabase client (for any direct calls)
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            data: [],
            error: null,
          }),
        }),
        order: () => ({
          limit: () => ({
            data: [],
            error: null,
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: () => ({
            data: { id: "new-item" },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({
              data: {},
              error: null,
            }),
          }),
        }),
      }),
    }),
  }),
}));

// Mock activity logger
vi.mock("@/lib/activity-logger", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
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

describe("3.1 Dashboard Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 3.1.1 - Dashboard layout renders
   */
  test("3.1.1 Dashboard layout renders", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check that the dashboard grid is rendered
    expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();

    // Check that all widgets are present
    await waitFor(() => {
      expect(screen.getByText("Today's Focus")).toBeInTheDocument();
      expect(screen.getByText("Project Health")).toBeInTheDocument();
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Milestone Countdown")).toBeInTheDocument();
    });
  });

  /**
   * Test 3.1.2 - Today's focus shows priority tasks
   */
  test("3.1.2 Today focus shows priority tasks", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <TodayFocusWidget />
      </TestWrapper>
    );

    // Check header
    expect(screen.getByText("Today's Focus")).toBeInTheDocument();

    // Wait for tasks to load
    await waitFor(() => {
      // Should show critical and high priority tasks
      expect(screen.getByText("Critical Task - Due Today")).toBeInTheDocument();
      expect(screen.getByText("High Priority Task")).toBeInTheDocument();
    });

    // Check that focus tasks have test IDs
    expect(screen.getByTestId("focus-task-0")).toBeInTheDocument();
    expect(screen.getByTestId("focus-task-1")).toBeInTheDocument();

    // Check priority badges
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();

    // Check overdue indicator (using getAllByText since there may be multiple)
    const overdueElements = screen.getAllByText("Overdue");
    expect(overdueElements.length).toBeGreaterThan(0);
  });

  /**
   * Test 3.1.3 - Project health shows status
   */
  test("3.1.3 Project health shows status", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <ProjectHealthWidget />
      </TestWrapper>
    );

    // Check header
    expect(screen.getByText("Project Health")).toBeInTheDocument();

    // Wait for projects to load
    await waitFor(() => {
      // Check summary stats using getAllByText since text appears in multiple places
      const activeElements = screen.getAllByText("Active");
      expect(activeElements.length).toBeGreaterThan(0);
      expect(screen.getByText("On Track")).toBeInTheDocument();
      const pausedElements = screen.getAllByText("Paused");
      expect(pausedElements.length).toBeGreaterThan(0);
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    // Check that project is shown (active projects should appear)
    expect(screen.getByText("Ben OS")).toBeInTheDocument();
  });

  /**
   * Test 3.1.4 - Activity feed shows recent
   */
  test("3.1.4 Activity feed shows recent", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <ActivityFeedWidget />
      </TestWrapper>
    );

    // Check header
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();

    // Wait for activities to load
    await waitFor(() => {
      // Should show 10 activity items (based on mock data)
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`activity-${i}`)).toBeInTheDocument();
      }
    });

    // Check that activity types are shown (using getAllByText since there are multiple)
    const createdElements = screen.getAllByText(/created/);
    expect(createdElements.length).toBeGreaterThan(0);
    const updatedElements = screen.getAllByText(/updated/);
    expect(updatedElements.length).toBeGreaterThan(0);
  });

  /**
   * Test 3.1.5 - Quick actions work
   */
  test("3.1.5 Quick actions work", async () => {
    const user = userEvent.setup();
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <QuickActionsWidget />
      </TestWrapper>
    );

    // Check header
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();

    // Check that actions are present
    expect(screen.getByTestId("quick-action-new-task")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-new-project")).toBeInTheDocument();
    expect(screen.getByTestId("quick-action-search")).toBeInTheDocument();

    // Click "New Task" button
    await user.click(screen.getByText("New Task"));

    // Check that modal opens
    await waitFor(() => {
      expect(screen.getByTestId("new-task-modal")).toBeInTheDocument();
    });

    // Close modal
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // Click "New Project" button
    await user.click(screen.getByText("New Project"));

    // Check that project modal opens
    await waitFor(() => {
      expect(screen.getByTestId("new-project-modal")).toBeInTheDocument();
    });
  });

  /**
   * Test 3.1.6 - Milestone countdown shows
   */
  test("3.1.6 Milestone countdown shows", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <MilestoneCountdownWidget />
      </TestWrapper>
    );

    // Check header
    expect(screen.getByText("Milestone Countdown")).toBeInTheDocument();

    // Wait for milestones to load
    await waitFor(() => {
      // Check that milestones are shown
      expect(screen.getByText("MVP Launch")).toBeInTheDocument();
      expect(screen.getByText("Beta Release")).toBeInTheDocument();
    });

    // Check countdown indicators
    expect(screen.getByTestId("milestone-countdown-0")).toBeInTheDocument();
    expect(screen.getByTestId("milestone-countdown-1")).toBeInTheDocument();

    // Check that "days left" or similar countdown text is shown (using getAllByText since there are multiple milestones)
    const daysLeftElements = screen.getAllByText(/days left/i);
    expect(daysLeftElements.length).toBeGreaterThan(0);
  });

  /**
   * Additional test - Today's Focus shows empty state when no priority tasks
   */
  test("Today's Focus shows empty state when no priority tasks", async () => {
    // Override mock to return empty tasks
    const { useTasks } = await import("@/hooks/use-tasks");
    vi.mocked(useTasks).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useTasks>);

    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <TodayFocusWidget />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });
  });

  /**
   * Additional test - Activity feed shows empty state when no activities
   */
  test("Activity feed shows empty state when no activities", async () => {
    // Override mock to return empty activities
    const { useRecentActivityLogs } = await import("@/hooks/use-activity-logs");
    vi.mocked(useRecentActivityLogs).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useRecentActivityLogs>);

    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <ActivityFeedWidget />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("No recent activity")).toBeInTheDocument();
    });
  });

  /**
   * Additional test - Milestone countdown shows empty state when no upcoming milestones
   */
  test("Milestone countdown shows empty state when no upcoming milestones", async () => {
    // Override mock to return completed milestones only
    const { useMilestones } = await import("@/hooks/use-milestones");
    vi.mocked(useMilestones).mockReturnValue({
      data: [
        {
          ...mockMilestones[0],
          status: "completed",
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useMilestones>);

    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <MilestoneCountdownWidget />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("No upcoming milestones")).toBeInTheDocument();
    });
  });

  /**
   * Additional test - Quick Actions modal form validation
   */
  test("Quick Actions new task modal requires title and board", async () => {
    const user = userEvent.setup();
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <QuickActionsWidget />
      </TestWrapper>
    );

    // Open new task modal
    await user.click(screen.getByText("New Task"));

    await waitFor(() => {
      expect(screen.getByTestId("new-task-modal")).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const createButton = screen.getByRole("button", { name: /create task/i });
    expect(createButton).toBeDisabled();

    // Fill in title
    await user.type(screen.getByLabelText("Title"), "Test Task");

    // Button should still be disabled without board
    expect(createButton).toBeDisabled();
  });

  /**
   * Additional test - Project Health shows correct counts
   */
  test("Project Health shows correct counts", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <ProjectHealthWidget />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check active count (1 active project in mock data)
      const activeStats = screen.getAllByText("1");
      expect(activeStats.length).toBeGreaterThan(0);
    });
  });

  /**
   * Additional test - Dashboard renders all widgets in grid layout
   */
  test("Dashboard renders all widgets in correct layout structure", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    const dashboardGrid = screen.getByTestId("dashboard-grid");
    expect(dashboardGrid).toHaveClass("grid");

    // All widget titles should be present
    await waitFor(() => {
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
      expect(screen.getByText("Today's Focus")).toBeInTheDocument();
      expect(screen.getByText("Project Health")).toBeInTheDocument();
      expect(screen.getByText("Milestone Countdown")).toBeInTheDocument();
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });
  });
});
