-- supabase/migrations/001_initial_schema.sql
-- Ben OS Initial Database Schema
-- Created: 2026-01-30

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
