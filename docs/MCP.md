# Ben OS MCP Server Documentation

This guide explains how to set up and use the Ben OS MCP (Model Context Protocol) Server for AI assistant integration with Claude and other compatible AI systems.

## Overview

The MCP Server enables AI assistants to interact directly with your Ben OS project management system. It provides a set of tools for:

- Viewing and managing projects
- Creating and updating tasks
- Moving tasks between columns/boards
- Getting comprehensive task context
- Logging activity
- Searching tasks
- Generating reports

## Installation

### Prerequisites

- Node.js 18+
- Ben OS running (development or production)
- Access to Supabase credentials

### Setup

1. **Navigate to the MCP server directory**:

   ```bash
   cd mcp-server
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:

   Create a `.env` file in the `mcp-server/` directory:

   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Build the server**:

   ```bash
   npm run build
   ```

5. **Test the server**:

   ```bash
   npm start
   ```

## Claude Desktop Integration

### Configuration

Add the Ben OS MCP server to your Claude Desktop configuration.

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ben-os": {
      "command": "node",
      "args": ["/path/to/ben-os/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

Replace `/path/to/ben-os` with the actual path to your Ben OS installation.

### Using npx (Alternative)

If you've published the MCP server to npm:

```json
{
  "mcpServers": {
    "ben-os": {
      "command": "npx",
      "args": ["@ben-os/mcp-server"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_SERVICE_ROLE_KEY": "..."
      }
    }
  }
}
```

### Restart Claude Desktop

After adding the configuration, restart Claude Desktop for the changes to take effect. You should see "ben-os" listed in the MCP servers.

## Available Tools

### list_projects

List all projects with their status and progress.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area_id` | string | No | Filter by area ID |
| `status` | string | No | Filter by status: `active`, `paused`, `completed`, `archived` |

**Example Usage**:

```
"Show me all my active projects"
"List projects in the Side Projects area"
```

**Response**:

```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "Ben OS Development",
      "status": "active",
      "area": { "id": "uuid", "name": "Side Projects" },
      "progress": {
        "total_tasks": 50,
        "completed_tasks": 25,
        "percentage": 50
      },
      "target_date": "2026-03-31"
    }
  ]
}
```

---

### get_board

Get a Kanban board with all columns and tasks.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `board_id` | string | Yes | The ID of the board to retrieve |

**Example Usage**:

```
"Show me the Sprint 1 board"
"What tasks are on the main development board?"
```

**Response**:

```json
{
  "board": {
    "id": "uuid",
    "name": "Sprint 1",
    "project": { "id": "uuid", "title": "Ben OS" },
    "columns": [
      {
        "id": "todo",
        "name": "To Do",
        "tasks": [
          {
            "id": "uuid",
            "title": "Implement auth",
            "priority": "high",
            "story_points": 8
          }
        ]
      }
    ]
  }
}
```

---

### create_task

Create a new task on a board.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `board_id` | string | Yes | Target board ID |
| `title` | string | Yes | Task title |
| `description` | string | No | Task description |
| `priority` | string | No | `low`, `medium`, `high`, `critical` |
| `column_id` | string | No | Target column (defaults to first column) |
| `milestone_id` | string | No | Associated milestone |
| `story_points` | number | No | Story points (1-21) |
| `due_date` | string | No | Due date in ISO format |
| `prd_id` | string | No | Link to PRD |
| `ai_context` | object | No | AI-specific metadata |

**Example Usage**:

```
"Create a high priority task called 'Fix login bug' on the Sprint 1 board"
"Add a task to implement dark mode with 5 story points"
```

**Response**:

```json
{
  "task": {
    "id": "uuid",
    "title": "Fix login bug",
    "status": "backlog",
    "priority": "high",
    "column_id": "backlog",
    "created_at": "2026-01-30T15:00:00Z"
  }
}
```

---

### update_task

