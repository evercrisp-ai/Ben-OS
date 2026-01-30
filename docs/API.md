# Ben OS REST API Documentation

This document provides comprehensive documentation for the Ben OS REST API, enabling both humans and AI agents to interact with the project management system.

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://your-app.vercel.app/api/v1`

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

```
GET /api/v1/openapi.json
```

You can use this with tools like Swagger UI or Postman for interactive API exploration.

## Authentication

### For AI Agents

AI agents must authenticate using Bearer tokens:

```http
Authorization: Bearer bos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are obtained through agent registration. See [AGENTS.md](AGENTS.md) for details.

### For Web UI

The web UI uses Supabase session cookies automatically. No additional authentication is needed for browser requests.

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

When limit is exceeded, you'll receive a `429 Too Many Requests` response.

## Response Format

All responses follow a consistent format:

### Success Response

```json
{
  "data": { ... },
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

## Common Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 50 | Maximum results (max 100) |
| `offset` | integer | 0 | Pagination offset |
| `search` | string | - | Text search filter |
| `status` | string | - | Comma-separated status filter |

---

## Areas

Areas represent top-level life domains.

### List Areas

```http
GET /areas
```

**Query Parameters**:
- `limit`, `offset`, `search`

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Side Projects",
      "color": "#6366f1",
      "icon": "rocket",
      "type": "project",
      "position": 0,
      "created_at": "2026-01-30T10:00:00Z",
      "updated_at": "2026-01-30T10:00:00Z"
    }
  ],
  "pagination": { "total": 5, "limit": 50, "offset": 0, "hasMore": false }
}
```

### Create Area

```http
POST /areas
Content-Type: application/json

{
  "name": "Content Creation",
  "type": "content",
  "color": "#10b981",
  "icon": "video"
}
```

**Required Fields**: `name`, `type`

**Type Options**: `personal`, `work`, `project`, `content`, `community`, `other`

### Get Area

```http
GET /areas/:id
```

### Update Area

```http
PUT /areas/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "color": "#ef4444"
}
```

### Delete Area

```http
DELETE /areas/:id
```

Returns `204 No Content` on success.

---

## Projects

Projects are specific initiatives within areas.

### List Projects

```http
GET /projects
```

**Query Parameters**:
- `limit`, `offset`, `search`, `status`
- `area_id` - Filter by area

**Example**:

```http
GET /projects?area_id=uuid&status=active,paused
```

### Create Project

```http
POST /projects
Content-Type: application/json

{
  "title": "Ben OS Development",
  "area_id": "uuid",
  "description": "Personal project management system",
  "status": "active",
  "target_date": "2026-03-31"
}
```

**Required Fields**: `title`, `area_id`

**Status Options**: `active`, `paused`, `completed`, `archived`

### Get Project

```http
GET /projects/:id
```

### Update Project

```http
PUT /projects/:id
Content-Type: application/json

{
  "status": "completed"
}
```

### Delete Project

```http
DELETE /projects/:id
```

---

## Milestones

Milestones are major checkpoints within projects.

### List Milestones

```http
GET /milestones
```

**Query Parameters**:
- `limit`, `offset`, `search`, `status`
- `project_id` - Filter by project

### Create Milestone

```http
POST /milestones
Content-Type: application/json

{
  "title": "MVP Launch",
  "project_id": "uuid",
  "description": "First public release",
  "target_date": "2026-02-28"
}
```

**Required Fields**: `title`, `project_id`

**Status Options**: `pending`, `in_progress`, `completed`

### Get Milestone

```http
GET /milestones/:id
```

### Update Milestone

```http
PUT /milestones/:id
Content-Type: application/json

{
  "status": "in_progress"
}
```

### Delete Milestone

```http
DELETE /milestones/:id
```

---

## Tasks

Tasks are actionable work items within boards.

### List Tasks

```http
GET /tasks
```

**Query Parameters**:
- `limit`, `offset`, `search`, `status`, `priority`
- `board_id` - Filter by board
- `milestone_id` - Filter by milestone
- `assigned_agent` - Filter by assigned agent

**Example**:

```http
GET /tasks?status=in_progress,review&priority=high,critical&limit=20
```

### Create Task

```http
POST /tasks
Content-Type: application/json

