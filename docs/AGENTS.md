# Ben OS Agent Onboarding Guide

This guide explains how to register and configure AI agents to work with Ben OS through the REST API.

## Overview

Ben OS supports AI agent integration through a secure API key authentication system. Agents can:

- Read and modify tasks, projects, milestones, and other entities
- Perform bulk operations
- Log their activities
- Generate reports
- Search across the system

## Agent Types

| Type | Description | Default Capabilities |
|------|-------------|---------------------|
| `primary` | Main AI assistant with full access | All capabilities |
| `task` | Task-focused agent with limited scope | Read-only by default |

## Quick Start

### 1. Register an Agent

To register a new agent, use the service role API or a script:

```typescript
import { registerAgent } from '@/lib/api/auth';

const { agent, apiKey } = await registerAgent({
  name: 'My AI Assistant',
  type: 'primary',
  capabilities: ['read:tasks', 'write:tasks', 'read:projects', 'write:projects']
});

console.log('Agent ID:', agent.id);
console.log('API Key:', apiKey); // Save this! Only shown once!
```

**Important**: The API key is only returned once at registration. Store it securely!

### 2. Authenticate Requests

Include the API key in all API requests:

```http
Authorization: Bearer bos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Make API Calls

```bash
curl -X GET "https://your-app.vercel.app/api/v1/tasks" \
  -H "Authorization: Bearer bos_xxxxx"
```

---

## Registration Methods

### Method 1: Using the API (Recommended)

Create an agent through a secure backend script:

```typescript
// scripts/register-agent.ts
import { registerAgent, ADMIN_CAPABILITIES } from '@/lib/api/auth';

async function main() {
  const { agent, apiKey } = await registerAgent({
    name: 'Claude Assistant',
    type: 'primary',
    capabilities: ADMIN_CAPABILITIES
  });

  console.log('='.repeat(50));
  console.log('Agent Registered Successfully!');
  console.log('='.repeat(50));
  console.log(`Agent ID: ${agent.id}`);
  console.log(`Agent Name: ${agent.name}`);
  console.log(`Agent Type: ${agent.type}`);
  console.log(`API Key: ${apiKey}`);
  console.log('');
  console.log('IMPORTANT: Save this API key! It will not be shown again.');
  console.log('='.repeat(50));
}

main().catch(console.error);
```

Run with:

```bash
npx tsx scripts/register-agent.ts
```

### Method 2: Direct Database Insert

For advanced users, insert directly into Supabase:

```sql
-- Generate a secure API key first (outside SQL)
-- Then hash it with SHA-256 and insert:

INSERT INTO agents (name, type, capabilities, api_key_hash, is_active)
VALUES (
  'My Agent',
  'primary',
  '["read:tasks", "write:tasks", "read:projects", "write:projects"]'::jsonb,
  'sha256-hash-of-api-key',
  true
);
```

---

## API Key Format

API keys follow this format:

```
bos_[32 random alphanumeric characters]
```

Example: `bos_aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV`

**Properties**:
- Prefix: `bos_` (Ben OS)
- Random portion: 32 characters (A-Z, a-z, 0-9)
- Total length: 36 characters
- Hashing: SHA-256 (stored in database)

---

## Capabilities

Capabilities control what an agent can do. They follow the format `action:resource`.

### Available Capabilities

| Capability | Description |
|------------|-------------|
| `read:tasks` | View tasks and subtasks |
| `write:tasks` | Create, update, delete tasks |
| `read:projects` | View projects |
| `write:projects` | Create, update, delete projects |
| `read:boards` | View boards and columns |
| `write:boards` | Create, update, delete boards |
| `read:areas` | View areas |
| `write:areas` | Create, update, delete areas |
| `read:milestones` | View milestones |
| `write:milestones` | Create, update, delete milestones |
| `read:prds` | View PRDs |
| `write:prds` | Create, update, delete PRDs |
| `read:reports` | View reports |
| `write:reports` | Generate reports |
| `read:agents` | View other agents |
| `write:agents` | Manage agents |
| `admin` | Full access to everything |

### Capability Sets

```typescript
// Read-only agent
const READ_ONLY = [
  'read:tasks',
  'read:projects',
  'read:boards',
  'read:areas',
  'read:milestones',
  'read:prds',
  'read:reports'
];

// Task worker agent
const TASK_WORKER = [
  'read:tasks',
  'write:tasks',
  'read:projects',
  'read:boards',
  'read:milestones'
];

// Full access agent
const ADMIN = [
  'read:tasks', 'write:tasks',
  'read:projects', 'write:projects',
  'read:boards', 'write:boards',
  'read:areas', 'write:areas',
  'read:milestones', 'write:milestones',
  'read:prds', 'write:prds',
  'read:reports', 'write:reports',
  'read:agents', 'write:agents',
  'admin'
];
```

---

## API Key Management

### Key Rotation

Rotate an agent's API key (invalidates old key immediately):

```typescript
import { rotateApiKey } from '@/lib/api/auth';

