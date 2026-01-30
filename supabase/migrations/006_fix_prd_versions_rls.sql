-- supabase/migrations/006_fix_prd_versions_rls.sql
-- Fix missing RLS policy for prd_versions table
-- The policy was dropped in migration 004 but not recreated
-- Created: 2026-01-30

-- First, ensure migration 002 has been run by creating the table if it doesn't exist
-- This makes the migration idempotent and safe to run regardless of current state

-- Create prd_versions table if it doesn't exist (from migration 002)
CREATE TABLE IF NOT EXISTS prd_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prd_id UUID NOT NULL REFERENCES prds(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  sections JSONB DEFAULT '[]',
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES agents(id) ON DELETE SET NULL
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_prd_versions_prd_id ON prd_versions(prd_id);
CREATE INDEX IF NOT EXISTS idx_prd_versions_version_number ON prd_versions(prd_id, version_number DESC);

-- Enable RLS (idempotent - safe to run multiple times)
ALTER TABLE prd_versions ENABLE ROW LEVEL SECURITY;

-- Drop old permissive policy if it exists (from migration 002)
DROP POLICY IF EXISTS "Allow all for authenticated" ON prd_versions;

-- Drop our policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Allowed users full access" ON prd_versions;

-- Add the RLS policy for prd_versions table
-- Uses the same pattern as other tables in migration 004
CREATE POLICY "Allowed users full access" ON prd_versions
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- Create the trigger function if it doesn't exist (from migration 002)
CREATE OR REPLACE FUNCTION create_prd_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only create version if content or sections changed
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.sections IS DISTINCT FROM NEW.sections THEN
    -- Get the next version number
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM prd_versions
    WHERE prd_id = OLD.id;
    
    -- Insert the old version
    INSERT INTO prd_versions (prd_id, version_number, title, content, sections, status)
    VALUES (OLD.id, next_version, OLD.title, OLD.content, OLD.sections, OLD.status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS create_prd_version_on_update ON prds;
CREATE TRIGGER create_prd_version_on_update
  BEFORE UPDATE ON prds
  FOR EACH ROW
  EXECUTE FUNCTION create_prd_version();

-- Add comment for documentation
COMMENT ON TABLE prd_versions IS 'Version history for PRDs, automatically created on PRD updates';
COMMENT ON POLICY "Allowed users full access" ON prd_versions 
  IS 'Allows full access to prd_versions for authenticated users in the email allowlist';
