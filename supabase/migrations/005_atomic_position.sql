-- supabase/migrations/005_atomic_position.sql
-- Atomic Position Calculation Functions
-- Prevents race conditions when calculating positions for new entities
-- Created: 2026-01-30

/**
 * Get next position for tasks in a specific column
 * Uses FOR UPDATE to lock rows and prevent race conditions
 */
CREATE OR REPLACE FUNCTION get_next_task_position(
  p_board_id UUID,
  p_column_id VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  -- Lock and get max position in one atomic operation
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM tasks
  WHERE board_id = p_board_id AND column_id = p_column_id
  FOR UPDATE;
  
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

/**
 * Get next position for subtasks in a task
 */
CREATE OR REPLACE FUNCTION get_next_subtask_position(
  p_task_id UUID
) RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM subtasks
  WHERE task_id = p_task_id
  FOR UPDATE;
  
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

/**
 * Get next position for boards in a project
 */
CREATE OR REPLACE FUNCTION get_next_board_position(
  p_project_id UUID
) RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM boards
  WHERE project_id = p_project_id
  FOR UPDATE;
  
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

/**
 * Get next position for projects in an area
 */
CREATE OR REPLACE FUNCTION get_next_project_position(
  p_area_id UUID
) RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM projects
  WHERE area_id = p_area_id
  FOR UPDATE;
  
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

/**
 * Get next position for milestones in a project
 */
CREATE OR REPLACE FUNCTION get_next_milestone_position(
  p_project_id UUID
) RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM milestones
  WHERE project_id = p_project_id
  FOR UPDATE;
  
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

/**
 * Get next position for areas (global)
 */
CREATE OR REPLACE FUNCTION get_next_area_position()
RETURNS INTEGER AS $$
DECLARE
  next_pos INTEGER;
BEGIN
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos
  FROM areas
  FOR UPDATE;
  
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_next_task_position(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_task_position(UUID, VARCHAR) TO service_role;

GRANT EXECUTE ON FUNCTION get_next_subtask_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_subtask_position(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_next_board_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_board_position(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_next_project_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_project_position(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_next_milestone_position(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_milestone_position(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_next_area_position() TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_area_position() TO service_role;