const { agent, apiKey } = await rotateApiKey(agentId);
console.log('New API Key:', apiKey); // Save the new key!
```

### Key Revocation

Temporarily disable an agent:

```typescript
import { revokeAgent, reactivateAgent } from '@/lib/api/auth';

// Disable agent
await revokeAgent(agentId);

// Re-enable agent
await reactivateAgent(agentId);
```

---

## Authentication Flow

1. **Request arrives** with `Authorization: Bearer bos_xxxxx`
2. **Extract token** from header
3. **Validate format** (must start with `bos_`)
4. **Hash the key** using SHA-256
5. **Look up agent** by hash in database
6. **Check active status** (reject if inactive)
7. **Verify capability** for the requested action
8. **Update last_active_at** timestamp
9. **Process request** or return error

### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| 401 | Missing or invalid Authorization header | No Bearer token provided |
| 401 | Invalid or revoked API key | Key doesn't exist or agent is inactive |
| 403 | Insufficient permissions | Agent lacks required capability |

---

## Usage Examples

### Example 1: Task Automation Agent

An agent that automatically assigns and updates tasks:

```typescript
// Register with task management capabilities
const { agent, apiKey } = await registerAgent({
  name: 'Task Automator',
  type: 'task',
  capabilities: [
    'read:tasks',
    'write:tasks',
    'read:boards',
    'read:projects',
    'read:milestones'
  ]
});

// Use the agent
const response = await fetch('/api/v1/tasks?status=todo', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
const { data: tasks } = await response.json();

// Update task status
await fetch(`/api/v1/tasks/${tasks[0].id}/status`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ status: 'in_progress' })
});
```

### Example 2: Reporting Agent

An agent that generates reports:

```typescript
const { agent, apiKey } = await registerAgent({
  name: 'Report Generator',
  type: 'task',
  capabilities: [
    'read:tasks',
    'read:projects',
    'read:reports',
    'write:reports'
  ]
});

// Generate weekly report
const response = await fetch('/api/v1/reports', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ type: 'weekly' })
});
```

### Example 3: Claude/MCP Integration

For Claude Desktop integration, use the MCP server instead of direct API access. See [MCP.md](MCP.md).

For direct API access from Claude (e.g., via tool use):

```typescript
// Store API key in Claude's environment
const BEN_OS_API_KEY = process.env.BEN_OS_API_KEY;

async function callBenOS(endpoint: string, options?: RequestInit) {
  const response = await fetch(`https://your-app.vercel.app/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${BEN_OS_API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
  return response.json();
}

// Example usage
const projects = await callBenOS('/projects?status=active');
```

---

## Activity Logging

All agent actions are automatically logged to `activity_logs`. You can also log custom actions:

```http
POST /api/v1/activity
Authorization: Bearer bos_xxxxx
Content-Type: application/json

{
  "entity_type": "tasks",
  "entity_id": "task-uuid",
  "action": "analyzed",
  "payload": {
    "analysis": "This task is blocked by...",
    "recommendation": "Prioritize dependency first"
  }
}
```

Query agent activity:

```http
GET /api/v1/activity?agent_id=agent-uuid&limit=50
```

---

## Best Practices

### Security

1. **Store keys securely**: Use environment variables, not code
2. **Rotate regularly**: Rotate keys periodically (monthly recommended)
3. **Least privilege**: Only grant necessary capabilities
4. **Monitor activity**: Review agent activity logs regularly
5. **Revoke immediately**: Disable compromised agents immediately

### Performance

1. **Batch operations**: Use `/tasks/bulk` for multiple changes
2. **Use filters**: Limit result sets with query parameters
3. **Cache wisely**: Cache read results when appropriate
4. **Respect rate limits**: 100 requests/minute

### Integration

1. **Log actions**: Use `log_activity` for important actions
2. **Handle errors**: Implement retry logic with backoff
3. **Track context**: Include `ai_context` in tasks for agent-specific data

---

## Troubleshooting

### "Missing or invalid Authorization header"

- Ensure header is exactly: `Authorization: Bearer bos_xxxxx`
- Check for extra spaces or characters
- Verify the key format starts with `bos_`

### "Invalid or revoked API key"

- Verify the key was saved correctly at registration
- Check if the agent is active in the database
- Key may have been rotated - use the new key

### "Insufficient permissions"

- Check agent's capabilities array
- Ensure `write:` capability for mutating operations
- Consider adding specific capability or `admin`

### Agent not found in logs

- Verify `agent_id` is passed in activity log calls
- Check `activity_logs` table for entries
- Ensure agent exists and is active

---

## Database Schema

The `agents` table stores agent information:

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('primary', 'task')),
  capabilities JSONB DEFAULT '[]',
  api_key_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Further Reading

- [REST API Documentation](API.md) - Full API reference
- [MCP Server Documentation](MCP.md) - Claude integration guide
- [Architecture Documentation](ARCHITECTURE.md) - System design