Update any field of an existing task.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID to update |
| `title` | string | No | New title |
| `description` | string | No | New description |
| `priority` | string | No | New priority |
| `status` | string | No | New status |
| `column_id` | string | No | New column |
| `milestone_id` | string/null | No | Milestone (null to unassign) |
| `story_points` | number/null | No | Story points (null to clear) |
| `due_date` | string/null | No | Due date (null to clear) |
| `prd_id` | string/null | No | PRD link (null to unlink) |
| `assigned_agent_id` | string/null | No | Agent assignment |
| `ai_context` | object | No | AI context data |

**Example Usage**:

```
"Mark task X as done"
"Update the priority of task Y to critical"
"Assign task Z to me"
```

---

### move_task

Move a task to a different column and/or board.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID to move |
| `column_id` | string | No | Target column ID |
| `board_id` | string | No | Target board ID (for cross-board moves) |
| `position` | number | No | Position in target column |

**Example Usage**:

```
"Move task X to the 'In Progress' column"
"Move task Y to the Sprint 2 board"
```

---

### get_context

Get comprehensive context for a task including its project, board, milestone, related tasks, subtasks, and linked PRD.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | Task ID to get context for |

**Example Usage**:

```
"Give me full context on task X"
"What's the background for this task?"
```

**Response**:

```json
{
  "task": { ... },
  "project": { "id": "uuid", "title": "Ben OS", "status": "active" },
  "board": { "id": "uuid", "name": "Sprint 1" },
  "milestone": { "id": "uuid", "title": "MVP Launch", "status": "in_progress" },
  "prd": {
    "id": "uuid",
    "title": "Authentication PRD",
    "sections": [ ... ]
  },
  "subtasks": [
    { "id": "uuid", "title": "Write tests", "completed": true },
    { "id": "uuid", "title": "Update docs", "completed": false }
  ],
  "related_tasks": [
    { "id": "uuid", "title": "Related task", "status": "done" }
  ]
}
```

---

### log_activity

