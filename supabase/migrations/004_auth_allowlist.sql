-- supabase/migrations/004_auth_allowlist.sql
-- Restricted Email Auth for Ben OS
-- Only allows specific email addresses to access the system

-- =============================================================================
-- ALLOWED EMAILS TABLE
-- =============================================================================

-- Table to store allowed email addresses
CREATE TABLE allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('owner', 'agent', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the allowed users
INSERT INTO allowed_emails (email, name, role) VALUES
  ('ben@evercrisp.ai', 'Ben', 'owner'),
  ('jules@evercrisp.ai', 'Jules (AI Agent)', 'agent');

-- Enable RLS on allowed_emails (only service role can modify)
ALTER TABLE allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read the allowlist
CREATE POLICY "Authenticated users can read allowed_emails"
  ON allowed_emails FOR SELECT
  USING (auth.role() = 'authenticated');

-- =============================================================================
-- HELPER FUNCTION: Check if email is allowed
-- =============================================================================

CREATE OR REPLACE FUNCTION is_email_allowed(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_emails WHERE LOWER(email) = LOWER(user_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- HELPER FUNCTION: Get current user's email
-- =============================================================================

CREATE OR REPLACE FUNCTION auth_email()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- UPDATE RLS POLICIES: Restrict to allowed emails only
-- =============================================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated" ON areas;
DROP POLICY IF EXISTS "Allow all for authenticated" ON projects;
DROP POLICY IF EXISTS "Allow all for authenticated" ON milestones;
DROP POLICY IF EXISTS "Allow all for authenticated" ON boards;
DROP POLICY IF EXISTS "Allow all for authenticated" ON tasks;
DROP POLICY IF EXISTS "Allow all for authenticated" ON subtasks;
DROP POLICY IF EXISTS "Allow all for authenticated" ON prds;
DROP POLICY IF EXISTS "Allow all for authenticated" ON agents;
DROP POLICY IF EXISTS "Allow all for authenticated" ON activity_logs;
DROP POLICY IF EXISTS "Allow all for authenticated" ON reports;

-- Create new restrictive policies for each table
-- These check: user is authenticated AND their email is in the allowlist

-- AREAS
CREATE POLICY "Allowed users full access" ON areas
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- PROJECTS
CREATE POLICY "Allowed users full access" ON projects
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- MILESTONES
CREATE POLICY "Allowed users full access" ON milestones
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- BOARDS
CREATE POLICY "Allowed users full access" ON boards
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- TASKS
CREATE POLICY "Allowed users full access" ON tasks
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- SUBTASKS
CREATE POLICY "Allowed users full access" ON subtasks
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- PRDS
CREATE POLICY "Allowed users full access" ON prds
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- AGENTS
CREATE POLICY "Allowed users full access" ON agents
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- ACTIVITY_LOGS
CREATE POLICY "Allowed users full access" ON activity_logs
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- REPORTS
CREATE POLICY "Allowed users full access" ON reports
  FOR ALL USING (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND is_email_allowed(auth_email())
  );

-- =============================================================================
-- SIGNUP RESTRICTION: Prevent unauthorized signups via database trigger
-- =============================================================================

-- This function runs AFTER a user signs up and deletes them if not allowed
-- Note: For full signup blocking, also configure Supabase Auth settings
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the email is in the allowlist
  IF NOT is_email_allowed(NEW.email) THEN
    -- Delete the unauthorized user
    DELETE FROM auth.users WHERE id = NEW.id;
    RAISE EXCEPTION 'Email not authorized for signup: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE allowed_emails IS 'Allowlist of email addresses permitted to access Ben OS';
COMMENT ON FUNCTION is_email_allowed IS 'Checks if an email address is in the allowlist';
COMMENT ON FUNCTION auth_email IS 'Returns the current authenticated user email';
COMMENT ON FUNCTION handle_new_user IS 'Blocks signups from non-allowlisted emails';
