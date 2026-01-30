// Database types for Ben OS
// These types are derived from the Supabase schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Area types for top-level life domains
export type AreaType = 'personal' | 'work' | 'project' | 'content' | 'community' | 'other';

// Project status
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

// Milestone status
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

// Task status (matches Kanban columns)
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

// Task priority
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// PRD status
export type PRDStatus = 'draft' | 'approved' | 'in_progress' | 'completed';

// Agent type
export type AgentType = 'primary' | 'task';

// Report type
export type ReportType = 'daily' | 'weekly' | 'monthly';

// Column configuration for boards
export interface ColumnConfig {
  id: string;
  name: string;
  position: number;
}

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string;
          name: string;
          color: string;
          icon: string | null;
          type: AreaType;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          icon?: string | null;
          type: AreaType;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          icon?: string | null;
          type?: AreaType;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
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
        };
        Insert: {
          id?: string;
          area_id: string;
          title: string;
          description?: string | null;
          status?: ProjectStatus;
          target_date?: string | null;
          metadata?: Json;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          area_id?: string;
          title?: string;
          description?: string | null;
          status?: ProjectStatus;
          target_date?: string | null;
          metadata?: Json;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_area_id_fkey';
            columns: ['area_id'];
            isOneToOne: false;
            referencedRelation: 'areas';
            referencedColumns: ['id'];
          }
        ];
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: MilestoneStatus;
          target_date: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: MilestoneStatus;
          target_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          status?: MilestoneStatus;
          target_date?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'milestones_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      boards: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          column_config: ColumnConfig[];
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          column_config?: ColumnConfig[];
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          column_config?: ColumnConfig[];
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'boards_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      prds: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          content: string | null;
          status: PRDStatus;
          sections: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          content?: string | null;
          status?: PRDStatus;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          content?: string | null;
          status?: PRDStatus;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prds_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          }
        ];
      };
      agents: {
        Row: {
          id: string;
          name: string;
          type: AgentType;
          capabilities: Json;
          api_key_hash: string;
          is_active: boolean;
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: AgentType;
          capabilities?: Json;
          api_key_hash: string;
          is_active?: boolean;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: AgentType;
          capabilities?: Json;
          api_key_hash?: string;
          is_active?: boolean;
          last_active_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
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
        };
        Insert: {
          id?: string;
          milestone_id?: string | null;
          board_id: string;
          prd_id?: string | null;
          assigned_agent_id?: string | null;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          story_points?: number | null;
          ai_context?: Json;
          column_id?: string;
          position?: number;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          milestone_id?: string | null;
          board_id?: string;
          prd_id?: string | null;
          assigned_agent_id?: string | null;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          story_points?: number | null;
          ai_context?: Json;
          column_id?: string;
          position?: number;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_milestone_id_fkey';
            columns: ['milestone_id'];
            isOneToOne: false;
            referencedRelation: 'milestones';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_board_id_fkey';
            columns: ['board_id'];
            isOneToOne: false;
            referencedRelation: 'boards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assigned_agent_id_fkey';
            columns: ['assigned_agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          }
        ];
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          completed: boolean;
          completed_at: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          completed?: boolean;
          completed_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          completed?: boolean;
          completed_at?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subtasks_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: false;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          }
        ];
      };
      activity_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          agent_id: string | null;
          user_initiated: boolean;
          action: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          agent_id?: string | null;
          user_initiated?: boolean;
          action: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          agent_id?: string | null;
          user_initiated?: boolean;
          action?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activity_logs_agent_id_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          type: ReportType;
          period_start: string;
          period_end: string;
          content: Json;
          generated_at: string;
        };
        Insert: {
          id?: string;
          type: ReportType;
          period_start: string;
          period_end: string;
          content: Json;
          generated_at?: string;
        };
        Update: {
          id?: string;
          type?: ReportType;
          period_start?: string;
          period_end?: string;
          content?: Json;
          generated_at?: string;
        };
        Relationships: [];
      };
      prd_versions: {
        Row: {
          id: string;
          prd_id: string;
          version_number: number;
          title: string;
          content: string | null;
          sections: Json;
          status: PRDStatus;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          prd_id: string;
          version_number: number;
          title: string;
          content?: string | null;
          sections?: Json;
          status: PRDStatus;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          prd_id?: string;
          version_number?: number;
          title?: string;
          content?: string | null;
          sections?: Json;
          status?: PRDStatus;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prd_versions_prd_id_fkey';
            columns: ['prd_id'];
            isOneToOne: false;
            referencedRelation: 'prds';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    CompositeTypes: {};
  };
}

// Convenience types for use in the application
export type Area = Database['public']['Tables']['areas']['Row'];
export type AreaInsert = Database['public']['Tables']['areas']['Insert'];
export type AreaUpdate = Database['public']['Tables']['areas']['Update'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type MilestoneInsert = Database['public']['Tables']['milestones']['Insert'];
export type MilestoneUpdate = Database['public']['Tables']['milestones']['Update'];

export type Board = Database['public']['Tables']['boards']['Row'];
export type BoardInsert = Database['public']['Tables']['boards']['Insert'];
export type BoardUpdate = Database['public']['Tables']['boards']['Update'];

export type PRD = Database['public']['Tables']['prds']['Row'];
export type PRDInsert = Database['public']['Tables']['prds']['Insert'];
export type PRDUpdate = Database['public']['Tables']['prds']['Update'];

export type Agent = Database['public']['Tables']['agents']['Row'];
export type AgentInsert = Database['public']['Tables']['agents']['Insert'];
export type AgentUpdate = Database['public']['Tables']['agents']['Update'];

export type Task = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type Subtask = Database['public']['Tables']['subtasks']['Row'];
export type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert'];
export type SubtaskUpdate = Database['public']['Tables']['subtasks']['Update'];

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];

// PRD Version types
export interface PRDVersion {
  id: string;
  prd_id: string;
  version_number: number;
  title: string;
  content: string | null;
  sections: Json;
  status: PRDStatus;
  created_at: string;
  created_by: string | null;
}

// PRD Section template type
export interface PRDSection {
  id: string;
  title: string;
  content: string;
  placeholder: string;
}

// Default PRD sections
export const PRD_SECTIONS: PRDSection[] = [
  { id: 'problem', title: 'Problem Statement', content: '', placeholder: 'What problem are we solving?' },
  { id: 'solution', title: 'Proposed Solution', content: '', placeholder: 'How will we solve it?' },
  { id: 'requirements', title: 'Requirements', content: '', placeholder: 'What must the solution include?' },
  { id: 'non-goals', title: 'Non-Goals', content: '', placeholder: 'What are we explicitly NOT doing?' },
  { id: 'success-metrics', title: 'Success Metrics', content: '', placeholder: 'How will we measure success?' },
  { id: 'timeline', title: 'Timeline', content: '', placeholder: 'Key milestones and dates' },
  { id: 'open-questions', title: 'Open Questions', content: '', placeholder: 'What needs to be resolved?' },
];
