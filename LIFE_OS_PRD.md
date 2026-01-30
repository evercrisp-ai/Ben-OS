# Ben OS - Product Requirements Document

> **Master Document Version**: 1.0.0  
> **Last Updated**: 2026-01-30  
> **Status**: Planning  
> **Owner**: Ben Cooper

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Requirements](#system-requirements)
3. [Architecture Overview](#architecture-overview)
4. [Phase 1: Foundation](#phase-1-foundation)
5. [Phase 2: Hierarchy & PRDs](#phase-2-hierarchy--prds)
6. [Phase 3: Reporting & Visualization](#phase-3-reporting--visualization)
7. [Phase 4: AI Integration](#phase-4-ai-integration)
8. [Phase 5: Polish & Deployment](#phase-5-polish--deployment)
9. [Progress Log](#progress-log)
10. [Agent Work Assignment](#agent-work-assignment)

---

## Executive Summary

Ben OS is a personal project management system designed as an "operating system for life" - a Kanban-based environment optimized for human-AI collaboration. The system enables management of personal tasks, side projects, client work, content creation, community building, and professional opportunities through a unified, intelligent interface.

### Core Principles

- **Human-AI Collaboration**: Optimized for both human users and AI agents
- **Hierarchical Organization**: Areas → Projects → Milestones → Tasks → Subtasks
- **Continuous Intelligence**: System learns and adapts to user intent over time
- **Clean Design**: Modern, intuitive UI that avoids "AI slop" aesthetics
- **Security First**: Controlled access for AI agents with full audit trails

### Success Metrics

- [ ] All 5 phases complete with passing tests
- [ ] 100% of acceptance criteria met per phase
- [ ] Zero critical bugs in production
- [ ] Sub-2 second page load times
- [ ] AI agents can perform all documented operations

---

## System Requirements

### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-001 | Kanban board with drag-and-drop | Critical | ⬜ Pending |
| FR-002 | Multiple boards per project | High | ⬜ Pending |
| FR-003 | Hierarchical task organization (Areas/Projects/Milestones/Tasks/Subtasks) | Critical | ⬜ Pending |
| FR-004 | PRD creation and management | High | ⬜ Pending |
| FR-005 | PRD to task breakdown | High | ⬜ Pending |
| FR-006 | Daily/Weekly/Monthly reports | High | ⬜ Pending |
| FR-007 | Progress visualization dashboards | High | ⬜ Pending |
| FR-008 | REST API for AI agents | Critical | ⬜ Pending |
| FR-009 | MCP Server for Claude integration | High | ⬜ Pending |
| FR-010 | Agent authentication and API keys | Critical | ⬜ Pending |
| FR-011 | Activity logging and audit trail | High | ⬜ Pending |
| FR-012 | Real-time updates | Medium | ⬜ Pending |
| FR-013 | Dark/Light mode | Medium | ⬜ Pending |
| FR-014 | Command palette (Cmd+K) | Medium | ⬜ Pending |
| FR-015 | Keyboard shortcuts | Medium | ⬜ Pending |

### Non-Functional Requirements

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-001 | Page load time | < 2 seconds | ⬜ Pending |
| NFR-002 | API response time | < 500ms | ⬜ Pending |
| NFR-003 | Uptime | 99.9% | ⬜ Pending |
| NFR-004 | Mobile responsive | Tablet+ | ⬜ Pending |
| NFR-005 | Accessibility | WCAG 2.1 AA | ⬜ Pending |
| NFR-006 | Security | OWASP Top 10 | ⬜ Pending |

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand + React Query
- **Drag & Drop**: @dnd-kit/core
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library + Playwright
- **Deployment**: Vercel

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard  │  Kanban Board  │  PRD Editor  │  Reports/Charts   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                       API LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│     Next.js API Routes (/api/v1/*)     │     MCP Server         │
└──────────────────────────┬─────────────────────┬────────────────┘
                           │                     │
┌──────────────────────────┴─────────────────────┴────────────────┐
│                     SUPABASE BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL  │  Auth  │  Realtime  │  Storage  │  Edge Functions│
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                      AI AGENTS                                   │
├─────────────────────────────────────────────────────────────────┤
│      Primary Agent (Persistent)    │    Task Agents (Ephemeral) │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Core entities (simplified view)
areas (id, name, color, icon, type, created_at, updated_at)
projects (id, area_id, title, description, status, target_date, metadata)
milestones (id, project_id, title, description, order, target_date, status)
tasks (id, milestone_id, board_id, column_id, prd_id, title, description, status, priority, story_points, assigned_agent, ai_context, position)
subtasks (id, task_id, title, completed, position)
boards (id, project_id, name, column_config)
prds (id, project_id, title, content, status, sections)
agents (id, name, type, capabilities, api_key_hash, is_active)
activity_logs (id, entity_type, entity_id, agent_id, action, payload, created_at)
reports (id, type, period_start, period_end, content, generated_at)
```

---

## Phase 1: Foundation

**Objective**: Establish the core project structure, database schema, and basic Kanban functionality.

**Estimated Effort**: Foundation layer  
**Dependencies**: None  
**Status**: ⬜ Not Started

### Phase 1 Review Checklist

After completing ALL subsections of Phase 1:

- [ ] All Phase 1 unit tests passing
- [ ] All Phase 1 integration tests passing
- [ ] Code review completed for all Phase 1 files
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] All FR requirements for Phase 1 marked complete
- [ ] Manual testing completed on local environment
- [ ] Documentation updated

---

### 1.1 Project Initialization

**Objective**: Set up Next.js project with all dependencies and configuration.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 1.1.1 | Initialize Next.js 14+ with App Router | `npx create-next-app` completes successfully with TypeScript |
| 1.1.2 | Configure TypeScript strict mode | `tsconfig.json` has `strict: true` |
| 1.1.3 | Install and configure Tailwind CSS | Tailwind classes work in components |
| 1.1.4 | Install shadcn/ui | `npx shadcn-ui@latest init` completes, components available |
| 1.1.5 | Install core dependencies | All packages in `package.json`, no security vulnerabilities |
| 1.1.6 | Configure ESLint and Prettier | Linting runs without errors on generated code |
| 1.1.7 | Set up testing framework (Vitest) | `npm run test` executes successfully |
| 1.1.8 | Create folder structure | All directories exist per architecture spec |
| 1.1.9 | Create README with setup instructions | README includes all setup steps |
| 1.1.10 | Initialize Git repository | `.git` exists, initial commit made |

#### Unit Tests

```typescript
// tests/setup/project-init.test.ts

describe('1.1 Project Initialization', () => {
  test('1.1.1 Next.js project structure exists', () => {
    expect(fs.existsSync('src/app')).toBe(true);
    expect(fs.existsSync('src/app/layout.tsx')).toBe(true);
    expect(fs.existsSync('src/app/page.tsx')).toBe(true);
  });

  test('1.1.2 TypeScript strict mode enabled', () => {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  test('1.1.3 Tailwind CSS configured', () => {
    expect(fs.existsSync('tailwind.config.ts')).toBe(true);
    const content = fs.readFileSync('src/app/globals.css', 'utf-8');
    expect(content).toContain('@tailwind');
  });

  test('1.1.4 shadcn/ui initialized', () => {
    expect(fs.existsSync('components.json')).toBe(true);
    expect(fs.existsSync('src/components/ui')).toBe(true);
  });

  test('1.1.5 Core dependencies installed', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    expect(pkg.dependencies['@supabase/supabase-js']).toBeDefined();
    expect(pkg.dependencies['zustand']).toBeDefined();
    expect(pkg.dependencies['@tanstack/react-query']).toBeDefined();
    expect(pkg.dependencies['@dnd-kit/core']).toBeDefined();
  });

  test('1.1.6 ESLint configured', () => {
    expect(fs.existsSync('.eslintrc.json') || fs.existsSync('eslint.config.js')).toBe(true);
  });

  test('1.1.7 Vitest configured', () => {
    expect(fs.existsSync('vitest.config.ts')).toBe(true);
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    expect(pkg.scripts.test).toBeDefined();
  });

  test('1.1.8 Folder structure complete', () => {
    const requiredDirs = [
      'src/app',
      'src/components',
      'src/components/ui',
      'src/lib',
      'src/hooks',
      'src/stores',
      'src/types',
    ];
    requiredDirs.forEach(dir => {
      expect(fs.existsSync(dir)).toBe(true);
    });
  });

  test('1.1.9 README exists with content', () => {
    expect(fs.existsSync('README.md')).toBe(true);
    const content = fs.readFileSync('README.md', 'utf-8');
    expect(content.length).toBeGreaterThan(100);
  });

  test('1.1.10 Git repository initialized', () => {
    expect(fs.existsSync('.git')).toBe(true);
  });
});
```

#### Completion Checklist

- [ ] All 10 unit tests passing
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] `npm run type-check` passes

#### Section 1.1 Review Notes

> *To be filled after completion*

---

### 1.2 Supabase Setup & Database Schema

**Objective**: Configure Supabase and create the complete database schema with RLS policies.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 1.2.1 | Create Supabase project | Project exists in Supabase dashboard |
| 1.2.2 | Configure environment variables | `.env.local` has all Supabase credentials |
| 1.2.3 | Create `areas` table | Table exists with correct columns and constraints |
| 1.2.4 | Create `projects` table | Table exists with FK to areas |
| 1.2.5 | Create `milestones` table | Table exists with FK to projects |
| 1.2.6 | Create `boards` table | Table exists with FK to projects |
| 1.2.7 | Create `tasks` table | Table exists with all FKs |
| 1.2.8 | Create `subtasks` table | Table exists with FK to tasks |
| 1.2.9 | Create `prds` table | Table exists with FK to projects |
| 1.2.10 | Create `agents` table | Table exists with API key hash column |
| 1.2.11 | Create `activity_logs` table | Table exists with all tracking columns |
| 1.2.12 | Create `reports` table | Table exists for storing generated reports |
| 1.2.13 | Set up RLS policies | All tables have appropriate policies |
| 1.2.14 | Create Supabase client utility | `src/lib/supabase/client.ts` exports configured client |
| 1.2.15 | Create database types | TypeScript types generated from schema |

#### Database Migration SQL

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AREAS: Top-level life domains
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  icon VARCHAR(50),
  type VARCHAR(50) NOT NULL CHECK (type IN ('personal', 'work', 'project', 'content', 'community', 'other')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROJECTS: Specific initiatives within areas
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  target_date DATE,
  metadata JSONB DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MILESTONES: Major checkpoints within projects
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  target_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BOARDS: Kanban boards for projects
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  column_config JSONB NOT NULL DEFAULT '[
    {"id": "backlog", "name": "Backlog", "position": 0},
    {"id": "todo", "name": "To Do", "position": 1},
    {"id": "in_progress", "name": "In Progress", "position": 2},
    {"id": "review", "name": "Review", "position": 3},
    {"id": "done", "name": "Done", "position": 4}
  ]',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PRDS: Product Requirement Documents
CREATE TABLE prds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed')),
  sections JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AGENTS: AI agents that can interact with the system
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'task' CHECK (type IN ('primary', 'task')),
  capabilities JSONB DEFAULT '[]',
  api_key_hash VARCHAR(64) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TASKS: Actionable work items
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  prd_id UUID REFERENCES prds(id) ON DELETE SET NULL,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  story_points INTEGER CHECK (story_points >= 0 AND story_points <= 21),
  ai_context JSONB DEFAULT '{}',
  column_id VARCHAR(50) NOT NULL DEFAULT 'backlog',
  position INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUBTASKS: Granular steps within tasks (inchstones)
CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ACTIVITY_LOGS: Audit trail for all actions
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  user_initiated BOOLEAN NOT NULL DEFAULT false,
  action VARCHAR(100) NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REPORTS: Generated reports storage
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  content JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX idx_projects_area_id ON projects(area_id);
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_boards_project_id ON boards(project_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_milestone_id ON tasks(milestone_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_column_id ON tasks(column_id);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_reports_type_period ON reports(type, period_start);

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_prds_updated_at BEFORE UPDATE ON prds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS POLICIES (basic setup - single user mode)
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prds ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (will be refined when auth is added)
CREATE POLICY "Allow all for authenticated" ON areas FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON milestones FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON boards FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON subtasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON prds FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON reports FOR ALL USING (true);
```

#### Unit Tests

```typescript
// tests/database/schema.test.ts

describe('1.2 Database Schema', () => {
  test('1.2.1 Supabase client can connect', async () => {
    const { data, error } = await supabase.from('areas').select('count');
    expect(error).toBeNull();
  });

  test('1.2.2 Environment variables configured', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  test('1.2.3 Areas table exists with correct schema', async () => {
    const { data, error } = await supabase.from('areas').select('*').limit(0);
    expect(error).toBeNull();
  });

  test('1.2.4 Projects table has FK to areas', async () => {
    const area = await createTestArea();
    const { data, error } = await supabase.from('projects').insert({
      area_id: area.id,
      title: 'Test Project'
    }).select().single();
    expect(error).toBeNull();
    expect(data.area_id).toBe(area.id);
  });

  test('1.2.5-1.2.12 All tables exist', async () => {
    const tables = ['areas', 'projects', 'milestones', 'boards', 'tasks', 
                    'subtasks', 'prds', 'agents', 'activity_logs', 'reports'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0);
      expect(error).toBeNull();
    }
  });

  test('1.2.14 Supabase client utility exports', () => {
    expect(typeof supabase).toBe('object');
    expect(supabase.from).toBeDefined();
  });

  test('1.2.15 TypeScript types exist', () => {
    // Type imports should not throw
    expect(() => require('@/types/database')).not.toThrow();
  });
});
```

#### Completion Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] All 12 tables created
- [ ] All indexes created
- [ ] All triggers working
- [ ] RLS policies applied
- [ ] Supabase client utility works
- [ ] TypeScript types generated
- [ ] All unit tests passing

#### Section 1.2 Review Notes

> *To be filled after completion*

---

### 1.3 Base UI Layout

**Objective**: Create the core application layout with sidebar, header, command palette, and theming.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 1.3.1 | Create root layout with providers | Layout wraps all pages with necessary providers |
| 1.3.2 | Implement sidebar navigation | Sidebar shows areas, projects, quick actions |
| 1.3.3 | Create header component | Header shows breadcrumbs, user menu, theme toggle |
| 1.3.4 | Implement dark/light mode | Theme persists across sessions, respects system preference |
| 1.3.5 | Create command palette (Cmd+K) | Palette opens on shortcut, searches across entities |
| 1.3.6 | Set up keyboard shortcuts system | Shortcuts work globally, documented |
| 1.3.7 | Create loading states | Skeleton loaders for all major sections |
| 1.3.8 | Create error boundaries | Errors caught and displayed gracefully |
| 1.3.9 | Implement toast notifications | Toasts appear for success/error/info states |
| 1.3.10 | Create responsive layout | Layout works on desktop and tablet |

#### Component Specifications

**Sidebar (`src/components/layout/Sidebar.tsx`)**
- Width: 256px (collapsible to 64px)
- Sections: Areas list, Projects quick access, Quick actions
- Footer: Settings, Help, Collapse toggle

**Header (`src/components/layout/Header.tsx`)**
- Height: 64px
- Left: Breadcrumbs (current location)
- Right: Search, Theme toggle, User menu

**Command Palette (`src/components/layout/CommandPalette.tsx`)**
- Trigger: Cmd+K (Mac) / Ctrl+K (Windows)
- Sections: Recent, Projects, Tasks, Actions
- Fuzzy search across all entities

#### Unit Tests

```typescript
// tests/components/layout.test.tsx

describe('1.3 Base UI Layout', () => {
  test('1.3.1 Root layout renders with providers', () => {
    render(<RootLayout><div>Test</div></RootLayout>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('1.3.2 Sidebar renders navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('1.3.3 Header renders with breadcrumbs', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  test('1.3.4 Theme toggle switches modes', async () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    const toggle = screen.getByRole('button', { name: /theme/i });
    await userEvent.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('1.3.5 Command palette opens on Cmd+K', async () => {
    render(<CommandPalette />);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('1.3.6 Keyboard shortcuts registered', () => {
    expect(getRegisteredShortcuts()).toContain('mod+k');
  });

  test('1.3.7 Loading skeleton renders', () => {
    render(<Skeleton />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  test('1.3.8 Error boundary catches errors', () => {
    const ThrowError = () => { throw new Error('Test'); };
    render(<ErrorBoundary><ThrowError /></ErrorBoundary>);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('1.3.9 Toast notifications display', async () => {
    const { toast } = useToast();
    act(() => toast({ title: 'Test toast' }));
    expect(await screen.findByText('Test toast')).toBeInTheDocument();
  });

  test('1.3.10 Layout is responsive', () => {
    render(<Layout />);
    // Check responsive classes are applied
    expect(screen.getByTestId('main-layout')).toHaveClass('md:ml-64');
  });
});
```

#### Completion Checklist

- [ ] Root layout with all providers
- [ ] Sidebar with collapsible state
- [ ] Header with breadcrumbs
- [ ] Dark/light mode working
- [ ] Command palette functional
- [ ] Keyboard shortcuts working
- [ ] Loading skeletons implemented
- [ ] Error boundaries catching errors
- [ ] Toast system working
- [ ] Responsive on tablet+
- [ ] All unit tests passing

#### Section 1.3 Review Notes

> *To be filled after completion*

---

### 1.4 Kanban Board Implementation

**Objective**: Build the core Kanban board with drag-and-drop functionality.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 1.4.1 | Create Board component | Board renders columns and cards |
| 1.4.2 | Create Column component | Column renders header and card list |
| 1.4.3 | Create Card component | Card displays task summary |
| 1.4.4 | Implement drag-and-drop for cards | Cards can be dragged between columns |
| 1.4.5 | Implement drag-and-drop for columns | Columns can be reordered |
| 1.4.6 | Optimistic updates on drag | UI updates immediately, syncs in background |
| 1.4.7 | Quick-add card inline | Can add card without opening modal |
| 1.4.8 | Card detail panel/modal | Click card opens detail view |
| 1.4.9 | Column add/edit/delete | Can manage columns |
| 1.4.10 | Board filtering | Filter by priority, assignee, tags |
| 1.4.11 | Board search | Search cards within board |
| 1.4.12 | Keyboard navigation | Navigate and move cards with keyboard |

#### Component Hierarchy

```
Board
├── BoardHeader (title, filters, search)
├── ColumnContainer (DnD context)
│   └── Column (multiple)
│       ├── ColumnHeader (title, count, menu)
│       ├── CardList (droppable)
│       │   └── Card (draggable, multiple)
│       └── AddCardInline
└── CardDetailPanel (slide-over or modal)
```

#### Unit Tests

```typescript
// tests/components/kanban.test.tsx

describe('1.4 Kanban Board', () => {
  test('1.4.1 Board renders columns', () => {
    render(<Board board={mockBoard} />);
    expect(screen.getAllByTestId('column')).toHaveLength(5);
  });

  test('1.4.2 Column renders cards', () => {
    render(<Column column={mockColumn} cards={mockCards} />);
    expect(screen.getAllByTestId('card')).toHaveLength(mockCards.length);
  });

  test('1.4.3 Card displays task info', () => {
    render(<Card task={mockTask} />);
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    expect(screen.getByText(mockTask.priority)).toBeInTheDocument();
  });

  test('1.4.4 Cards can be dragged between columns', async () => {
    render(<Board board={mockBoard} />);
    const card = screen.getByTestId(`card-${mockTask.id}`);
    const targetColumn = screen.getByTestId('column-in_progress');
    
    await dragAndDrop(card, targetColumn);
    
    expect(targetColumn).toContainElement(card);
  });

  test('1.4.5 Columns can be reordered', async () => {
    render(<Board board={mockBoard} />);
    const column = screen.getByTestId('column-todo');
    const targetPosition = screen.getByTestId('column-done');
    
    await dragAndDrop(column, targetPosition);
    
    // Check order updated
  });

  test('1.4.6 Optimistic update on drag', async () => {
    const onUpdate = vi.fn();
    render(<Board board={mockBoard} onUpdate={onUpdate} />);
    
    // Drag card
    await dragCard();
    
    // UI updates immediately
    expect(screen.getByTestId('card-moved')).toBeInTheDocument();
    
    // API called
    expect(onUpdate).toHaveBeenCalled();
  });

  test('1.4.7 Quick-add card works', async () => {
    render(<Column column={mockColumn} />);
    
    await userEvent.click(screen.getByText('Add card'));
    await userEvent.type(screen.getByPlaceholderText('Card title'), 'New task');
    await userEvent.keyboard('{Enter}');
    
    expect(screen.getByText('New task')).toBeInTheDocument();
  });

  test('1.4.8 Card detail opens on click', async () => {
    render(<Board board={mockBoard} />);
    
    await userEvent.click(screen.getByTestId(`card-${mockTask.id}`));
    
    expect(screen.getByTestId('card-detail-panel')).toBeInTheDocument();
  });

  test('1.4.9 Column can be added', async () => {
    render(<Board board={mockBoard} />);
    
    await userEvent.click(screen.getByText('Add column'));
    await userEvent.type(screen.getByPlaceholderText('Column name'), 'Testing');
    await userEvent.click(screen.getByText('Create'));
    
    expect(screen.getByText('Testing')).toBeInTheDocument();
  });

  test('1.4.10 Board filtering works', async () => {
    render(<Board board={mockBoard} />);
    
    await userEvent.click(screen.getByTestId('filter-priority'));
    await userEvent.click(screen.getByText('High'));
    
    const cards = screen.getAllByTestId(/^card-/);
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-priority', 'high');
    });
  });

  test('1.4.11 Board search filters cards', async () => {
    render(<Board board={mockBoard} />);
    
    await userEvent.type(screen.getByPlaceholderText('Search cards'), 'bug');
    
    const cards = screen.getAllByTestId(/^card-/);
    expect(cards.length).toBeLessThan(mockCards.length);
  });

  test('1.4.12 Keyboard navigation works', async () => {
    render(<Board board={mockBoard} />);
    
    // Focus first card
    screen.getByTestId(`card-${mockTask.id}`).focus();
    
    // Arrow right should move to next column
    await userEvent.keyboard('{ArrowRight}');
    
    expect(mockTask.column_id).toBe('todo');
  });
});
```

#### Completion Checklist

- [ ] Board component renders correctly
- [ ] Column component with cards
- [ ] Card component with task info
- [ ] Drag-and-drop between columns works
- [ ] Column reordering works
- [ ] Optimistic updates functioning
- [ ] Quick-add card inline
- [ ] Card detail panel opens
- [ ] Column CRUD operations
- [ ] Filtering works
- [ ] Search works
- [ ] Keyboard navigation
- [ ] All unit tests passing
- [ ] Performance acceptable (60fps during drag)

#### Section 1.4 Review Notes

> *To be filled after completion*

---

### 1.5 CRUD Operations for Core Entities

**Objective**: Implement create, read, update, delete operations for areas, projects, milestones, and tasks.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 1.5.1 | Areas CRUD | Can create, read, update, delete areas |
| 1.5.2 | Projects CRUD | Can create, read, update, delete projects |
| 1.5.3 | Milestones CRUD | Can create, read, update, delete milestones |
| 1.5.4 | Tasks CRUD | Can create, read, update, delete tasks |
| 1.5.5 | Subtasks CRUD | Can create, read, update, delete subtasks |
| 1.5.6 | Boards CRUD | Can create, read, update, delete boards |
| 1.5.7 | React Query integration | All operations use React Query for caching |
| 1.5.8 | Optimistic updates | UI updates immediately on mutations |
| 1.5.9 | Error handling | Errors displayed to user, rollback on failure |
| 1.5.10 | Activity logging | All mutations logged to activity_logs |

#### API Hooks Structure

```typescript
// src/hooks/use-areas.ts
useAreas() // List all areas
useArea(id) // Get single area
useCreateArea() // Create mutation
useUpdateArea() // Update mutation
useDeleteArea() // Delete mutation

// Similar pattern for projects, milestones, tasks, subtasks, boards
```

#### Unit Tests

```typescript
// tests/hooks/crud.test.ts

describe('1.5 CRUD Operations', () => {
  describe('Areas', () => {
    test('1.5.1a Can create area', async () => {
      const { result } = renderHook(() => useCreateArea());
      
      await act(async () => {
        await result.current.mutateAsync({
          name: 'Test Area',
          type: 'personal',
          color: '#6366f1'
        });
      });
      
      expect(result.current.isSuccess).toBe(true);
    });

    test('1.5.1b Can read areas', async () => {
      const { result, waitFor } = renderHook(() => useAreas());
      
      await waitFor(() => result.current.isSuccess);
      
      expect(result.current.data).toBeInstanceOf(Array);
    });

    test('1.5.1c Can update area', async () => {
      const { result } = renderHook(() => useUpdateArea());
      
      await act(async () => {
        await result.current.mutateAsync({
          id: testAreaId,
          name: 'Updated Name'
        });
      });
      
      expect(result.current.isSuccess).toBe(true);
    });

    test('1.5.1d Can delete area', async () => {
      const { result } = renderHook(() => useDeleteArea());
      
      await act(async () => {
        await result.current.mutateAsync(testAreaId);
      });
      
      expect(result.current.isSuccess).toBe(true);
    });
  });

  // Similar tests for Projects (1.5.2), Milestones (1.5.3), 
  // Tasks (1.5.4), Subtasks (1.5.5), Boards (1.5.6)

  test('1.5.7 React Query caching works', async () => {
    const { result: first } = renderHook(() => useAreas());
    await waitFor(() => first.current.isSuccess);
    
    const { result: second } = renderHook(() => useAreas());
    
    // Second call should use cached data
    expect(second.current.isSuccess).toBe(true);
    expect(second.current.isFetching).toBe(false);
  });

  test('1.5.8 Optimistic updates work', async () => {
    const { result } = renderHook(() => {
      const areas = useAreas();
      const create = useCreateArea();
      return { areas, create };
    });
    
    act(() => {
      result.current.create.mutate({ name: 'Optimistic', type: 'personal' });
    });
    
    // Should appear immediately (optimistically)
    expect(result.current.areas.data).toContainEqual(
      expect.objectContaining({ name: 'Optimistic' })
    );
  });

  test('1.5.9 Error handling shows toast', async () => {
    // Mock network failure
    server.use(rest.post('/api/areas', (req, res, ctx) => {
      return res(ctx.status(500));
    }));
    
    const { result } = renderHook(() => useCreateArea());
    
    await act(async () => {
      try {
        await result.current.mutateAsync({ name: 'Fail' });
      } catch (e) {}
    });
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('1.5.10 Activity logging records mutations', async () => {
    await createArea({ name: 'Logged Area' });
    
    const logs = await getActivityLogs('areas', newAreaId);
    
    expect(logs).toContainEqual(
      expect.objectContaining({
        action: 'create',
        entity_type: 'areas'
      })
    );
  });
});
```

#### Completion Checklist

- [ ] Areas CRUD complete
- [ ] Projects CRUD complete
- [ ] Milestones CRUD complete
- [ ] Tasks CRUD complete
- [ ] Subtasks CRUD complete
- [ ] Boards CRUD complete
- [ ] React Query integration working
- [ ] Optimistic updates working
- [ ] Error handling with toasts
- [ ] Activity logging for all mutations
- [ ] All unit tests passing

#### Section 1.5 Review Notes

> *To be filled after completion*

---

### Phase 1 System Review

**Status**: ⬜ Not Started

After completing all Phase 1 subsections (1.1 - 1.5), perform a comprehensive review:

#### Full Test Suite

```bash
npm run test           # All unit tests
npm run test:e2e       # Playwright E2E tests
npm run lint           # ESLint
npm run type-check     # TypeScript
npm run build          # Production build
```

#### Manual Testing Checklist

- [ ] Application starts without errors
- [ ] Can navigate between pages
- [ ] Sidebar shows areas and projects
- [ ] Dark mode toggle works
- [ ] Command palette opens and searches
- [ ] Can create a new area
- [ ] Can create a project in an area
- [ ] Can create a board in a project
- [ ] Kanban board renders with columns
- [ ] Can create tasks via quick-add
- [ ] Can drag tasks between columns
- [ ] Can open task detail view
- [ ] Data persists after refresh
- [ ] No console errors
- [ ] No TypeScript errors

#### Performance Checks

- [ ] Page load under 2 seconds
- [ ] Drag-and-drop is smooth (60fps)
- [ ] No memory leaks detected

#### Phase 1 Review Notes

> *Reviewer:*  
> *Date:*  
> *Status:*  
> *Issues Found:*  
> *Resolution:*

---

## Phase 2: Hierarchy & PRDs

**Objective**: Extend the system with full hierarchical organization and PRD workflow.

**Estimated Effort**: Feature expansion  
**Dependencies**: Phase 1 complete  
**Status**: ⬜ Not Started

### Phase 2 Review Checklist

After completing ALL subsections of Phase 2:

- [ ] All Phase 2 unit tests passing
- [ ] All Phase 2 integration tests passing
- [ ] Phase 1 tests still passing (regression)
- [ ] Code review completed
- [ ] No TypeScript/ESLint errors
- [ ] All FR requirements for Phase 2 marked complete
- [ ] Manual testing completed
- [ ] Documentation updated

---

### 2.1 Milestone Management

**Objective**: Implement milestone creation, tracking, and visualization within projects.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 2.1.1 | Milestone list view | Shows all milestones in a project |
| 2.1.2 | Milestone create/edit form | Form captures title, description, target date |
| 2.1.3 | Milestone progress indicator | Shows % complete based on tasks |
| 2.1.4 | Link tasks to milestones | Tasks can be assigned to a milestone |
| 2.1.5 | Milestone timeline view | Visual timeline of milestones |
| 2.1.6 | Milestone status transitions | Can move through pending → in_progress → completed |
| 2.1.7 | Milestone filtering on board | Filter kanban by milestone |

#### Unit Tests

```typescript
// tests/features/milestones.test.tsx

describe('2.1 Milestone Management', () => {
  test('2.1.1 Milestone list renders', async () => {
    render(<MilestoneList projectId={testProjectId} />);
    await waitFor(() => {
      expect(screen.getAllByTestId(/milestone-/)).toHaveLength(3);
    });
  });

  test('2.1.2 Can create milestone', async () => {
    render(<MilestoneForm projectId={testProjectId} />);
    
    await userEvent.type(screen.getByLabelText('Title'), 'MVP Launch');
    await userEvent.type(screen.getByLabelText('Target Date'), '2026-03-15');
    await userEvent.click(screen.getByText('Create'));
    
    expect(screen.getByText('MVP Launch')).toBeInTheDocument();
  });

  test('2.1.3 Progress indicator shows correct percentage', () => {
    // 2 of 4 tasks complete = 50%
    render(<MilestoneProgress milestone={mockMilestone} tasks={mockTasks} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('2.1.4 Task can be linked to milestone', async () => {
    render(<TaskDetail task={mockTask} />);
    
    await userEvent.click(screen.getByLabelText('Milestone'));
    await userEvent.click(screen.getByText('MVP Launch'));
    
    expect(screen.getByText('MVP Launch')).toBeInTheDocument();
  });

  test('2.1.5 Timeline view renders', () => {
    render(<MilestoneTimeline projectId={testProjectId} />);
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  test('2.1.6 Status can be changed', async () => {
    render(<MilestoneCard milestone={mockMilestone} />);
    
    await userEvent.click(screen.getByText('Start'));
    
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  test('2.1.7 Board filters by milestone', async () => {
    render(<Board board={mockBoard} />);
    
    await userEvent.click(screen.getByTestId('filter-milestone'));
    await userEvent.click(screen.getByText('MVP Launch'));
    
    const cards = screen.getAllByTestId(/^card-/);
    cards.forEach(card => {
      expect(card.dataset.milestoneId).toBe(mockMilestone.id);
    });
  });
});
```

#### Completion Checklist

- [ ] Milestone list view
- [ ] Create/edit form
- [ ] Progress indicator
- [ ] Task linking
- [ ] Timeline view
- [ ] Status transitions
- [ ] Board filtering
- [ ] All unit tests passing

#### Section 2.1 Review Notes

> *To be filled after completion*

---

### 2.2 Subtasks (Inchstones)

**Objective**: Implement granular subtask tracking within tasks.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 2.2.1 | Subtask list in task detail | Shows all subtasks for a task |
| 2.2.2 | Inline subtask creation | Can add subtask without modal |
| 2.2.3 | Subtask checkbox toggle | Click to complete/uncomplete |
| 2.2.4 | Subtask reordering | Drag to reorder subtasks |
| 2.2.5 | Subtask count on card | Card shows "2/5 subtasks" |
| 2.2.6 | Progress bar on card | Visual progress of subtasks |

#### Unit Tests

```typescript
// tests/features/subtasks.test.tsx

describe('2.2 Subtasks', () => {
  test('2.2.1 Subtask list renders in task detail', () => {
    render(<TaskDetail task={mockTaskWithSubtasks} />);
    expect(screen.getAllByTestId(/subtask-/)).toHaveLength(5);
  });

  test('2.2.2 Can add subtask inline', async () => {
    render(<SubtaskList taskId={testTaskId} />);
    
    await userEvent.type(screen.getByPlaceholderText('Add subtask'), 'New step');
    await userEvent.keyboard('{Enter}');
    
    expect(screen.getByText('New step')).toBeInTheDocument();
  });

  test('2.2.3 Checkbox toggles completion', async () => {
    render(<SubtaskItem subtask={mockSubtask} />);
    
    await userEvent.click(screen.getByRole('checkbox'));
    
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('2.2.4 Subtasks can be reordered', async () => {
    render(<SubtaskList taskId={testTaskId} subtasks={mockSubtasks} />);
    
    const first = screen.getByTestId('subtask-0');
    const third = screen.getByTestId('subtask-2');
    
    await dragAndDrop(first, third);
    
    // Verify order changed
  });

  test('2.2.5 Card shows subtask count', () => {
    render(<Card task={mockTaskWithSubtasks} />);
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  test('2.2.6 Card shows progress bar', () => {
    render(<Card task={mockTaskWithSubtasks} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '40'); // 2/5 = 40%
  });
});
```

#### Completion Checklist

- [ ] Subtask list in task detail
- [ ] Inline creation
- [ ] Checkbox toggle
- [ ] Drag reordering
- [ ] Count on card
- [ ] Progress bar on card
- [ ] All unit tests passing

#### Section 2.2 Review Notes

> *To be filled after completion*

---

### 2.3 PRD Editor

**Objective**: Build a rich text PRD editor with structured sections.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 2.3.1 | PRD list view | Shows all PRDs for a project |
| 2.3.2 | Rich text editor | Markdown or WYSIWYG editing |
| 2.3.3 | Section templates | Pre-defined sections (Problem, Solution, etc.) |
| 2.3.4 | PRD status workflow | draft → approved → in_progress → completed |
| 2.3.5 | Auto-save | Content saves automatically |
| 2.3.6 | Version history | Can view previous versions |
| 2.3.7 | Export to Markdown | Can export PRD as .md file |

#### PRD Section Template

```typescript
const PRD_SECTIONS = [
  { id: 'problem', title: 'Problem Statement', placeholder: 'What problem are we solving?' },
  { id: 'solution', title: 'Proposed Solution', placeholder: 'How will we solve it?' },
  { id: 'requirements', title: 'Requirements', placeholder: 'What must the solution include?' },
  { id: 'non-goals', title: 'Non-Goals', placeholder: 'What are we explicitly NOT doing?' },
  { id: 'success-metrics', title: 'Success Metrics', placeholder: 'How will we measure success?' },
  { id: 'timeline', title: 'Timeline', placeholder: 'Key milestones and dates' },
  { id: 'open-questions', title: 'Open Questions', placeholder: 'What needs to be resolved?' },
];
```

#### Unit Tests

```typescript
// tests/features/prd-editor.test.tsx

describe('2.3 PRD Editor', () => {
  test('2.3.1 PRD list renders', async () => {
    render(<PRDList projectId={testProjectId} />);
    await waitFor(() => {
      expect(screen.getAllByTestId(/prd-/)).toHaveLength(2);
    });
  });

  test('2.3.2 Rich text editing works', async () => {
    render(<PRDEditor prd={mockPRD} />);
    
    const editor = screen.getByRole('textbox');
    await userEvent.type(editor, '# Heading\n\nParagraph text');
    
    expect(screen.getByRole('heading')).toHaveTextContent('Heading');
  });

  test('2.3.3 Section templates available', () => {
    render(<PRDEditor prd={newPRD} />);
    
    PRD_SECTIONS.forEach(section => {
      expect(screen.getByText(section.title)).toBeInTheDocument();
    });
  });

  test('2.3.4 Status can be changed', async () => {
    render(<PRDEditor prd={mockPRD} />);
    
    await userEvent.click(screen.getByText('Approve'));
    
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  test('2.3.5 Auto-save triggers', async () => {
    const onSave = vi.fn();
    render(<PRDEditor prd={mockPRD} onSave={onSave} />);
    
    await userEvent.type(screen.getByRole('textbox'), 'New content');
    
    // Wait for debounce
    await waitFor(() => expect(onSave).toHaveBeenCalled(), { timeout: 2000 });
  });

  test('2.3.6 Version history shows', async () => {
    render(<PRDEditor prd={mockPRDWithHistory} />);
    
    await userEvent.click(screen.getByText('History'));
    
    expect(screen.getByTestId('version-list')).toBeInTheDocument();
  });

  test('2.3.7 Export generates markdown', async () => {
    render(<PRDEditor prd={mockPRD} />);
    
    await userEvent.click(screen.getByText('Export'));
    
    expect(mockDownload).toHaveBeenCalledWith(
      expect.stringContaining('.md'),
      expect.any(String)
    );
  });
});
```

#### Completion Checklist

- [ ] PRD list view
- [ ] Rich text editor working
- [ ] Section templates
- [ ] Status workflow
- [ ] Auto-save
- [ ] Version history
- [ ] Markdown export
- [ ] All unit tests passing

#### Section 2.3 Review Notes

> *To be filled after completion*

---

### 2.4 PRD to Task Linking

**Objective**: Enable breakdown of PRDs into linked tasks.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 2.4.1 | Generate tasks from PRD | Button to create task stubs from PRD |
| 2.4.2 | Link existing tasks to PRD | Can associate any task with a PRD |
| 2.4.3 | View linked tasks in PRD | PRD shows list of associated tasks |
| 2.4.4 | PRD completion based on tasks | PRD status updates based on task completion |
| 2.4.5 | Traceability view | See which PRD requirements map to which tasks |

#### Unit Tests

```typescript
// tests/features/prd-tasks.test.tsx

describe('2.4 PRD to Task Linking', () => {
  test('2.4.1 Can generate tasks from PRD', async () => {
    render(<PRDEditor prd={mockPRD} />);
    
    await userEvent.click(screen.getByText('Generate Tasks'));
    
    // Should create tasks based on requirements section
    expect(screen.getByText('Task created')).toBeInTheDocument();
  });

  test('2.4.2 Can link existing task to PRD', async () => {
    render(<TaskDetail task={mockTask} />);
    
    await userEvent.click(screen.getByLabelText('Link to PRD'));
    await userEvent.click(screen.getByText(mockPRD.title));
    
    expect(screen.getByText('Linked to PRD')).toBeInTheDocument();
  });

  test('2.4.3 PRD shows linked tasks', () => {
    render(<PRDEditor prd={mockPRDWithTasks} />);
    
    expect(screen.getByTestId('linked-tasks')).toBeInTheDocument();
    expect(screen.getAllByTestId(/linked-task-/)).toHaveLength(3);
  });

  test('2.4.4 PRD completion updates with tasks', () => {
    render(<PRDProgress prd={mockPRDWithTasks} />);
    
    // 2/3 tasks complete
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  test('2.4.5 Traceability matrix renders', () => {
    render(<PRDTraceability prd={mockPRDWithTasks} />);
    
    expect(screen.getByTestId('traceability-matrix')).toBeInTheDocument();
  });
});
```

#### Completion Checklist

- [ ] Task generation from PRD
- [ ] Link existing tasks
- [ ] Linked tasks view
- [ ] Completion tracking
- [ ] Traceability view
- [ ] All unit tests passing

#### Section 2.4 Review Notes

> *To be filled after completion*

---

### 2.5 Task Detail Panel

**Objective**: Build comprehensive task editing and viewing panel.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 2.5.1 | Slide-over panel | Panel slides in from right |
| 2.5.2 | Edit all task fields | Can modify title, description, priority, etc. |
| 2.5.3 | Subtasks section | Inline subtask management |
| 2.5.4 | Activity feed | Shows history of changes |
| 2.5.5 | AI context section | View/edit AI-relevant context |
| 2.5.6 | Assign to agent | Can assign task to an AI agent |
| 2.5.7 | Due date picker | Calendar for selecting due date |
| 2.5.8 | Story points | Estimate with Fibonacci points |

#### Unit Tests

```typescript
// tests/features/task-detail.test.tsx

describe('2.5 Task Detail Panel', () => {
  test('2.5.1 Panel slides in', async () => {
    render(<Board board={mockBoard} />);
    
    await userEvent.click(screen.getByTestId(`card-${mockTask.id}`));
    
    expect(screen.getByTestId('task-detail-panel')).toHaveClass('slide-in');
  });

  test('2.5.2 Can edit all fields', async () => {
    render(<TaskDetailPanel task={mockTask} />);
    
    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'Updated Title');
    await userEvent.click(screen.getByText('Save'));
    
    expect(mockUpdateTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated Title' })
    );
  });

  test('2.5.3 Subtasks section works', () => {
    render(<TaskDetailPanel task={mockTaskWithSubtasks} />);
    expect(screen.getByTestId('subtasks-section')).toBeInTheDocument();
  });

  test('2.5.4 Activity feed shows history', () => {
    render(<TaskDetailPanel task={mockTaskWithActivity} />);
    expect(screen.getAllByTestId(/activity-/)).toHaveLength(5);
  });

  test('2.5.5 AI context section exists', () => {
    render(<TaskDetailPanel task={mockTask} />);
    expect(screen.getByTestId('ai-context-section')).toBeInTheDocument();
  });

  test('2.5.6 Can assign to agent', async () => {
    render(<TaskDetailPanel task={mockTask} />);
    
    await userEvent.click(screen.getByLabelText('Assign to'));
    await userEvent.click(screen.getByText('Primary Agent'));
    
    expect(screen.getByText('Primary Agent')).toBeInTheDocument();
  });

  test('2.5.7 Due date picker works', async () => {
    render(<TaskDetailPanel task={mockTask} />);
    
    await userEvent.click(screen.getByLabelText('Due date'));
    await userEvent.click(screen.getByText('15'));
    
    expect(screen.getByDisplayValue(/15/)).toBeInTheDocument();
  });

  test('2.5.8 Story points selector works', async () => {
    render(<TaskDetailPanel task={mockTask} />);
    
    await userEvent.click(screen.getByLabelText('Story points'));
    await userEvent.click(screen.getByText('5'));
    
    expect(screen.getByText('5 points')).toBeInTheDocument();
  });
});
```

#### Completion Checklist

- [ ] Slide-over panel
- [ ] All fields editable
- [ ] Subtasks section
- [ ] Activity feed
- [ ] AI context section
- [ ] Agent assignment
- [ ] Due date picker
- [ ] Story points
- [ ] All unit tests passing

#### Section 2.5 Review Notes

> *To be filled after completion*

---

### Phase 2 System Review

**Status**: ⬜ Not Started

After completing all Phase 2 subsections (2.1 - 2.5), perform a comprehensive review:

#### Full Test Suite

```bash
npm run test           # All unit tests (Phase 1 + 2)
npm run test:e2e       # Playwright E2E tests
npm run lint
npm run type-check
npm run build
```

#### Manual Testing Checklist

- [ ] All Phase 1 features still work
- [ ] Can create and manage milestones
- [ ] Milestone progress tracking accurate
- [ ] Subtasks work in task detail
- [ ] PRD editor saves content
- [ ] PRD sections are usable
- [ ] Can link tasks to PRDs
- [ ] Task detail panel fully functional
- [ ] Agent assignment works
- [ ] No regressions in existing functionality

#### Phase 2 Review Notes

> *Reviewer:*  
> *Date:*  
> *Status:*  
> *Issues Found:*  
> *Resolution:*

---

## Phase 3: Reporting & Visualization

**Objective**: Build dashboards, charts, and automated reporting.

**Estimated Effort**: Analytics layer  
**Dependencies**: Phase 2 complete  
**Status**: ⬜ Not Started

### Phase 3 Review Checklist

- [ ] All Phase 3 unit tests passing
- [ ] All previous phase tests passing
- [ ] Code review completed
- [ ] No TypeScript/ESLint errors
- [ ] Manual testing completed
- [ ] Documentation updated

---

### 3.1 Dashboard Home

**Objective**: Create the main dashboard with overview widgets.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 3.1.1 | Dashboard layout | Grid layout with widgets |
| 3.1.2 | Today's focus widget | Shows priority tasks for today |
| 3.1.3 | Project health summary | Overview of all projects status |
| 3.1.4 | Recent activity feed | Last 10 actions across system |
| 3.1.5 | Quick actions | Common actions accessible |
| 3.1.6 | Milestone countdown | Upcoming milestones with dates |

#### Unit Tests

```typescript
describe('3.1 Dashboard', () => {
  test('3.1.1 Dashboard layout renders', () => {
    render(<Dashboard />);
    expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
  });

  test('3.1.2 Today focus shows priority tasks', () => {
    render(<TodayFocusWidget />);
    expect(screen.getByText("Today's Focus")).toBeInTheDocument();
    expect(screen.getAllByTestId(/focus-task-/)).toHaveLength(3);
  });

  test('3.1.3 Project health shows status', () => {
    render(<ProjectHealthWidget />);
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  test('3.1.4 Activity feed shows recent', () => {
    render(<ActivityFeedWidget />);
    expect(screen.getAllByTestId(/activity-/)).toHaveLength(10);
  });

  test('3.1.5 Quick actions work', async () => {
    render(<QuickActionsWidget />);
    await userEvent.click(screen.getByText('New Task'));
    expect(screen.getByTestId('new-task-modal')).toBeInTheDocument();
  });

  test('3.1.6 Milestone countdown shows', () => {
    render(<MilestoneCountdownWidget />);
    expect(screen.getByText(/days until/i)).toBeInTheDocument();
  });
});
```

#### Completion Checklist

- [ ] Dashboard layout
- [ ] Today's focus widget
- [ ] Project health summary
- [ ] Activity feed
- [ ] Quick actions
- [ ] Milestone countdown
- [ ] All unit tests passing

#### Section 3.1 Review Notes

> *To be filled after completion*

---

### 3.2 Progress Charts

**Objective**: Implement data visualizations for progress tracking.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 3.2.1 | Burndown chart | Shows remaining work over time |
| 3.2.2 | Burnup chart | Shows completed work accumulation |
| 3.2.3 | Velocity chart | Story points per week |
| 3.2.4 | Area distribution pie | Work distribution by area |
| 3.2.5 | Activity heatmap | Daily activity intensity |
| 3.2.6 | Goal progress bars | Progress toward goals |
| 3.2.7 | Chart date range selector | Filter charts by date range |

#### Unit Tests

```typescript
describe('3.2 Progress Charts', () => {
  test('3.2.1 Burndown chart renders', () => {
    render(<BurndownChart milestoneId={testMilestoneId} />);
    expect(screen.getByTestId('burndown-chart')).toBeInTheDocument();
  });

  test('3.2.2 Burnup chart renders', () => {
    render(<BurnupChart projectId={testProjectId} />);
    expect(screen.getByTestId('burnup-chart')).toBeInTheDocument();
  });

  test('3.2.3 Velocity chart shows weekly data', () => {
    render(<VelocityChart />);
    expect(screen.getAllByTestId(/velocity-bar-/)).toHaveLength(4);
  });

  test('3.2.4 Area distribution shows breakdown', () => {
    render(<AreaDistributionChart />);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  test('3.2.5 Activity heatmap renders', () => {
    render(<ActivityHeatmap />);
    expect(screen.getByTestId('heatmap')).toBeInTheDocument();
  });

  test('3.2.6 Goal progress bars show', () => {
    render(<GoalProgressBars />);
    expect(screen.getAllByRole('progressbar')).toHaveLength(3);
  });

  test('3.2.7 Date range changes chart', async () => {
    render(<ChartWithDateRange />);
    await userEvent.click(screen.getByText('Last 30 days'));
    await userEvent.click(screen.getByText('Last 7 days'));
    expect(mockFetchChartData).toHaveBeenCalledWith(expect.objectContaining({ days: 7 }));
  });
});
```

#### Completion Checklist

- [ ] Burndown chart
- [ ] Burnup chart
- [ ] Velocity chart
- [ ] Area distribution pie
- [ ] Activity heatmap
- [ ] Goal progress bars
- [ ] Date range selector
- [ ] All unit tests passing

#### Section 3.2 Review Notes

> *To be filled after completion*

---

### 3.3 Automated Reports

**Objective**: Generate daily, weekly, and monthly reports automatically.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 3.3.1 | Daily report generation | Report generated at end of day |
| 3.3.2 | Weekly report generation | Report generated weekly |
| 3.3.3 | Monthly report generation | Report generated monthly |
| 3.3.4 | Report storage | Reports saved in database |
| 3.3.5 | Report viewer | Can view past reports |
| 3.3.6 | Report export | Export as PDF/Markdown |
| 3.3.7 | AI summary in reports | AI-generated insights |

#### Report Content Structure

```typescript
interface DailyReport {
  date: string;
  tasksCompleted: TaskSummary[];
  tasksStarted: TaskSummary[];
  tasksBlocked: TaskSummary[];
  agentActivity: AgentActivitySummary[];
  aiInsights: string;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  velocityPoints: number;
  milestonesProgress: MilestoneProgress[];
  areaFocusDistribution: Record<string, number>;
  topAccomplishments: string[];
  aiInsights: string;
}

interface MonthlyReport {
  month: string;
  goalsAchieved: Goal[];
  projectsCompleted: Project[];
  overallProgress: number;
  trendAnalysis: TrendData;
  strategicRecommendations: string[];
  aiInsights: string;
}
```

#### Unit Tests

```typescript
describe('3.3 Automated Reports', () => {
  test('3.3.1 Daily report generates', async () => {
    const report = await generateDailyReport(new Date());
    expect(report).toHaveProperty('tasksCompleted');
    expect(report).toHaveProperty('aiInsights');
  });

  test('3.3.2 Weekly report generates', async () => {
    const report = await generateWeeklyReport(weekStart, weekEnd);
    expect(report).toHaveProperty('velocityPoints');
  });

  test('3.3.3 Monthly report generates', async () => {
    const report = await generateMonthlyReport('2026-01');
    expect(report).toHaveProperty('goalsAchieved');
  });

  test('3.3.4 Report saves to database', async () => {
    const report = await generateAndSaveDailyReport();
    const saved = await getReport(report.id);
    expect(saved).toBeDefined();
  });

  test('3.3.5 Report viewer displays report', () => {
    render(<ReportViewer reportId={testReportId} />);
    expect(screen.getByTestId('report-content')).toBeInTheDocument();
  });

  test('3.3.6 Export generates file', async () => {
    render(<ReportViewer reportId={testReportId} />);
    await userEvent.click(screen.getByText('Export PDF'));
    expect(mockDownload).toHaveBeenCalled();
  });

  test('3.3.7 AI summary included', async () => {
    const report = await generateDailyReport(new Date());
    expect(report.aiInsights).toBeTruthy();
    expect(report.aiInsights.length).toBeGreaterThan(50);
  });
});
```

#### Completion Checklist

- [ ] Daily report generation
- [ ] Weekly report generation
- [ ] Monthly report generation
- [ ] Report storage
- [ ] Report viewer
- [ ] Export functionality
- [ ] AI summaries
- [ ] All unit tests passing

#### Section 3.3 Review Notes

> *To be filled after completion*

---

### Phase 3 System Review

**Status**: ⬜ Not Started

After completing all Phase 3 subsections (3.1 - 3.3), perform a comprehensive review:

#### Full Test Suite

```bash
npm run test
npm run test:e2e
npm run lint
npm run type-check
npm run build
```

#### Manual Testing Checklist

- [ ] All Phase 1-2 features still work
- [ ] Dashboard loads with all widgets
- [ ] Charts render with real data
- [ ] Charts update with date range changes
- [ ] Daily report can be generated manually
- [ ] Past reports can be viewed
- [ ] Reports can be exported
- [ ] No performance issues with charts

#### Phase 3 Review Notes

> *Reviewer:*  
> *Date:*  
> *Status:*  
> *Issues Found:*  
> *Resolution:*

---

## Phase 4: AI Integration

**Objective**: Build REST API and MCP server for AI agent access.

**Estimated Effort**: Integration layer  
**Dependencies**: Phase 3 complete  
**Status**: ⬜ Not Started

### Phase 4 Review Checklist

- [ ] All Phase 4 unit tests passing
- [ ] All previous phase tests passing
- [ ] API security audit completed
- [ ] MCP server functional
- [ ] Code review completed
- [ ] Documentation updated

---

### 4.1 REST API Endpoints

**Objective**: Create comprehensive REST API for programmatic access.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 4.1.1 | Areas API | GET/POST/PUT/DELETE /api/v1/areas |
| 4.1.2 | Projects API | Full CRUD for projects |
| 4.1.3 | Milestones API | Full CRUD for milestones |
| 4.1.4 | Tasks API | Full CRUD + bulk operations |
| 4.1.5 | Boards API | Full CRUD for boards |
| 4.1.6 | PRDs API | Full CRUD for PRDs |
| 4.1.7 | Reports API | GET reports, POST generate |
| 4.1.8 | Search API | Full-text search across entities |
| 4.1.9 | API documentation | OpenAPI/Swagger spec |
| 4.1.10 | Rate limiting | 100 requests/minute per agent |

#### API Endpoint Specifications

```typescript
// /api/v1/tasks
GET    /api/v1/tasks                    // List tasks (with filters)
GET    /api/v1/tasks/:id                // Get single task
POST   /api/v1/tasks                    // Create task
PUT    /api/v1/tasks/:id                // Update task
DELETE /api/v1/tasks/:id                // Delete task
POST   /api/v1/tasks/bulk               // Bulk create/update
PUT    /api/v1/tasks/:id/status         // Update status only
PUT    /api/v1/tasks/:id/assign         // Assign to agent

// Query parameters for list endpoints
?board_id=uuid
?milestone_id=uuid
?status=todo,in_progress
?priority=high,critical
?assigned_agent=uuid
?search=keyword
?limit=50
?offset=0
```

#### Unit Tests

```typescript
describe('4.1 REST API', () => {
  test('4.1.1 Areas API works', async () => {
    // GET all
    let res = await fetch('/api/v1/areas');
    expect(res.status).toBe(200);
    
    // POST
    res = await fetch('/api/v1/areas', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'personal' })
    });
    expect(res.status).toBe(201);
    const area = await res.json();
    
    // GET one
    res = await fetch(`/api/v1/areas/${area.id}`);
    expect(res.status).toBe(200);
    
    // PUT
    res = await fetch(`/api/v1/areas/${area.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' })
    });
    expect(res.status).toBe(200);
    
    // DELETE
    res = await fetch(`/api/v1/areas/${area.id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  // Similar tests for 4.1.2-4.1.7

  test('4.1.8 Search API works', async () => {
    const res = await fetch('/api/v1/search?q=test&types=tasks,projects');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toBeInstanceOf(Array);
  });

  test('4.1.9 OpenAPI spec accessible', async () => {
    const res = await fetch('/api/v1/openapi.json');
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.openapi).toBe('3.0.0');
  });

  test('4.1.10 Rate limiting enforced', async () => {
    // Make 101 requests
    for (let i = 0; i < 101; i++) {
      await fetch('/api/v1/tasks');
    }
    const res = await fetch('/api/v1/tasks');
    expect(res.status).toBe(429);
  });
});
```

#### Completion Checklist

- [ ] Areas API complete
- [ ] Projects API complete
- [ ] Milestones API complete
- [ ] Tasks API complete
- [ ] Boards API complete
- [ ] PRDs API complete
- [ ] Reports API complete
- [ ] Search API complete
- [ ] OpenAPI documentation
- [ ] Rate limiting working
- [ ] All unit tests passing

#### Section 4.1 Review Notes

> *To be filled after completion*

---

### 4.2 Agent Authentication

**Objective**: Implement secure API key authentication for AI agents.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 4.2.1 | Agent registration | Can create new agent with API key |
| 4.2.2 | API key generation | Secure random key generation |
| 4.2.3 | API key hashing | Keys stored as hashes only |
| 4.2.4 | Key validation middleware | Validates key on each request |
| 4.2.5 | Agent capabilities | Can restrict what agent can access |
| 4.2.6 | Key rotation | Can regenerate keys |
| 4.2.7 | Key revocation | Can disable agent access |
| 4.2.8 | Last active tracking | Records agent's last activity |

#### Unit Tests

```typescript
describe('4.2 Agent Authentication', () => {
  test('4.2.1 Can register agent', async () => {
    const { agent, apiKey } = await registerAgent({ name: 'Test Agent' });
    expect(agent.id).toBeDefined();
    expect(apiKey).toMatch(/^bos_[a-zA-Z0-9]{32}$/);
  });

  test('4.2.2 API key is secure', () => {
    const key = generateApiKey();
    expect(key.length).toBeGreaterThan(32);
    expect(key).toMatch(/^bos_/);
  });

  test('4.2.3 Key is hashed in database', async () => {
    const { agent, apiKey } = await registerAgent({ name: 'Test' });
    const dbAgent = await getAgentById(agent.id);
    expect(dbAgent.api_key_hash).not.toBe(apiKey);
    expect(dbAgent.api_key_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('4.2.4 Middleware validates key', async () => {
    const res = await fetch('/api/v1/tasks', {
      headers: { 'Authorization': 'Bearer invalid_key' }
    });
    expect(res.status).toBe(401);
    
    const res2 = await fetch('/api/v1/tasks', {
      headers: { 'Authorization': `Bearer ${validApiKey}` }
    });
    expect(res2.status).toBe(200);
  });

  test('4.2.5 Capabilities restrict access', async () => {
    const { apiKey } = await registerAgent({
      name: 'Limited',
      capabilities: ['read:tasks']
    });
    
    const res = await fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    expect(res.status).toBe(403);
  });

  test('4.2.6 Key can be rotated', async () => {
    const { agent, apiKey: oldKey } = await registerAgent({ name: 'Test' });
    const { apiKey: newKey } = await rotateApiKey(agent.id);
    
    expect(newKey).not.toBe(oldKey);
    
    // Old key should fail
    const res = await fetch('/api/v1/tasks', {
      headers: { 'Authorization': `Bearer ${oldKey}` }
    });
    expect(res.status).toBe(401);
  });

  test('4.2.7 Agent can be revoked', async () => {
    const { agent, apiKey } = await registerAgent({ name: 'Test' });
    await revokeAgent(agent.id);
    
    const res = await fetch('/api/v1/tasks', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    expect(res.status).toBe(401);
  });

  test('4.2.8 Last active updates', async () => {
    const { agent, apiKey } = await registerAgent({ name: 'Test' });
    
    await fetch('/api/v1/tasks', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const updated = await getAgentById(agent.id);
    expect(updated.last_active_at).toBeDefined();
  });
});
```

#### Completion Checklist

- [ ] Agent registration
- [ ] Secure key generation
- [ ] Key hashing
- [ ] Validation middleware
- [ ] Capability restrictions
- [ ] Key rotation
- [ ] Key revocation
- [ ] Last active tracking
- [ ] All unit tests passing

#### Section 4.2 Review Notes

> *To be filled after completion*

---

### 4.3 MCP Server

**Objective**: Create MCP server for direct Claude/AI assistant integration.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 4.3.1 | MCP server setup | Server runs and accepts connections |
| 4.3.2 | list_projects tool | Returns all projects with status |
| 4.3.3 | get_board tool | Returns board with columns and tasks |
| 4.3.4 | create_task tool | Creates task with all fields |
| 4.3.5 | update_task tool | Updates any task field |
| 4.3.6 | move_task tool | Moves task between columns/boards |
| 4.3.7 | get_context tool | Returns relevant context for task |
| 4.3.8 | log_activity tool | Records agent actions |
| 4.3.9 | search_tasks tool | Semantic search across tasks |
| 4.3.10 | generate_report tool | Creates summary reports |

#### MCP Tool Specifications

```typescript
// mcp-server/src/tools/index.ts

const tools = [
  {
    name: 'list_projects',
    description: 'List all projects with their status and progress',
    inputSchema: {
      type: 'object',
      properties: {
        area_id: { type: 'string', description: 'Filter by area ID' },
        status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] }
      }
    }
  },
  {
    name: 'get_board',
    description: 'Get a Kanban board with all columns and tasks',
    inputSchema: {
      type: 'object',
      properties: {
        board_id: { type: 'string', description: 'Board ID' }
      },
      required: ['board_id']
    }
  },
  {
    name: 'create_task',
    description: 'Create a new task on a board',
    inputSchema: {
      type: 'object',
      properties: {
        board_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        column_id: { type: 'string' },
        milestone_id: { type: 'string' },
        story_points: { type: 'number' },
        ai_context: { type: 'object' }
      },
      required: ['board_id', 'title']
    }
  },
  // ... more tools
];
```

#### Unit Tests

```typescript
describe('4.3 MCP Server', () => {
  test('4.3.1 MCP server starts', async () => {
    const server = await startMCPServer();
    expect(server.isRunning()).toBe(true);
  });

  test('4.3.2 list_projects returns projects', async () => {
    const result = await callTool('list_projects', {});
    expect(result.projects).toBeInstanceOf(Array);
  });

  test('4.3.3 get_board returns full board', async () => {
    const result = await callTool('get_board', { board_id: testBoardId });
    expect(result.columns).toBeInstanceOf(Array);
    expect(result.tasks).toBeInstanceOf(Array);
  });

  test('4.3.4 create_task creates task', async () => {
    const result = await callTool('create_task', {
      board_id: testBoardId,
      title: 'MCP Created Task',
      priority: 'high'
    });
    expect(result.task.id).toBeDefined();
    expect(result.task.title).toBe('MCP Created Task');
  });

  test('4.3.5 update_task modifies task', async () => {
    const result = await callTool('update_task', {
      task_id: testTaskId,
      title: 'Updated via MCP'
    });
    expect(result.task.title).toBe('Updated via MCP');
  });

  test('4.3.6 move_task changes position', async () => {
    const result = await callTool('move_task', {
      task_id: testTaskId,
      column_id: 'in_progress'
    });
    expect(result.task.column_id).toBe('in_progress');
  });

  test('4.3.7 get_context returns relevant info', async () => {
    const result = await callTool('get_context', { task_id: testTaskId });
    expect(result.task).toBeDefined();
    expect(result.project).toBeDefined();
    expect(result.related_tasks).toBeInstanceOf(Array);
  });

  test('4.3.8 log_activity records action', async () => {
    await callTool('log_activity', {
      entity_type: 'task',
      entity_id: testTaskId,
      action: 'analyzed',
      payload: { finding: 'Needs more context' }
    });
    
    const logs = await getActivityLogs('task', testTaskId);
    expect(logs).toContainEqual(
      expect.objectContaining({ action: 'analyzed' })
    );
  });

  test('4.3.9 search_tasks finds matches', async () => {
    const result = await callTool('search_tasks', { query: 'authentication bug' });
    expect(result.tasks).toBeInstanceOf(Array);
    expect(result.tasks.length).toBeGreaterThan(0);
  });

  test('4.3.10 generate_report creates summary', async () => {
    const result = await callTool('generate_report', { type: 'daily' });
    expect(result.report).toBeDefined();
    expect(result.report.content).toBeTruthy();
  });
});
```

#### Completion Checklist

- [ ] MCP server setup
- [ ] list_projects tool
- [ ] get_board tool
- [ ] create_task tool
- [ ] update_task tool
- [ ] move_task tool
- [ ] get_context tool
- [ ] log_activity tool
- [ ] search_tasks tool
- [ ] generate_report tool
- [ ] All unit tests passing

#### Section 4.3 Review Notes

> *To be filled after completion*

---

### 4.4 Activity Logging

**Objective**: Implement comprehensive audit trail for all system actions.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 4.4.1 | Log all mutations | Every create/update/delete logged |
| 4.4.2 | Agent attribution | Log records which agent performed action |
| 4.4.3 | User vs agent flag | Distinguish human vs AI actions |
| 4.4.4 | Payload capture | Store relevant payload data |
| 4.4.5 | Activity feed API | Endpoint to retrieve activity |
| 4.4.6 | Activity viewer UI | View activity in app |
| 4.4.7 | Retention policy | Auto-cleanup old logs |

#### Unit Tests

```typescript
describe('4.4 Activity Logging', () => {
  test('4.4.1 Mutations are logged', async () => {
    const task = await createTask({ title: 'Logged Task' });
    const logs = await getActivityLogs('tasks', task.id);
    expect(logs).toContainEqual(
      expect.objectContaining({ action: 'create' })
    );
  });

  test('4.4.2 Agent ID recorded', async () => {
    const task = await createTaskAsAgent(agentId, { title: 'Agent Task' });
    const logs = await getActivityLogs('tasks', task.id);
    expect(logs[0].agent_id).toBe(agentId);
  });

  test('4.4.3 User initiated flag set', async () => {
    const task = await createTaskAsUser({ title: 'User Task' });
    const logs = await getActivityLogs('tasks', task.id);
    expect(logs[0].user_initiated).toBe(true);
  });

  test('4.4.4 Payload captured', async () => {
    const task = await updateTask(taskId, { title: 'New Title' });
    const logs = await getActivityLogs('tasks', taskId);
    const updateLog = logs.find(l => l.action === 'update');
    expect(updateLog.payload).toEqual({ title: 'New Title' });
  });

  test('4.4.5 Activity feed API works', async () => {
    const res = await fetch('/api/v1/activity?entity_type=tasks&entity_id=' + taskId);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.activities).toBeInstanceOf(Array);
  });

  test('4.4.6 Activity viewer renders', () => {
    render(<ActivityViewer entityType="tasks" entityId={taskId} />);
    expect(screen.getByTestId('activity-list')).toBeInTheDocument();
  });

  test('4.4.7 Old logs cleaned up', async () => {
    // Create old log
    await createActivityLog({
      created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
    });
    
    await runRetentionCleanup();
    
    const oldLogs = await getLogsOlderThan(90);
    expect(oldLogs).toHaveLength(0);
  });
});
```

#### Completion Checklist

- [ ] All mutations logged
- [ ] Agent attribution
- [ ] User vs agent flag
- [ ] Payload capture
- [ ] Activity feed API
- [ ] Activity viewer UI
- [ ] Retention policy
- [ ] All unit tests passing

#### Section 4.4 Review Notes

> *To be filled after completion*

---

### Phase 4 System Review

**Status**: ⬜ Not Started

After completing all Phase 4 subsections (4.1 - 4.4), perform a comprehensive review:

#### Full Test Suite

```bash
npm run test
npm run test:e2e
npm run test:api        # API integration tests
npm run lint
npm run type-check
npm run build
```

#### Security Audit Checklist

- [ ] All API endpoints require authentication
- [ ] API keys are properly hashed
- [ ] Rate limiting prevents abuse
- [ ] No sensitive data in responses
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CORS properly configured

#### Manual Testing Checklist

- [ ] All Phase 1-3 features still work
- [ ] API endpoints return correct data
- [ ] Agent can authenticate via API
- [ ] MCP server accepts connections
- [ ] All MCP tools functional
- [ ] Activity logging captures all actions
- [ ] Activity viewer shows history

#### Phase 4 Review Notes

> *Reviewer:*  
> *Date:*  
> *Status:*  
> *Issues Found:*  
> *Resolution:*

---

## Phase 5: Polish & Deployment

**Objective**: Final refinements and production deployment.

**Estimated Effort**: Finalization  
**Dependencies**: Phase 4 complete  
**Status**: ⬜ Not Started

### Phase 5 Review Checklist

- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Security audit passed
- [ ] Production deployment successful
- [ ] Documentation complete

---

### 5.1 UI/UX Refinements

**Objective**: Polish the interface for optimal user experience.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 5.1.1 | Consistent spacing | 4px grid system throughout |
| 5.1.2 | Typography hierarchy | Clear visual hierarchy |
| 5.1.3 | Color consistency | Semantic color usage |
| 5.1.4 | Micro-animations | Subtle, purposeful animations |
| 5.1.5 | Loading states | Skeleton loaders everywhere |
| 5.1.6 | Empty states | Helpful empty state messages |
| 5.1.7 | Error states | Clear error messages with actions |
| 5.1.8 | Accessibility | WCAG 2.1 AA compliance |

#### Completion Checklist

- [ ] Spacing audit complete
- [ ] Typography reviewed
- [ ] Colors consistent
- [ ] Animations smooth
- [ ] Loading states added
- [ ] Empty states designed
- [ ] Error states helpful
- [ ] Accessibility audit passed

#### Section 5.1 Review Notes

> *To be filled after completion*

---

### 5.2 Performance Optimization

**Objective**: Ensure fast, responsive application performance.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 5.2.1 | Bundle optimization | JS bundle < 200KB gzipped |
| 5.2.2 | Code splitting | Route-based splitting |
| 5.2.3 | Image optimization | Next.js Image component |
| 5.2.4 | Database queries | Indexed, efficient queries |
| 5.2.5 | Caching strategy | Appropriate cache headers |
| 5.2.6 | Lighthouse score | >90 performance score |

#### Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| First Input Delay | < 100ms |

#### Completion Checklist

- [ ] Bundle size optimized
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Database indexes added
- [ ] Caching configured
- [ ] Lighthouse score >90

#### Section 5.2 Review Notes

> *To be filled after completion*

---

### 5.3 Vercel Deployment

**Objective**: Deploy to Vercel with proper configuration.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 5.3.1 | Vercel project setup | Project created and linked |
| 5.3.2 | Environment variables | All vars configured in Vercel |
| 5.3.3 | Domain configuration | Custom domain (if applicable) |
| 5.3.4 | Preview deployments | PRs get preview URLs |
| 5.3.5 | Production deployment | Main branch auto-deploys |
| 5.3.6 | Edge functions | API routes on edge |
| 5.3.7 | Monitoring setup | Vercel Analytics enabled |

#### Completion Checklist

- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Domain configured
- [ ] Preview deployments working
- [ ] Production deployment successful
- [ ] Edge functions optimized
- [ ] Monitoring enabled

#### Section 5.3 Review Notes

> *To be filled after completion*

---

### 5.4 Documentation

**Objective**: Create comprehensive documentation for users and AI agents.

**Status**: ⬜ Not Started  
**Assigned Agent**: TBD  
**Chat Window Reference**: TBD

#### Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| 5.4.1 | README.md | Setup and usage instructions |
| 5.4.2 | API documentation | OpenAPI spec + examples |
| 5.4.3 | MCP documentation | Tool descriptions and usage |
| 5.4.4 | Agent onboarding guide | How to set up new agents |
| 5.4.5 | Architecture docs | System design documentation |

#### Completion Checklist

- [ ] README complete
- [ ] API docs complete
- [ ] MCP docs complete
- [ ] Agent guide complete
- [ ] Architecture docs complete

#### Section 5.4 Review Notes

> *To be filled after completion*

---

### Phase 5 System Review (Final)

**Status**: ⬜ Not Started

This is the final comprehensive review before launch.

#### Complete Test Suite

```bash
npm run test:all       # All tests
npm run test:e2e       # E2E tests
npm run lighthouse     # Performance audit
npm run a11y           # Accessibility audit
npm run security       # Security scan
```

#### Final Checklist

- [ ] All 5 phases complete
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] All integration tests passing
- [ ] Performance targets met
- [ ] Accessibility audit passed
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Production deployment live
- [ ] Monitoring active
- [ ] AI agents can authenticate
- [ ] MCP server operational

#### Launch Sign-Off

> *Reviewer:*  
> *Date:*  
> *Final Status:*  
> *Launch Approved:* [ ] Yes / [ ] No  
> *Notes:*

---

## Progress Log

This section tracks overall progress and key events.

| Date | Phase | Section | Status | Agent | Notes |
|------|-------|---------|--------|-------|-------|
| 2026-01-30 | - | PRD | Created | - | Initial PRD document created |
| | | | | | |
| | | | | | |

---

## Agent Work Assignment

This section tracks which agent/chat window is assigned to each section.

| Section | Agent Name | Chat Window ID | Start Date | End Date | Status |
|---------|------------|----------------|------------|----------|--------|
| 1.1 Project Init | | | | | ⬜ Pending |
| 1.2 Supabase Setup | | | | | ⬜ Pending |
| 1.3 Base UI Layout | | | | | ⬜ Pending |
| 1.4 Kanban Board | | | | | ⬜ Pending |
| 1.5 CRUD Operations | | | | | ⬜ Pending |
| 2.1 Milestones | | | | | ⬜ Pending |
| 2.2 Subtasks | | | | | ⬜ Pending |
| 2.3 PRD Editor | | | | | ⬜ Pending |
| 2.4 PRD-Task Linking | | | | | ⬜ Pending |
| 2.5 Task Detail | | | | | ⬜ Pending |
| 3.1 Dashboard | | | | | ⬜ Pending |
| 3.2 Progress Charts | | | | | ⬜ Pending |
| 3.3 Reports | | | | | ⬜ Pending |
| 4.1 REST API | | | | | ⬜ Pending |
| 4.2 Agent Auth | | | | | ⬜ Pending |
| 4.3 MCP Server | | | | | ⬜ Pending |
| 4.4 Activity Logging | | | | | ⬜ Pending |
| 5.1 UI Polish | | | | | ⬜ Pending |
| 5.2 Performance | | | | | ⬜ Pending |
| 5.3 Deployment | | | | | ⬜ Pending |
| 5.4 Documentation | | | | | ⬜ Pending |

---

## Appendix A: Environment Variables

```bash
# .env.local template
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx  # For AI summaries in reports
```

## Appendix B: File Structure

```
ben-os/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── board/[id]/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── projects/[id]/page.tsx
│   │   │   ├── prds/page.tsx
│   │   │   ├── prds/[id]/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/v1/
│   │   │   ├── areas/route.ts
│   │   │   ├── projects/route.ts
│   │   │   ├── milestones/route.ts
│   │   │   ├── boards/route.ts
│   │   │   ├── tasks/route.ts
│   │   │   ├── subtasks/route.ts
│   │   │   ├── prds/route.ts
│   │   │   ├── agents/route.ts
│   │   │   ├── activity/route.ts
│   │   │   ├── reports/route.ts
│   │   │   ├── search/route.ts
│   │   │   └── openapi.json/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── kanban/
│   │   │   ├── Board.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── CardDetail.tsx
│   │   │   └── AddCard.tsx
│   │   ├── dashboard/
│   │   │   ├── TodayFocus.tsx
│   │   │   ├── ProjectHealth.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── Charts/
│   │   ├── prd/
│   │   │   ├── PRDEditor.tsx
│   │   │   ├── PRDList.tsx
│   │   │   └── PRDTasks.tsx
│   │   ├── reports/
│   │   │   ├── ReportViewer.tsx
│   │   │   └── ReportList.tsx
│   │   └── shared/
│   │       ├── ErrorBoundary.tsx
│   │       ├── Skeleton.tsx
│   │       └── EmptyState.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── types.ts
│   │   ├── api/
│   │   │   ├── auth.ts
│   │   │   └── rate-limit.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-areas.ts
│   │   ├── use-projects.ts
│   │   ├── use-milestones.ts
│   │   ├── use-boards.ts
│   │   ├── use-tasks.ts
│   │   ├── use-prds.ts
│   │   └── use-activity.ts
│   ├── stores/
│   │   ├── ui-store.ts
│   │   └── board-store.ts
│   └── types/
│       ├── database.ts
│       └── api.ts
├── mcp-server/
│   ├── src/
│   │   ├── index.ts
│   │   └── tools/
│   │       ├── projects.ts
│   │       ├── boards.ts
│   │       ├── tasks.ts
│   │       ├── context.ts
│   │       ├── activity.ts
│   │       └── reports.ts
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── tests/
│   ├── setup/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── e2e/
├── public/
├── package.json
├── tailwind.config.ts
├── next.config.js
├── vitest.config.ts
├── playwright.config.ts
├── LIFE_OS_PRD.md          # This document
└── README.md
```

---

*End of PRD Document*
