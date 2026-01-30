-- supabase/migrations/003_performance_indexes.sql
-- Performance Optimization Indexes (5.2.4)
-- Created: 2026-01-30

-- ============================================
-- Additional indexes for query optimization
-- ============================================

-- Tasks: Composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_tasks_board_column_position 
  ON tasks(board_id, column_id, position);

-- Tasks: Priority filtering with board context
CREATE INDEX IF NOT EXISTS idx_tasks_board_priority 
  ON tasks(board_id, priority);

-- Tasks: Due date queries for deadline filtering
CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
  ON tasks(due_date) 
  WHERE due_date IS NOT NULL;

-- Tasks: Completed tasks for metrics
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at 
  ON tasks(completed_at DESC) 
  WHERE completed_at IS NOT NULL;

-- Tasks: PRD linking with board for traceability queries
CREATE INDEX IF NOT EXISTS idx_tasks_prd_board 
  ON tasks(prd_id, board_id) 
  WHERE prd_id IS NOT NULL;

-- Tasks: Agent assignments for workload queries
CREATE INDEX IF NOT EXISTS idx_tasks_agent_status 
  ON tasks(assigned_agent_id, status) 
  WHERE assigned_agent_id IS NOT NULL;

-- Projects: Status filtering with position ordering
CREATE INDEX IF NOT EXISTS idx_projects_area_status 
  ON projects(area_id, status, position);

-- Projects: Target date for deadline views
CREATE INDEX IF NOT EXISTS idx_projects_target_date 
  ON projects(target_date) 
  WHERE target_date IS NOT NULL;

-- Milestones: Status and target date for progress tracking
CREATE INDEX IF NOT EXISTS idx_milestones_project_status 
  ON milestones(project_id, status, target_date);

-- PRDs: Status filtering for listing
CREATE INDEX IF NOT EXISTS idx_prds_project_status 
  ON prds(project_id, status);

-- PRD Versions: Fast lookup of latest version
CREATE INDEX IF NOT EXISTS idx_prd_versions_latest 
  ON prd_versions(prd_id, version_number DESC);

-- Activity logs: Time-based queries for dashboard
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_created 
  ON activity_logs(entity_type, created_at DESC);

-- Activity logs: Agent activity tracking
CREATE INDEX IF NOT EXISTS idx_activity_logs_agent_created 
  ON activity_logs(agent_id, created_at DESC) 
  WHERE agent_id IS NOT NULL;

-- Subtasks: Completion status for progress calculation
CREATE INDEX IF NOT EXISTS idx_subtasks_task_completed 
  ON subtasks(task_id, completed);

-- Reports: Fast lookup by type and date range
CREATE INDEX IF NOT EXISTS idx_reports_generated 
  ON reports(type, generated_at DESC);

-- ============================================
-- Text search indexes for search functionality
-- ============================================

-- Tasks: Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_tasks_search 
  ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- PRDs: Full-text search on title and content
CREATE INDEX IF NOT EXISTS idx_prds_search 
  ON prds USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Projects: Full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_projects_search 
  ON projects USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- ============================================
-- Analyze tables for query optimizer
-- ============================================

ANALYZE areas;
ANALYZE projects;
ANALYZE milestones;
ANALYZE boards;
ANALYZE tasks;
ANALYZE subtasks;
ANALYZE prds;
ANALYZE prd_versions;
ANALYZE activity_logs;
ANALYZE reports;
ANALYZE agents;