Record an agent action to the activity logs.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entity_type` | string | Yes | Entity type (see below) |
| `entity_id` | string | Yes | Entity ID |
| `action` | string | Yes | Action performed |
| `payload` | object | No | Additional data |
| `agent_id` | string | No | Agent performing action |

**Entity Types**: `areas`, `projects`, `milestones`, `tasks`, `subtasks`, `boards`, `prds`, `agents`, `reports`

**Example Usage**:

```
"Log that I analyzed task X"
"Record my review of the authentication PRD"
```

---

### search_tasks

Search for tasks by keyword across titles, descriptions, and AI context.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `status` | string | No | Filter by status |
| `priority` | string | No | Filter by priority |
| `board_id` | string | No | Filter by board |
| `project_id` | string | No | Filter by project |
| `limit` | number | No | Max results (default: 20) |

**Example Usage**:

```
"Find all tasks related to authentication"
"Search for high priority tasks about API"
```

**Response**:

```json
{
  "query": "authentication",
  "results": [
    {
      "id": "uuid",
      "title": "Implement user authentication",
      "description": "...",
      "status": "in_progress",
      "priority": "high",
      "board": { "id": "uuid", "name": "Sprint 1" }
    }
  ],
  "total": 5
}
```

---

### generate_report

Generate a summary report (daily, weekly, or monthly).

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Report type: `daily`, `weekly`, `monthly` |
| `date` | string | No | Reference date (defaults to today) |

**Example Usage**:

```
"Generate a weekly report"
"What did I accomplish yesterday? (daily report)"
"Give me a monthly summary for January"
```

**Response**:

```json
{
  "report": {
    "id": "uuid",
    "type": "weekly",
    "period_start": "2026-01-27",
    "period_end": "2026-02-02",
    "content": {
      "summary": "Completed 15 tasks across 3 projects...",
      "tasks_completed": 15,
      "tasks_created": 20,
      "story_points_completed": 45,
      "projects_summary": [ ... ],
      "highlights": [ ... ]
    }
  }
}
```

---

## Example Conversations

### Project Overview

**You**: "What projects am I working on?"

**Claude** (using `list_projects`): "You have 3 active projects:
1. **Ben OS Development** (75% complete) - Side Projects area
2. **Client Website Redesign** (40% complete) - Work area
3. **YouTube Channel** (20% complete) - Content area"

### Creating Tasks

**You**: "Create a task to fix the mobile navigation bug on the Ben OS Sprint 1 board, high priority"

**Claude** (using `create_task`): "I've created the task 'Fix mobile navigation bug' on the Sprint 1 board with high priority. It's been placed in the Backlog column."

### Task Management

**You**: "Move my current in-progress tasks to review"

**Claude** (using `search_tasks` then `move_task`): "I found 2 tasks currently in progress:
1. 'Implement dark mode' - moved to Review
2. 'Add keyboard shortcuts' - moved to Review"

### Getting Context

**You**: "Give me context on the authentication task"

**Claude** (using `get_context`): "Here's the full context for 'Implement user authentication':

**Project**: Ben OS Development (active)
**Board**: Sprint 1
**Milestone**: MVP Launch (in progress, due Feb 28)

**Linked PRD**: Authentication PRD
- Section 1: Requirements (completed)
- Section 2: Implementation (in progress)
- Section 3: Testing (pending)

**Subtasks**:
- [x] Set up Supabase auth
- [x] Create login form
- [ ] Add password reset
- [ ] Write tests

**Related Tasks**:
- 'Add API key authentication' (done)
- 'Implement session management' (in progress)"

### Reports

**You**: "How productive was I this week?"

**Claude** (using `generate_report`): "Here's your weekly report (Jan 27 - Feb 2):

**Summary**: Great week! You completed 15 tasks worth 45 story points.

**Highlights**:
- Finished the authentication system
- Completed 3 high-priority bugs
- Started 2 new features

**By Project**:
- Ben OS: 10 tasks completed (35 points)
- Client Work: 5 tasks completed (10 points)"

---

## Troubleshooting

### Server Won't Start

1. Check environment variables are set correctly
2. Verify Supabase credentials are valid
3. Run `npm run build` before `npm start`
4. Check for port conflicts

### Claude Doesn't See Tools

1. Verify `claude_desktop_config.json` is valid JSON
2. Check the file path is correct
3. Restart Claude Desktop after changes
4. Look for errors in Claude's developer console

### Database Connection Issues

1. Verify `SUPABASE_URL` is correct
2. Check `SUPABASE_SERVICE_ROLE_KEY` has proper permissions
3. Ensure Supabase project is running

### Permission Errors

1. Ensure the service role key is used (not anon key)
2. Check RLS policies allow the operations
3. Verify the tables exist in Supabase

---

## Development

### Running in Development

```bash
cd mcp-server
npm run dev
```

### Testing Tools

Use the MCP Inspector to test tools manually:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Adding New Tools

1. Create a new file in `mcp-server/src/tools/`
2. Define the tool with name, description, and inputSchema
3. Implement the handler function
4. Export from `tools/index.ts`
5. Add the handler to the switch statement in `index.ts`

Example tool template:

```typescript
// mcp-server/src/tools/my-tool.ts
import { supabase } from '../lib/supabase.js';

export const myToolTool = {
  name: 'my_tool',
  description: 'Description of what my tool does',
  inputSchema: {
    type: 'object' as const,
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param1']
  }
};

export async function myTool(args: { param1: string }) {
  // Implementation
  const { data, error } = await supabase
    .from('table')
    .select('*')
    .eq('field', args.param1);

  if (error) throw new Error(error.message);
  return { result: data };
}
```

---

## Security Considerations

1. **Service Role Key**: The MCP server uses the Supabase service role key which bypasses RLS. Keep this secure.

2. **Local Only**: By default, the MCP server runs locally. Don't expose it to the network.

3. **Claude Desktop**: Ensure only you have access to your Claude Desktop configuration.

4. **Audit Logging**: All actions are logged to `activity_logs` for auditing.

---

## API Reference

For direct API access without MCP, see the [REST API Documentation](API.md).
