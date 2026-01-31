-- supabase/migrations/007_project_board_integration.sql
-- Project-Board Integration: Enforces 1:1 relationship and auto-creates boards
-- Created: 2026-01-30

-- =============================================================================
-- PHASE 1: UNIQUE CONSTRAINT FOR 1:1 RELATIONSHIP
-- =============================================================================

-- Add unique constraint on boards.project_id to enforce 1:1 relationship
-- First, check if any project has multiple boards and keep only the first one
DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  -- Find projects with multiple boards
  FOR duplicate_record IN
    SELECT project_id, array_agg(id ORDER BY created_at ASC) as board_ids
    FROM boards
    GROUP BY project_id
    HAVING COUNT(*) > 1
  LOOP
    -- Delete all but the first (oldest) board for each project
    DELETE FROM boards
    WHERE project_id = duplicate_record.project_id
    AND id != duplicate_record.board_ids[1];
  END LOOP;
END $$;

-- Now add the unique constraint
ALTER TABLE boards
  ADD CONSTRAINT boards_project_id_unique UNIQUE (project_id);

COMMENT ON CONSTRAINT boards_project_id_unique ON boards
  IS 'Enforces 1:1 relationship between projects and boards';

-- =============================================================================
-- PHASE 2: AUTO-CREATE BOARD ON PROJECT INSERT
-- =============================================================================

-- Function to automatically create a board when a project is created
CREATE OR REPLACE FUNCTION create_board_on_project_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a default board for the new project
  INSERT INTO boards (project_id, name, column_config, position)
  VALUES (
    NEW.id,
    NEW.title || ' Board',
    '[
      {"id": "backlog", "name": "Backlog", "position": 0},
      {"id": "todo", "name": "To Do", "position": 1},
      {"id": "in_progress", "name": "In Progress", "position": 2},
      {"id": "review", "name": "Review", "position": 3},
      {"id": "done", "name": "Done", "position": 4}
    ]'::jsonb,
    0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create board after project insert
DROP TRIGGER IF EXISTS create_board_after_project_insert ON projects;
CREATE TRIGGER create_board_after_project_insert
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_board_on_project_insert();

COMMENT ON FUNCTION create_board_on_project_insert()
  IS 'Automatically creates a default Kanban board when a new project is created';

-- =============================================================================
-- PHASE 3: BACKFILL BOARDS FOR EXISTING PROJECTS WITHOUT BOARDS
-- =============================================================================

-- Create boards for any existing projects that don't have one
INSERT INTO boards (project_id, name, column_config, position)
SELECT 
  p.id,
  p.title || ' Board',
  '[
    {"id": "backlog", "name": "Backlog", "position": 0},
    {"id": "todo", "name": "To Do", "position": 1},
    {"id": "in_progress", "name": "In Progress", "position": 2},
    {"id": "review", "name": "Review", "position": 3},
    {"id": "done", "name": "Done", "position": 4}
  ]'::jsonb,
  0
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM boards b WHERE b.project_id = p.id
);

-- =============================================================================
-- PHASE 4: HELPER FUNCTION TO GET PROJECT'S BOARD
-- =============================================================================

-- Function to get the board ID for a given project
CREATE OR REPLACE FUNCTION get_project_board_id(p_project_id UUID)
RETURNS UUID AS $$
DECLARE
  board_id UUID;
BEGIN
  SELECT id INTO board_id
  FROM boards
  WHERE project_id = p_project_id;
  
  RETURN board_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_project_board_id(UUID)
  IS 'Returns the board ID for a given project (1:1 relationship)';

-- =============================================================================
-- PHASE 5: STORAGE BUCKET FOR PRD FILES
-- =============================================================================

-- Create storage bucket for PRD markdown files (if storage extension is available)
-- This needs to be run manually or via Supabase dashboard if storage isn't set up
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('prd-files', 'prd-files', false)
-- ON CONFLICT (id) DO NOTHING;

-- Add file_path column to PRDs for storing uploaded markdown file reference
ALTER TABLE prds
  ADD COLUMN IF NOT EXISTS file_path TEXT;

COMMENT ON COLUMN prds.file_path
  IS 'Path to the uploaded markdown file in Supabase Storage';

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TRIGGER create_board_after_project_insert ON projects
  IS 'Automatically creates a Kanban board when a project is created';
