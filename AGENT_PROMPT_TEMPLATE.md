# Agent Guide for Ben OS

This document explains how AI agents can interact with Ben OS through the MCP server.

---

## MCP Server Tools

Ben OS provides these MCP tools for AI agent integration:

### Project & Board Discovery
- **list_projects** - List all projects with status and progress
- **get_board** - Get a Kanban board with columns and all tasks

### PRD Access
- **get_prd** - Get a PRD with sections, linked tasks, and progress
  - Use this to understand the specification for a feature
  - Sections contain the detailed requirements
  - Linked tasks show what work is in progress

### Task Management
- **create_task** - Create a new task on a board
  - Optionally link to a PRD with `prd_id`
  - Include `ai_context` with relevant information for other agents
- **update_task** - Update any task field
- **move_task** - Move a task between columns or boards
- **search_tasks** - Search tasks by keyword, status, priority

### Context & Reporting
- **get_context** - Get comprehensive context for a task
  - Returns project, board, milestone, related tasks, subtasks, and linked PRD
- **log_activity** - Record agent actions to activity logs
- **generate_report** - Generate daily/weekly/monthly summaries

---

## Working with PRDs

PRDs (Product Requirements Documents) in Ben OS are structured plans that guide work:

### Reading a PRD
1. Use `get_prd` with the PRD ID
2. Review the sections for requirements
3. Check linked tasks to see current progress

### Following a PRD Spec
When working on a task linked to a PRD:
1. Use `get_context` on the task to get the linked PRD info
2. Use `get_prd` to read the full specification
3. Follow the requirements in the PRD sections
4. Update task progress using `update_task` and `move_task`
5. Log significant decisions using `log_activity`

### Creating Tasks from PRD Requirements
When a PRD has requirements that need implementation:
1. Read the PRD sections with `get_prd`
2. Use `create_task` with `prd_id` set to link tasks back to the PRD
3. Include relevant context in the task's `ai_context` field

---

## Best Practices for AI Agents

### Before Starting Work
1. Use `get_context` on the task you're working on
2. If there's a linked PRD, read it with `get_prd`
3. Review related tasks to understand the broader context

### During Work
1. Move tasks to appropriate columns (`in_progress`, `review`, `done`)
2. Update task descriptions with progress notes
3. Use `log_activity` to record significant decisions or analyses

### When Creating Tasks
1. Write clear, actionable titles
2. Include detailed descriptions
3. Set appropriate priority
4. Link to PRD if implementing a spec
5. Add `ai_context` with relevant technical details

### Communication
1. Use task descriptions for human-readable status
2. Use `ai_context` field for agent-to-agent information
3. Log activities for audit trail

---

## Example Workflow

### Working on a Feature from PRD

```
1. Agent receives: "Work on implementing user authentication from PRD abc123"

2. Get the PRD:
   get_prd { prd_id: "abc123" }
   
3. Read the sections, understand requirements

4. Check existing tasks:
   get_board { board_id: "board-xyz" }
   
5. Create implementation tasks:
   create_task {
     board_id: "board-xyz",
     title: "Implement login form",
     prd_id: "abc123",
     ai_context: { spec_section: "authentication", dependencies: ["session-store"] }
   }

6. Update task status as you work:
   move_task { task_id: "task-123", column_id: "in_progress" }

7. Log significant decisions:
   log_activity {
     entity_type: "tasks",
     entity_id: "task-123", 
     action: "decision",
     payload: { decision: "Using JWT for session tokens", rationale: "Stateless, works well with API" }
   }

8. Complete the task:
   move_task { task_id: "task-123", column_id: "done" }
```

---

## Quick Reference

| Action | Tool | Required Params |
|--------|------|-----------------|
| List projects | `list_projects` | - |
| Read board | `get_board` | `board_id` |
| Read PRD | `get_prd` | `prd_id` |
| Create task | `create_task` | `board_id`, `title` |
| Update task | `update_task` | `task_id` |
| Move task | `move_task` | `task_id` |
| Get task context | `get_context` | `task_id` |
| Search tasks | `search_tasks` | `query` |
| Log activity | `log_activity` | `entity_type`, `entity_id`, `action` |
| Generate report | `generate_report` | `type` |
