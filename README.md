# Ben OS

> Personal Project Management System - An "Operating System for Life"

Ben OS is a Kanban-based project management environment optimized for human-AI collaboration. It enables management of personal tasks, side projects, client work, content creation, community building, and professional opportunities through a unified, intelligent interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
- [Usage Guide](#usage-guide)
  - [Organizing Your Life](#organizing-your-life)
  - [Kanban Boards](#kanban-boards)
  - [Working with Tasks](#working-with-tasks)
  - [PRD Management](#prd-management)
  - [Dashboard & Reports](#dashboard--reports)
- [AI Integration](#ai-integration)
  - [REST API](#rest-api)
  - [MCP Server](#mcp-server)
  - [Agent Authentication](#agent-authentication)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Available Scripts](#available-scripts)
  - [Testing](#testing)
  - [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

## Features

- **Hierarchical Organization**: Areas → Projects → Milestones → Tasks → Subtasks
- **Kanban Boards**: Drag-and-drop task management with customizable columns
- **PRD Management**: Create and manage Product Requirement Documents with version history
- **Progress Visualization**: Dashboards with burndown charts, velocity tracking, activity heatmaps
- **AI Integration**: REST API and MCP Server for AI agent collaboration
- **Activity Logging**: Full audit trail for all system actions
- **Full-Text Search**: Search across all entities with Cmd/Ctrl+K command palette
- **Dark/Light Mode**: Theme support with system preference detection
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + React Query (TanStack Query) |
| Drag & Drop | @dnd-kit/core |
| Charts | Recharts |
| Testing | Vitest + React Testing Library |
| Linting | ESLint + Prettier |

## Getting Started

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** or **pnpm** - Package manager
- **Supabase account** - [Sign up free](https://supabase.com/)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd ben-os
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables** (see next section)

4. **Run the development server**:

   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### Environment Setup

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: AI Features
OPENAI_API_KEY=your-openai-key  # For AI report summaries
```

#### Where to Find Supabase Keys

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **URL** and **anon/public** key for public variables
5. Copy the **service_role** key for the secret variable (keep this secure!)

### Database Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com/)

2. **Run the migrations**:
   - Go to **SQL Editor** in your Supabase dashboard
   - Run the migration files in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_prd_versions.sql`
     - `supabase/migrations/003_performance_indexes.sql`

3. **Verify tables** were created in the Table Editor:
   - `areas`, `projects`, `milestones`, `boards`, `tasks`, `subtasks`
   - `prds`, `prd_versions`, `agents`, `activity_logs`, `reports`

## Usage Guide

### Organizing Your Life

Ben OS uses a hierarchical structure to organize all aspects of your life:

```
Areas (Life Domains)
└── Projects (Initiatives)
    └── Milestones (Major Checkpoints)
        └── Tasks (Work Items)
            └── Subtasks (Inchstones)
```

**Areas** represent top-level life domains:
- `personal` - Health, learning, personal projects
- `work` - Employment, freelance clients
- `project` - Side projects, entrepreneurial ventures
- `content` - Writing, videos, podcasts
- `community` - Open source, meetups, networking
- `other` - Miscellaneous

### Kanban Boards

Each project can have one or more Kanban boards with configurable columns. Default columns:

| Column | Purpose |
|--------|---------|
| Backlog | Ideas and future work |
| To Do | Prioritized for upcoming work |
| In Progress | Currently being worked on |
| Review | Awaiting review/feedback |
| Done | Completed tasks |

**Drag-and-drop** tasks between columns to update their status. The status automatically updates to match the column.

### Working with Tasks

Tasks support rich metadata:

- **Title & Description** - What needs to be done
- **Priority** - `low`, `medium`, `high`, `critical`
- **Story Points** - Effort estimation (1-21 Fibonacci scale)
- **Due Date** - When it should be completed
- **Milestone** - Associate with a project milestone
- **PRD Link** - Link to a Product Requirement Document
- **Subtasks** - Break down into smaller steps
- **AI Context** - Metadata for AI agent collaboration

### PRD Management

Product Requirement Documents (PRDs) help plan complex features:

- Create PRDs linked to projects
- Use structured sections for requirements
- Version history tracks all changes
- Link tasks to PRD sections for traceability
- Track progress by section completion

### Dashboard & Reports

The dashboard provides an overview of your productivity:

- **Today's Focus** - Tasks due today or in progress
- **Project Health** - Status of active projects
- **Activity Feed** - Recent actions across the system
- **Milestone Countdown** - Upcoming deadlines

Generate reports:
- **Daily** - Yesterday's activity summary
- **Weekly** - Week in review with metrics
- **Monthly** - Monthly productivity analysis

## AI Integration

Ben OS is designed for human-AI collaboration, providing multiple interfaces for AI agents to interact with your task management system.

### REST API

Full REST API at `/api/v1/` with OpenAPI specification.

**Base URL**: `http://localhost:3000/api/v1` (dev) or `https://your-app.vercel.app/api/v1` (prod)

**Documentation**: GET `/api/v1/openapi.json`

**Endpoints**:
- `GET/POST /areas` - List/create areas
- `GET/PUT/DELETE /areas/:id` - Single area operations
- `GET/POST /projects` - List/create projects
- `GET/POST /milestones` - List/create milestones
- `GET/POST /tasks` - List/create tasks
- `PUT /tasks/:id/status` - Update task status
- `PUT /tasks/:id/assign` - Assign to agent
- `POST /tasks/bulk` - Bulk operations
- `GET/POST /boards` - List/create boards
- `GET/POST /prds` - List/create PRDs
- `GET/POST /reports` - List/generate reports
- `GET /search?q=...` - Full-text search

**Rate Limiting**: 100 requests/minute per IP

See [docs/API.md](docs/API.md) for full documentation with examples.

### MCP Server

The Model Context Protocol (MCP) server enables Claude and other AI assistants to interact with Ben OS directly.

**Location**: `mcp-server/`

**Available Tools**:
- `list_projects` - List all projects
- `get_board` - Get board with tasks
- `create_task` - Create a new task
- `update_task` - Update task fields
- `move_task` - Move task between columns/boards
- `get_context` - Get full task context
- `log_activity` - Record agent actions
- `search_tasks` - Search for tasks
- `generate_report` - Create a report

See [docs/MCP.md](docs/MCP.md) for setup and integration guide.

### Agent Authentication

AI agents authenticate using API keys:

1. Register an agent via the API or dashboard
2. Receive a `bos_*` prefixed API key
3. Use Bearer token authentication
4. API key is hashed (SHA-256) and stored securely

**Capabilities** control access:
- `read:tasks`, `write:tasks`, `read:projects`, etc.
- `admin` grants full access

See [docs/AGENTS.md](docs/AGENTS.md) for the complete onboarding guide.

## Development

### Project Structure

```
ben-os/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/v1/             # REST API endpoints
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout (Sidebar, Header, etc.)
│   │   ├── kanban/             # Kanban board components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── prd/                # PRD editor components
│   │   ├── milestones/         # Milestone components
│   │   ├── subtasks/           # Subtask components
│   │   ├── reports/            # Report components
│   │   ├── charts/             # Visualization components
│   │   ├── activity/           # Activity log components
│   │   └── shared/             # Shared components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   │   ├── api/                # API helpers, auth, rate limiting
│   │   └── supabase/           # Supabase client
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
├── mcp-server/                 # MCP server for AI integration
│   └── src/
│       ├── index.ts            # Server entry point
│       └── tools/              # MCP tool implementations
├── supabase/
│   └── migrations/             # Database migrations
├── tests/                      # Test files
│   ├── api/                    # API tests
│   ├── components/             # Component tests
│   ├── features/               # Feature tests
│   └── mcp/                    # MCP server tests
├── docs/                       # Documentation
│   ├── API.md                  # API documentation
│   ├── MCP.md                  # MCP server guide
│   ├── AGENTS.md               # Agent onboarding
│   └── ARCHITECTURE.md         # System architecture
└── public/                     # Static assets
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run type-check` | Check TypeScript types |
| `npm run check-bundle` | Analyze bundle size |

### Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- tests/api/tasks.test.ts
```

**Test Categories**:
- **Unit tests** - Individual components and functions
- **Integration tests** - API endpoints and database
- **Feature tests** - User flows and interactions
- **MCP tests** - MCP server tools

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

## Deployment

### Vercel Deployment

Ben OS is optimized for deployment on Vercel.

#### Quick Deploy

1. Push your code to a GitHub repository
2. Import the project in [Vercel](https://vercel.com/new)
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` (optional)
4. Deploy

#### Features

- **Preview Deployments**: Every PR gets a preview URL
- **Production Auto-Deploy**: Main branch auto-deploys to production
- **Edge Optimized**: API routes run on edge for faster response
- **Analytics**: Vercel Analytics and Speed Insights enabled

#### Production Configuration

The `vercel.json` configuration includes:
- Security headers (CSP, HSTS, etc.)
- Cache optimization
- Function timeout settings

See [vercel.json](vercel.json) for the full configuration.

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Initial Bundle | < 200KB | ✅ ~151KB |
| First Contentful Paint | < 1.5s | ✅ |
| Time to Interactive | < 3s | ✅ |
| Lighthouse Performance | > 90 | ✅ |

## Documentation

Detailed documentation is available in the `docs/` folder:

| Document | Description |
|----------|-------------|
| [API.md](docs/API.md) | REST API reference with examples |
| [MCP.md](docs/MCP.md) | MCP server setup and Claude integration |
| [AGENTS.md](docs/AGENTS.md) | AI agent onboarding guide |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and database schema |

## License

Private - All rights reserved.

## Author

Ben Cooper

---

Built with ❤️ for human-AI collaboration.