{
  "title": "Implement user authentication",
  "board_id": "uuid",
  "description": "Add login and registration flow",
  "priority": "high",
  "story_points": 8,
  "milestone_id": "uuid",
  "due_date": "2026-02-15"
}
```

**Required Fields**: `title`, `board_id`

**Priority Options**: `low`, `medium`, `high`, `critical`

**Status Options**: `backlog`, `todo`, `in_progress`, `review`, `done`

### Get Task

```http
GET /tasks/:id
```

Returns task with subtasks.

### Update Task

```http
PUT /tasks/:id
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "critical",
  "assigned_agent_id": "uuid"
}
```

### Delete Task

```http
DELETE /tasks/:id
```

### Update Task Status

Quick endpoint for status updates only:

```http
PUT /tasks/:id/status
Content-Type: application/json

{
  "status": "done"
}
```

### Assign Task to Agent

```http
PUT /tasks/:id/assign
Content-Type: application/json

{
  "agent_id": "uuid"  // or null to unassign
}
```

### Bulk Task Operations

Perform multiple task operations in one request:

```http
POST /tasks/bulk
Content-Type: application/json

{
  "operations": [
    {
      "operation": "create",
      "data": {
        "title": "New task 1",
        "board_id": "uuid"
      }
    },
    {
      "operation": "update",
      "id": "task-uuid",
      "data": {
        "status": "done"
      }
    },
    {
      "operation": "delete",
      "id": "task-uuid-2"
    }
  ]
}
```

**Operation Types**: `create`, `update`, `delete`

**Response**:

```json
{
  "data": {
    "results": [
      { "success": true, "data": { ... } },
      { "success": true, "data": { ... } },
      { "success": true }
    ],
    "summary": {
      "total": 3,
      "success": 3,
      "failed": 0
    }
  }
}
```

---

## Boards

Kanban boards for organizing tasks.

### List Boards

```http
GET /boards
```

**Query Parameters**:
- `limit`, `offset`, `search`
- `project_id` - Filter by project

### Create Board

```http
POST /boards
Content-Type: application/json

{
  "name": "Sprint 1",
  "project_id": "uuid",
  "column_config": [
    { "id": "backlog", "name": "Backlog", "position": 0 },
    { "id": "todo", "name": "To Do", "position": 1 },
    { "id": "in_progress", "name": "In Progress", "position": 2 },
    { "id": "done", "name": "Done", "position": 3 }
  ]
}
```

**Required Fields**: `name`, `project_id`

### Get Board

```http
GET /boards/:id
```

Returns board with all tasks organized by column.

### Update Board

```http
PUT /boards/:id
Content-Type: application/json

{
  "name": "Sprint 2",
  "column_config": [ ... ]
}
```

### Delete Board

```http
DELETE /boards/:id
```

---

## PRDs (Product Requirement Documents)

### List PRDs

```http
GET /prds
```

**Query Parameters**:
- `limit`, `offset`, `search`, `status`
- `project_id` - Filter by project

### Create PRD

```http
POST /prds
Content-Type: application/json

{
  "title": "User Authentication PRD",
  "project_id": "uuid",
  "content": "# Overview\n\nThis PRD covers...",
  "status": "draft",
  "sections": [
    {
      "id": "1",
      "title": "Requirements",
      "content": "...",
      "completed": false
    }
  ]
}
```

**Required Fields**: `title`, `project_id`

**Status Options**: `draft`, `approved`, `in_progress`, `completed`

### Get PRD

```http
GET /prds/:id
```

Returns PRD with linked tasks and version history.

### Update PRD

```http
PUT /prds/:id
Content-Type: application/json

{
  "content": "Updated content...",
  "create_version": true  // Create version snapshot before updating
}
```

### Delete PRD

```http
DELETE /prds/:id
```

---

## Reports

Generated productivity reports.

### List Reports

```http
GET /reports
```

**Query Parameters**:
- `limit`, `offset`
- `type` - Filter by `daily`, `weekly`, `monthly`

### Generate Report

```http
POST /reports
Content-Type: application/json

