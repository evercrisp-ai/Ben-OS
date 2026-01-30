/**
 * Tests for Section 2.4 - PRD to Task Linking
 *
 * These tests verify all the requirements specified in the PRD:
 * 2.4.1 Generate tasks from PRD
 * 2.4.2 Link existing tasks to PRD
 * 2.4.3 View linked tasks in PRD
 * 2.4.4 PRD completion based on tasks
 * 2.4.5 Traceability view
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PRDEditor } from "@/components/prd/PRDEditor";
import { PRDLinkedTasks } from "@/components/prd/PRDLinkedTasks";
import { PRDProgress, PRDProgressBadge } from "@/components/prd/PRDProgress";
import { PRDTraceability } from "@/components/prd/PRDTraceability";
import { CardDetailPanel } from "@/components/kanban/CardDetailPanel";
import { PRD_SECTIONS } from "@/types/database";
import type { PRD, Task, PRDSection } from "@/types/database";
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

// Mock data
const mockPRD: PRD = {
  id: "prd-1",
  project_id: "project-1",
  title: "User Authentication System",
  content: null,
  status: "in_progress",
  sections: PRD_SECTIONS.map((s) => ({
    ...s,
    content: s.id === "requirements" 
      ? "- Implement OAuth login\n- Add password reset\n- Create session management"
      : "",
  })),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockPRDWithTasks: PRD = {
  ...mockPRD,
  id: "prd-2",
  title: "User Session Management",
};

const mockTasks: Task[] = [
  {
    id: "task-1",
    board_id: "board-1",
    milestone_id: null,
    prd_id: "prd-2",
    assigned_agent_id: null,
    title: "Implement OAuth login",
    description: "Add OAuth 2.0 support",
    status: "done",
    priority: "high",
    story_points: 5,
    ai_context: {},
    column_id: "done",
    position: 0,
    due_date: null,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-2",
    board_id: "board-1",
    milestone_id: null,
    prd_id: "prd-2",
    assigned_agent_id: null,
    title: "Add password reset",
    description: "Password reset flow",
    status: "done",
    priority: "medium",
    story_points: 3,
    ai_context: {},
    column_id: "done",
    position: 1,
    due_date: null,
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "task-3",
    board_id: "board-1",
    milestone_id: null,
    prd_id: "prd-2",
    assigned_agent_id: null,
    title: "Create session management",
    description: "Session handling",
    status: "in_progress",
    priority: "medium",
    story_points: 3,
    ai_context: {},
    column_id: "in_progress",
    position: 2,
    due_date: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockPRDs: PRD[] = [mockPRD, mockPRDWithTasks];

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: string) => {
          if (table === "prds" && column === "id") {
            return {
              single: () => ({
                data: mockPRDs.find((p) => p.id === value) || mockPRD,
                error: null,
              }),
            };
          }
          if (table === "tasks" && column === "prd_id") {
            return {
              order: () => ({
                data: value === "prd-2" ? mockTasks : [],
                error: null,
              }),
            };
          }
          if (table === "prd_versions" && column === "prd_id") {
            return {
              order: () => ({
                data: [],
                error: null,
              }),
            };
          }
          return {
            order: () => ({ data: [], error: null }),
            single: () => ({ data: null, error: null }),
          };
        },
        order: () => ({
          data: mockPRDs,
          error: null,
        }),
      }),
      insert: () => ({
        select: () => ({
          data: mockTasks,
          error: null,
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => ({
              data: mockTasks[0],
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

// Mock board store for CardDetailPanel
vi.mock("@/stores/board-store", () => ({
  useBoardStore: () => ({
    selectedCardId: "task-1",
    selectCard: vi.fn(),
    getCardById: (id: string) => mockTasks.find((t) => t.id === id),
    columns: [
      { id: "backlog", name: "Backlog", position: 0, cards: [] },
      { id: "todo", name: "To Do", position: 1, cards: [] },
      { id: "in_progress", name: "In Progress", position: 2, cards: [] },
      { id: "review", name: "Review", position: 3, cards: [] },
      { id: "done", name: "Done", position: 4, cards: [] },
    ],
  }),
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

describe("2.4 PRD to Task Linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 2.4.1 - Can generate tasks from PRD
   */
  test("2.4.1 Can generate tasks from PRD", async () => {
    const user = userEvent.setup();
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDEditor prdId="prd-1" boardId="board-1" />
      </TestWrapper>
    );

    // Wait for editor to load
    await waitFor(() => {
      expect(screen.getByTestId("prd-editor")).toBeInTheDocument();
    });

    // Find and click Generate Tasks button
    const generateButton = screen.getByText("Generate Tasks");
    expect(generateButton).toBeInTheDocument();
    
    await user.click(generateButton);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText("Generate Tasks from PRD")).toBeInTheDocument();
    });
  });

  /**
   * Test 2.4.2 - Can link existing task to PRD
   */
  test("2.4.2 Can link existing task to PRD", async () => {
    const user = userEvent.setup();
    const TestWrapper = createTestWrapper();
    const onUpdate = vi.fn();
    const onDelete = vi.fn();
    const onLinkToPRD = vi.fn();

    render(
      <TestWrapper>
        <CardDetailPanel
          onUpdate={onUpdate}
          onDelete={onDelete}
          prds={mockPRDs}
          onLinkToPRD={onLinkToPRD}
        />
      </TestWrapper>
    );

    // Wait for panel to load
    await waitFor(() => {
      expect(screen.getByTestId("task-detail-panel")).toBeInTheDocument();
    });

    // Find and click the "Link to PRD" dropdown
    const prdDropdown = screen.getByLabelText("Link to PRD");
    expect(prdDropdown).toBeInTheDocument();
    
    await user.click(prdDropdown);

    // Should show PRD options in the dropdown menu
    await waitFor(() => {
      expect(screen.getByText(mockPRD.title)).toBeInTheDocument();
    });

    // Click on the PRD menu item
    await user.click(screen.getByText(mockPRD.title));

    // Should call onLinkToPRD
    expect(onLinkToPRD).toHaveBeenCalledWith("task-1", "prd-1");
  });

  /**
   * Test 2.4.3 - PRD shows linked tasks
   */
  test("2.4.3 PRD shows linked tasks", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDLinkedTasks prdId="prd-2" />
      </TestWrapper>
    );

    // Wait for linked tasks to load
    await waitFor(() => {
      expect(screen.getByTestId("linked-tasks")).toBeInTheDocument();
    });

    // Should show all 3 linked tasks
    await waitFor(() => {
      expect(screen.getAllByTestId(/linked-task-/)).toHaveLength(3);
    });
  });

  /**
   * Test 2.4.3b - PRD shows empty state when no tasks linked
   */
  test("2.4.3b PRD shows empty state when no tasks linked", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDLinkedTasks prdId="prd-1" />
      </TestWrapper>
    );

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByTestId("linked-tasks-empty")).toBeInTheDocument();
    });

    expect(screen.getByText(/No tasks linked/)).toBeInTheDocument();
  });

  /**
   * Test 2.4.4 - PRD completion updates with tasks
   */
  test("2.4.4 PRD completion updates with tasks", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDProgress prdId="prd-2" showDetails />
      </TestWrapper>
    );

    // Wait for progress to load
    await waitFor(() => {
      expect(screen.getByTestId("prd-progress")).toBeInTheDocument();
    });

    // 2/3 tasks complete = 67%
    await waitFor(() => {
      expect(screen.getByTestId("prd-progress-percentage")).toHaveTextContent("67%");
    });
  });

  /**
   * Test 2.4.4b - PRD progress badge shows percentage
   */
  test("2.4.4b PRD progress badge shows percentage", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDProgressBadge prdId="prd-2" />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("prd-progress-badge")).toHaveTextContent("67%");
    });
  });

  /**
   * Test 2.4.5 - Traceability matrix renders
   */
  test("2.4.5 Traceability matrix renders", async () => {
    const TestWrapper = createTestWrapper();
    const sections: PRDSection[] = PRD_SECTIONS.map((s) => ({
      ...s,
      content: s.id === "requirements" 
        ? "- Implement OAuth login\n- Add password reset\n- Create session management"
        : "",
    }));

    render(
      <TestWrapper>
        <PRDTraceability prdId="prd-2" sections={sections} />
      </TestWrapper>
    );

    // Wait for traceability matrix to load
    await waitFor(() => {
      expect(screen.getByTestId("traceability-matrix")).toBeInTheDocument();
    });
  });

  /**
   * Test 2.4.5b - Traceability shows empty state when no requirements
   */
  test("2.4.5b Traceability shows empty state when no requirements", async () => {
    const TestWrapper = createTestWrapper();
    const emptySections: PRDSection[] = PRD_SECTIONS.map((s) => ({
      ...s,
      content: "",
    }));

    render(
      <TestWrapper>
        <PRDTraceability prdId="prd-2" sections={emptySections} />
      </TestWrapper>
    );

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByTestId("traceability-empty")).toBeInTheDocument();
    });
  });

  /**
   * Test - PRDEditor has linked tasks tab
   */
  test("PRDEditor has linked tasks tab", async () => {
    const user = userEvent.setup();
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDEditor prdId="prd-2" boardId="board-1" />
      </TestWrapper>
    );

    // Wait for editor to load
    await waitFor(() => {
      expect(screen.getByTestId("prd-editor")).toBeInTheDocument();
    });

    // Find and click Linked Tasks tab
    const tasksTab = screen.getByTestId("linked-tasks-tab");
    expect(tasksTab).toBeInTheDocument();
    
    await user.click(tasksTab);

    // Should show linked tasks view
    await waitFor(() => {
      expect(screen.getByTestId("linked-tasks")).toBeInTheDocument();
    });
  });

  /**
   * Test - PRDEditor shows progress in header
   */
  test("PRDEditor shows progress in header", async () => {
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDEditor prdId="prd-2" boardId="board-1" />
      </TestWrapper>
    );

    // Wait for editor to load
    await waitFor(() => {
      expect(screen.getByTestId("prd-editor")).toBeInTheDocument();
    });

    // Should show progress component
    await waitFor(() => {
      expect(screen.getByTestId("prd-progress")).toBeInTheDocument();
    });
  });

  /**
   * Test - Traceability tab accessible from PRDEditor
   */
  test("Traceability tab accessible from PRDEditor", async () => {
    const user = userEvent.setup();
    const TestWrapper = createTestWrapper();

    render(
      <TestWrapper>
        <PRDEditor prdId="prd-2" boardId="board-1" />
      </TestWrapper>
    );

    // Wait for editor to load
    await waitFor(() => {
      expect(screen.getByTestId("prd-editor")).toBeInTheDocument();
    });

    // Find and click Traceability tab
    await user.click(screen.getByText("Traceability"));

    // Should show traceability view
    await waitFor(() => {
      const traceabilityView = screen.queryByTestId("traceability-matrix") || 
                               screen.queryByTestId("traceability-empty");
      expect(traceabilityView).toBeInTheDocument();
    });
  });
});
