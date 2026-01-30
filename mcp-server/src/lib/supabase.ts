// Supabase client for MCP server
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database types (mirroring the main app types)
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReportType = 'daily' | 'weekly' | 'monthly';

export interface ColumnConfig {
  id: string;
  name: string;
  position: number;
}

export interface Area {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  type: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  area_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  target_date: string | null;
  metadata: Json;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  project_id: string;
  name: string;
  column_config: ColumnConfig[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  milestone_id: string | null;
  board_id: string;
  prd_id: string | null;
  assigned_agent_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  story_points: number | null;
  ai_context: Json;
  column_id: string;
  position: number;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  target_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  type: ReportType;
  period_start: string;
  period_end: string;
  content: Json;
  generated_at: string;
}

export type PRDStatus = 'draft' | 'approved' | 'in_progress' | 'completed';

export interface PRDSection {
  id: string;
  title: string;
  content: string;
  placeholder?: string;
}

export interface PRD {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  status: PRDStatus;
  sections: Json;
  created_at: string;
  updated_at: string;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY environment variables');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}
