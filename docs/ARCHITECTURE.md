# Ben OS Architecture Documentation

This document provides a comprehensive overview of the Ben OS system architecture, including design decisions, database schema, and technical implementation details.

## System Overview

Ben OS is a personal project management system designed for human-AI collaboration. It follows a modern web application architecture with clear separation of concerns.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
├───────────────────────┬─────────────────────┬───────────────────────┤
│     Web Browser       │    Claude Desktop   │      AI Agents        │
│   (React/Next.js)     │    (MCP Server)     │    (REST API)         │
└───────────┬───────────┴──────────┬──────────┴───────────┬───────────┘
            │                      │                      │
            ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js App Router                                                  │
│  ├── Pages (SSR/Static)                                             │
│  ├── API Routes (/api/v1/*)                                         │
│  └── React Server Components                                         │
├─────────────────────────────────────────────────────────────────────┤
│  MCP Server (Standalone)                                             │
│  └── Model Context Protocol for Claude                               │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Service Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  React Query (TanStack Query)    │    Zustand Stores                │
│  └── Data fetching & caching     │    └── UI state management       │
├──────────────────────────────────┴──────────────────────────────────┤
│  Supabase Client (Browser)       │    Supabase Server (API Routes)  │
│  └── Real-time subscriptions     │    └── Service role operations   │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                               │
│  ├── Database with RLS policies                                      │
│  ├── Real-time subscriptions                                         │
│  └── Row Level Security                                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| Next.js 14+ | React framework with App Router |
| TypeScript | Type-safe JavaScript |
| Tailwind CSS | Utility-first CSS |
| shadcn/ui | Component library |
| @dnd-kit | Drag-and-drop functionality |
| Recharts | Data visualization |
| React Query | Server state management |
| Zustand | Client state management |

### Backend

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | REST API endpoints |
| Supabase | Database, auth, real-time |
| MCP Server | AI assistant integration |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Vercel | Hosting and deployment |
| Supabase Cloud | Managed PostgreSQL |
| Vercel Analytics | Performance monitoring |

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│   areas     │
├─────────────┤
│ id (PK)     │
│ name        │
│ color       │
│ icon        │
│ type        │
│ position    │
└──────┬──────┘
       │ 1:N
       ▼
┌─────────────┐     ┌─────────────┐
│  projects   │────▶│   boards    │
├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │
│ area_id(FK) │     │ project_id  │
│ title       │     │ name        │
│ description │     │column_config│
│ status      │     │ position    │
│ target_date │     └──────┬──────┘
│ position    │            │ 1:N
└──────┬──────┘            ▼
       │ 1:N        ┌─────────────┐
       ▼            │   tasks     │◀────────────────┐
┌─────────────┐     ├─────────────┤                 │
│ milestones  │     │ id (PK)     │                 │
├─────────────┤     │ board_id(FK)│                 │
│ id (PK)     │◀────│milestone_id │                 │
│ project_id  │     │ prd_id (FK) │────┐            │
│ title       │     │ agent_id    │    │            │
│ description │     │ title       │    │            │
│ status      │     │ description │    │            │
│ target_date │     │ status      │    │     ┌──────┴──────┐
│ position    │     │ priority    │    │     │  subtasks   │
└─────────────┘     │ story_points│    │     ├─────────────┤
                    │ column_id   │    │     │ id (PK)     │
                    │ position    │    │     │ task_id(FK) │
                    │ due_date    │    │     │ title       │
                    │ ai_context  │    │     │ completed   │
                    └─────────────┘    │     │ position    │
                                       │     └─────────────┘
                                       ▼
┌─────────────┐     ┌─────────────┐   ┌─────────────┐
│   agents    │     │    prds     │   │prd_versions │
├─────────────┤     ├─────────────┤   ├─────────────┤
│ id (PK)     │     │ id (PK)     │   │ id (PK)     │
│ name        │     │ project_id  │   │ prd_id (FK) │
│ type        │     │ title       │   │ version     │
│ capabilities│     │ content     │   │ content     │
│ api_key_hash│     │ status      │   │ sections    │
│ is_active   │     │ sections    │   │ created_at  │
│last_active  │     └─────────────┘   └─────────────┘
└─────────────┘

┌─────────────┐     ┌─────────────┐
│activity_logs│     │   reports   │
├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │
│ entity_type │     │ type        │
│ entity_id   │     │ period_start│
│ agent_id(FK)│     │ period_end  │
│user_initiated│    │ content     │
│ action      │     │generated_at │
│ payload     │     └─────────────┘
│ created_at  │
└─────────────┘
```

### Table Definitions

#### areas

Top-level life domains for organizing projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Area name |
| color | VARCHAR(7) | DEFAULT '#6366f1' | Hex color code |
| icon | VARCHAR(50) | NULLABLE | Icon name |
| type | VARCHAR(50) | NOT NULL, CHECK | Area type |
| position | INTEGER | DEFAULT 0 | Sort order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Type values**: `personal`, `work`, `project`, `content`, `community`, `other`

#### projects

Specific initiatives within areas.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| area_id | UUID | FK → areas, NOT NULL | Parent area |
| title | VARCHAR(200) | NOT NULL | Project title |
| description | TEXT | NULLABLE | Description |
| status | VARCHAR(50) | DEFAULT 'active', CHECK | Project status |
| target_date | DATE | NULLABLE | Target completion |
| metadata | JSONB | DEFAULT '{}' | Extra metadata |
| position | INTEGER | DEFAULT 0 | Sort order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Status values**: `active`, `paused`, `completed`, `archived`

#### milestones

Major checkpoints within projects.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects, NOT NULL | Parent project |
| title | VARCHAR(200) | NOT NULL | Milestone title |
| description | TEXT | NULLABLE | Description |
| status | VARCHAR(50) | DEFAULT 'pending', CHECK | Status |
| target_date | DATE | NULLABLE | Target date |
| position | INTEGER | DEFAULT 0 | Sort order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Status values**: `pending`, `in_progress`, `completed`

#### boards

Kanban boards for organizing tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects, NOT NULL | Parent project |
| name | VARCHAR(100) | NOT NULL | Board name |
| column_config | JSONB | DEFAULT (5 columns) | Column definitions |
| position | INTEGER | DEFAULT 0 | Sort order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Default column_config**:
```json
[
  {"id": "backlog", "name": "Backlog", "position": 0},
  {"id": "todo", "name": "To Do", "position": 1},
  {"id": "in_progress", "name": "In Progress", "position": 2},
  {"id": "review", "name": "Review", "position": 3},
  {"id": "done", "name": "Done", "position": 4}
]
```

#### tasks

Actionable work items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| board_id | UUID | FK → boards, NOT NULL | Parent board |
| milestone_id | UUID | FK → milestones, NULLABLE | Associated milestone |
| prd_id | UUID | FK → prds, NULLABLE | Linked PRD |
| assigned_agent_id | UUID | FK → agents, NULLABLE | Assigned agent |
| title | VARCHAR(300) | NOT NULL | Task title |
| description | TEXT | NULLABLE | Description |
| status | VARCHAR(50) | DEFAULT 'backlog', CHECK | Task status |
| priority | VARCHAR(20) | DEFAULT 'medium', CHECK | Priority level |
| story_points | INTEGER | CHECK 0-21, NULLABLE | Effort estimate |
| ai_context | JSONB | DEFAULT '{}' | AI metadata |
| column_id | VARCHAR(50) | DEFAULT 'backlog' | Current column |
| position | INTEGER | DEFAULT 0 | Sort order in column |
| due_date | DATE | NULLABLE | Due date |
| completed_at | TIMESTAMPTZ | NULLABLE | Completion timestamp |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Status values**: `backlog`, `todo`, `in_progress`, `review`, `done`
**Priority values**: `low`, `medium`, `high`, `critical`

#### subtasks

Granular steps within tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| task_id | UUID | FK → tasks, NOT NULL | Parent task |
| title | VARCHAR(300) | NOT NULL | Subtask title |
| completed | BOOLEAN | DEFAULT false | Completion status |
| completed_at | TIMESTAMPTZ | NULLABLE | Completion timestamp |
| position | INTEGER | DEFAULT 0 | Sort order |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

#### prds

Product Requirement Documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects, NOT NULL | Parent project |
| title | VARCHAR(200) | NOT NULL | PRD title |
| content | TEXT | NULLABLE | Main content |
| status | VARCHAR(50) | DEFAULT 'draft', CHECK | PRD status |
| sections | JSONB | DEFAULT '[]' | Structured sections |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Status values**: `draft`, `approved`, `in_progress`, `completed`

#### prd_versions

Version history for PRDs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| prd_id | UUID | FK → prds, NOT NULL | Parent PRD |
| version | INTEGER | NOT NULL | Version number |
| title | VARCHAR(200) | NOT NULL | Title at version |
| content | TEXT | NULLABLE | Content at version |
| sections | JSONB | DEFAULT '[]' | Sections at version |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Version timestamp |

#### agents

AI agents that interact with the system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Agent name |
| type | VARCHAR(50) | DEFAULT 'task', CHECK | Agent type |
| capabilities | JSONB | DEFAULT '[]' | Allowed actions |
| api_key_hash | VARCHAR(64) | NOT NULL | SHA-256 key hash |
| is_active | BOOLEAN | DEFAULT true | Active status |
| last_active_at | TIMESTAMPTZ | NULLABLE | Last activity |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Type values**: `primary`, `task`

#### activity_logs

Audit trail for all actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| entity_type | VARCHAR(50) | NOT NULL | Entity type name |
| entity_id | UUID | NOT NULL | Entity ID |
| agent_id | UUID | FK → agents, NULLABLE | Acting agent |
| user_initiated | BOOLEAN | DEFAULT false | Human initiated |
| action | VARCHAR(100) | NOT NULL | Action performed |
| payload | JSONB | DEFAULT '{}' | Action details |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp |

#### reports

Generated productivity reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| type | VARCHAR(50) | NOT NULL, CHECK | Report type |
| period_start | DATE | NOT NULL | Period start |
| period_end | DATE | NOT NULL | Period end |
| content | JSONB | NOT NULL | Report data |
| generated_at | TIMESTAMPTZ | DEFAULT NOW() | Generation time |

**Type values**: `daily`, `weekly`, `monthly`

---

## API Architecture

### Route Structure

```
/api/v1/
├── areas/
│   ├── route.ts          # GET (list), POST (create)
│   └── [id]/
│       └── route.ts      # GET, PUT, DELETE
├── projects/
│   ├── route.ts
│   └── [id]/route.ts
├── milestones/
│   ├── route.ts
│   └── [id]/route.ts
├── boards/
│   ├── route.ts
│   └── [id]/route.ts
├── tasks/
│   ├── route.ts
│   ├── bulk/route.ts     # POST (bulk operations)
│   └── [id]/
│       ├── route.ts
│       ├── status/route.ts
│       └── assign/route.ts
├── prds/
│   ├── route.ts
│   └── [id]/route.ts
├── reports/
│   ├── route.ts
│   └── [id]/route.ts
├── activity/route.ts
├── search/route.ts
└── openapi.json/route.ts
```

### Request Flow

```
Request
    │
    ▼
┌─────────────────┐
│  Rate Limiter   │ ──▶ 429 if exceeded
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authentication  │ ──▶ 401/403 if failed
│ (if protected)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validation     │ ──▶ 400 if invalid
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  Database       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Activity Log   │
│  (if mutation)  │
└────────┬────────┘
         │
         ▼
    Response
```

### Rate Limiting

- **Algorithm**: Sliding window
- **Limit**: 100 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Authentication

Two authentication modes:

1. **Browser (Cookies)**: Supabase session cookies for web UI
2. **API Key (Bearer)**: For AI agents and external integrations

---

## Component Architecture

### Layout Structure

```
Layout.tsx (Root)
├── Providers.tsx (React Query, Theme, Zustand)
│   └── SkipLink.tsx (Accessibility)
│       └── Header.tsx
│           ├── MobileSidebar.tsx (Sheet)
│           ├── ThemeToggle.tsx
│           └── CommandPalette.tsx (Cmd+K)
│       └── Sidebar.tsx
│           └── Navigation Links
│       └── Main Content Area
│           └── Page Components
```

### Kanban Board Components

```
Board.tsx
├── BoardHeader.tsx
│   └── AddColumnInline.tsx
└── DndContext (drag-and-drop)
    └── Column.tsx (x N)
        ├── ColumnHeader.tsx
        ├── Card.tsx (x N)
        │   └── Priority Badge, Due Date, etc.
        └── AddCardInline.tsx
    └── CardDetailPanel.tsx (Slide-over)
        └── SubtaskList.tsx
            └── SubtaskItem.tsx
```

### State Management

**Zustand Stores**:
- `board-store.ts`: Active board, column order, drag state
- `ui-store.ts`: Sidebar open, command palette, modals

**React Query**:
- All server data fetching
- Optimistic updates
- Cache invalidation

---

## Performance Optimizations

### Bundle Size

| Metric | Target | Actual |
|--------|--------|--------|
| Initial JS | < 200KB | ~151KB |
| First Load | < 300KB | ~280KB |

**Techniques**:
- Code splitting by route
- Lazy loading components
- Tree shaking unused code
- Dynamic imports for heavy components

### Caching Strategy

| Resource | Cache | Revalidation |
|----------|-------|--------------|
| Static assets | 1 year | Immutable (hash) |
| API responses | 5 min | stale-while-revalidate |
| OpenAPI spec | 1 hour | Static |

### Database Performance

**Indexes**:
```sql
-- Frequently filtered columns
CREATE INDEX idx_projects_area_id ON projects(area_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_tasks_board_column ON tasks(board_id, column_id);
CREATE INDEX idx_reports_type_period ON reports(type, period_start);
```

---

## Security

### API Security

1. **Rate Limiting**: 100 req/min per IP
2. **Input Validation**: Zod schemas on all inputs
3. **SQL Injection**: Prevented by Supabase parameterized queries
4. **XSS**: React's default escaping + CSP headers

### Authentication Security

1. **API Keys**: SHA-256 hashed, never stored plaintext
2. **Capabilities**: Granular permission system
3. **Key Format**: `bos_` prefix for identification
4. **Key Rotation**: Supported, immediate invalidation

### Headers (Production)

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; ..."
}
```

---

## Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Edge Network                      │
├─────────────────────────────────────────────────────────────────┤
│  CDN (Static Assets)    │    Edge Functions (API)               │
│  - JS/CSS bundles       │    - /api/v1/* routes                 │
│  - Images               │    - Rate limiting                     │
│  - Fonts                │    - Auth middleware                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Cloud                              │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database    │    Realtime Server                    │
│  - 10 tables            │    - WebSocket connections            │
│  - RLS policies         │    - Live updates                     │
│  - Auto backups         │                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service key (secret) |
| `OPENAI_API_KEY` | No | For AI report summaries |

---

## Folder Structure

```
ben-os/
├── docs/                       # Documentation
│   ├── API.md                  # API reference
│   ├── MCP.md                  # MCP server guide
│   ├── AGENTS.md               # Agent onboarding
│   └── ARCHITECTURE.md         # This file
├── mcp-server/                 # MCP server for Claude
│   ├── src/
│   │   ├── index.ts            # Server entry
│   │   ├── lib/
│   │   │   └── supabase.ts     # Supabase client
│   │   └── tools/              # MCP tool implementations
│   ├── package.json
│   └── tsconfig.json
├── public/                     # Static assets
├── scripts/                    # Build/utility scripts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/v1/             # REST API routes
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── activity/           # Activity components
│   │   ├── charts/             # Visualization
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── kanban/             # Kanban board
│   │   ├── layout/             # Layout components
│   │   ├── milestones/         # Milestone components
│   │   ├── prd/                # PRD editor
│   │   ├── reports/            # Report components
│   │   ├── shared/             # Shared components
│   │   ├── subtasks/           # Subtask components
│   │   └── ui/                 # shadcn/ui
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── api/                # API helpers
│   │   │   ├── auth.ts         # Agent authentication
│   │   │   ├── helpers.ts      # Response helpers
│   │   │   ├── rate-limiter.ts # Rate limiting
│   │   │   └── index.ts
│   │   ├── supabase/           # Supabase clients
│   │   └── utils.ts            # Utilities
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
├── tests/                      # Test files
├── .env.example                # Environment template
├── .eslintrc.json              # ESLint config
├── .prettierrc                 # Prettier config
├── next.config.ts              # Next.js config
├── package.json
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
├── vercel.json                 # Vercel config
└── vitest.config.ts            # Vitest config
```

---

## Design Decisions

### Why Next.js App Router?

- Server components reduce client bundle
- Built-in API routes
- Excellent TypeScript support
- Vercel deployment optimization
- Future-proof React patterns

### Why Supabase?

- PostgreSQL with realtime capabilities
- Built-in auth (future)
- RLS for row-level security
- Generous free tier
- Direct SQL access

### Why Zustand + React Query?

- **Zustand**: Simple, fast UI state
- **React Query**: Powerful server state management
- Clear separation of concerns
- Excellent DevTools

### Why shadcn/ui?

- Copy-paste components (ownership)
- Tailwind-based styling
- Accessible by default
- Highly customizable

---

## Future Considerations

### Planned Improvements

1. **Multi-user support**: Supabase Auth integration
2. **Real-time collaboration**: Live cursors, presence
3. **Mobile app**: React Native or PWA
4. **AI enhancements**: Smart task suggestions, auto-categorization
5. **Integrations**: GitHub, Calendar, Slack

### Scalability

- **Database**: Supabase handles scaling
- **API**: Vercel edge functions auto-scale
- **Search**: Consider Supabase pg_trgm or external search
- **File storage**: Supabase Storage when needed

---

## Related Documentation

- [REST API Reference](API.md)
- [MCP Server Guide](MCP.md)
- [Agent Onboarding](AGENTS.md)
- [Main README](../README.md)