{
  "type": "weekly",
  "period_start": "2026-01-27",
  "period_end": "2026-02-02"
}
```

**Required Fields**: `type`

If dates are not provided, they're calculated automatically based on type.

### Get Report

```http
GET /reports/:id
```

### Delete Report

```http
DELETE /reports/:id
```

---

## Search

Full-text search across all entities.

### Search Query

```http
GET /search?q=authentication
```

**Query Parameters**:
- `q` - Search query (required, minimum 2 characters)
- `types` - Comma-separated entity types to search
- `limit` - Maximum results

**Entity Types**: `areas`, `projects`, `milestones`, `tasks`, `prds`, `boards`

**Example**:

```http
GET /search?q=auth&types=tasks,prds&limit=10
```

**Response**:

```json
{
  "query": "auth",
  "results": [
    {
      "type": "task",
      "id": "uuid",
      "title": "Implement authentication",
      "description": "...",
      "status": "in_progress",
      "parent": {
        "type": "board",
        "id": "uuid",
        "title": "Sprint 1"
      },
      "score": 0.95
    }
  ],
  "counts": {
    "areas": 0,
    "projects": 0,
    "milestones": 0,
    "tasks": 5,
    "prds": 2,
    "boards": 0,
    "total": 7
  }
}
```

---

## Activity Logs

Activity logs are automatically created when entities are modified. They can be queried through the activity endpoint.

### Get Activity

```http
GET /activity
```

**Query Parameters**:
- `limit`, `offset`
- `entity_type` - Filter by entity type
- `entity_id` - Filter by specific entity
- `agent_id` - Filter by agent
- `action` - Filter by action type

**Response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "entity_type": "tasks",
      "entity_id": "task-uuid",
      "agent_id": "agent-uuid",
      "user_initiated": false,
      "action": "status_updated",
      "payload": {
        "from": "in_progress",
        "to": "done"
      },
      "created_at": "2026-01-30T15:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid auth |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Examples with cURL

### List all active projects

```bash
curl -X GET "http://localhost:3000/api/v1/projects?status=active" \
  -H "Content-Type: application/json"
```

### Create a task (authenticated agent)

```bash
curl -X POST "http://localhost:3000/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -d '{
    "title": "Review pull request",
    "board_id": "uuid",
    "priority": "high",
    "story_points": 3
  }'
```

### Update task status

```bash
curl -X PUT "http://localhost:3000/api/v1/tasks/uuid/status" \
  -H "Content-Type: application/json" \
  -d '{ "status": "done" }'
```

### Search for tasks

```bash
curl -X GET "http://localhost:3000/api/v1/search?q=authentication&types=tasks" \
  -H "Content-Type: application/json"
```

---

## SDK Usage (JavaScript/TypeScript)

### Using Fetch

```typescript
const API_BASE = 'http://localhost:3000/api/v1';

// List tasks
const response = await fetch(`${API_BASE}/tasks?status=in_progress`);
const { data, pagination } = await response.json();

// Create task
const newTask = await fetch(`${API_BASE}/tasks`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer bos_xxxxx'
  },
  body: JSON.stringify({
    title: 'New task',
    board_id: 'uuid',
    priority: 'high'
  })
}).then(r => r.json());
```

### Using React Query (TanStack Query)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

// List tasks hook
function useTasks(filters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetch(`/api/v1/tasks?${new URLSearchParams(filters)}`)
      .then(r => r.json())
  });
}

// Create task mutation
function useCreateTask() {
  return useMutation({
    mutationFn: (task) => fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    }).then(r => r.json())
  });
}
```

---

## Versioning

The API is versioned through the URL path (`/api/v1/`). Breaking changes will be introduced in new versions while maintaining backwards compatibility for existing versions.

## Support

For API issues or questions, please check:
1. The OpenAPI spec at `/api/v1/openapi.json`
2. The [AGENTS.md](AGENTS.md) for authentication help
3. The main [README.md](../README.md) for general documentation
