// MCP Tools Index
// Exports all tool definitions for Ben OS MCP Server

export { listProjectsTool, listProjects } from './list-projects.js';
export { getBoardTool, getBoard } from './get-board.js';
export { getPRDTool, getPRD } from './get-prd.js';
export { createTaskTool, createTask } from './create-task.js';
export { updateTaskTool, updateTask } from './update-task.js';
export { moveTaskTool, moveTask } from './move-task.js';
export { getContextTool, getContext } from './get-context.js';
export { logActivityTool, logActivity } from './log-activity.js';
export { searchTasksTool, searchTasks } from './search-tasks.js';
export { generateReportTool, generateReport } from './generate-report.js';

// Tool definitions array for MCP server registration
export const tools = [
  {
    name: 'list_projects',
    description: 'List all projects with their status and progress. Optionally filter by area or status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        area_id: {
          type: 'string',
          description: 'Filter by area ID',
        },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'completed', 'archived'],
          description: 'Filter by project status',
        },
      },
    },
  },
  {
    name: 'get_board',
    description: 'Get a Kanban board with all columns and tasks. Returns the board configuration, column definitions, and all tasks on the board.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        board_id: {
          type: 'string',
          description: 'The ID of the board to retrieve',
        },
      },
      required: ['board_id'],
    },
  },
  {
    name: 'get_prd',
    description: 'Get a Product Requirements Document (PRD) with its sections and linked tasks. Use this to understand the specification for a feature or initiative.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        prd_id: {
          type: 'string',
          description: 'The ID of the PRD to retrieve',
        },
      },
      required: ['prd_id'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task on a board. Specify the board, title, and optional fields like description, priority, column, milestone, story points, and AI context.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        board_id: {
          type: 'string',
          description: 'The ID of the board to create the task on',
        },
        title: {
          type: 'string',
          description: 'The title of the task',
        },
        description: {
          type: 'string',
          description: 'Optional description of the task',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Task priority level',
        },
        column_id: {
          type: 'string',
          description: 'The column to place the task in (defaults to first column)',
        },
        milestone_id: {
          type: 'string',
          description: 'Optional milestone to associate the task with',
        },
        story_points: {
          type: 'number',
          description: 'Story points for the task',
        },
        ai_context: {
          type: 'object',
          description: 'AI-specific context for the task',
        },
        due_date: {
          type: 'string',
          description: 'Due date in ISO format',
        },
        prd_id: {
          type: 'string',
          description: 'Optional PRD to link the task to',
        },
      },
      required: ['board_id', 'title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update any field of an existing task. Provide the task ID and the fields you want to update.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to update',
        },
        title: {
          type: 'string',
          description: 'New title for the task',
        },
        description: {
          type: 'string',
          description: 'New description for the task',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'New priority level',
        },
        status: {
          type: 'string',
          enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
          description: 'New status',
        },
        column_id: {
          type: 'string',
          description: 'New column ID',
        },
        milestone_id: {
          type: 'string',
          description: 'Milestone ID (or null to unassign)',
        },
        story_points: {
          type: 'number',
          description: 'Story points (or null to clear)',
        },
        ai_context: {
          type: 'object',
          description: 'AI-specific context',
        },
        due_date: {
          type: 'string',
          description: 'Due date in ISO format (or null to clear)',
        },
        prd_id: {
          type: 'string',
          description: 'PRD ID (or null to unlink)',
        },
        assigned_agent_id: {
          type: 'string',
          description: 'Agent ID to assign (or null to unassign)',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'move_task',
    description: 'Move a task to a different column and/or board. Optionally specify the position within the target column.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to move',
        },
        column_id: {
          type: 'string',
          description: 'Target column ID',
        },
        board_id: {
          type: 'string',
          description: 'Target board ID (for moving between boards)',
        },
        position: {
          type: 'number',
          description: 'Position within the target column (defaults to end)',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'get_context',
    description: 'Get comprehensive context for a task including its project, board, milestone, related tasks, subtasks, and linked PRD.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to get context for',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'log_activity',
    description: 'Record an agent action to the activity logs. Use this to track analysis, decisions, or other significant actions taken by the agent.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        entity_type: {
          type: 'string',
          enum: ['areas', 'projects', 'milestones', 'tasks', 'subtasks', 'boards', 'prds', 'agents', 'reports'],
          description: 'The type of entity the action relates to',
        },
        entity_id: {
          type: 'string',
          description: 'The ID of the entity',
        },
        action: {
          type: 'string',
          description: 'The action performed (e.g., "analyzed", "reviewed", "recommended")',
        },
        payload: {
          type: 'object',
          description: 'Additional data about the action',
        },
        agent_id: {
          type: 'string',
          description: 'The ID of the agent performing the action',
        },
      },
      required: ['entity_type', 'entity_id', 'action'],
    },
  },
  {
    name: 'search_tasks',
    description: 'Search for tasks by keyword across titles, descriptions, and AI context. Optionally filter by status, priority, board, or project.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find tasks',
        },
        status: {
          type: 'string',
          enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
          description: 'Filter by task status',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Filter by priority',
        },
        board_id: {
          type: 'string',
          description: 'Filter by board ID',
        },
        project_id: {
          type: 'string',
          description: 'Filter by project ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a summary report (daily, weekly, or monthly). The report is saved to the database and returned.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Type of report to generate',
        },
        date: {
          type: 'string',
          description: 'Reference date in ISO format (defaults to today). For weekly reports, uses the week containing this date. For monthly reports, uses the month containing this date.',
        },
      },
      required: ['type'],
    },
  },
];
