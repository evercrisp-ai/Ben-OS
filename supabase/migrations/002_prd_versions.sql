-- supabase/migrations/002_prd_versions.sql
-- PRD Version History Support
-- Created: 2026-01-30

-- PRD_VERSIONS: Version history for PRDs
CREATE TABLE prd_versions (
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

-- Index for efficient version lookups
CREATE INDEX idx_prd_versions_prd_id ON prd_versions(prd_id);
CREATE INDEX idx_prd_versions_version_number ON prd_versions(prd_id, version_number DESC);

-- Enable RLS
ALTER TABLE prd_versions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (single-user mode)
CREATE POLICY "Allow all for authenticated" ON prd_versions FOR ALL USING (true);

-- Trigger to automatically create version on PRD update
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

CREATE TRIGGER create_prd_version_on_update
  BEFORE UPDATE ON prds
  FOR EACH ROW
  EXECUTE FUNCTION create_prd_version();
