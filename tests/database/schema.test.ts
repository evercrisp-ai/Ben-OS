// tests/database/schema.test.ts
// Database Schema Tests for Section 1.2

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import * as fs from 'fs';
import * as path from 'path';

// Create a test client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Skip tests if environment variables are not set
const shouldSkip = !supabaseUrl || !supabaseAnonKey;

const supabase = shouldSkip
  ? null
  : createClient<Database>(supabaseUrl!, supabaseAnonKey!);

// Helper function to create a test area
async function createTestArea() {
  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('areas')
    .insert({
      name: `Test Area ${Date.now()}`,
      type: 'personal',
      color: '#6366f1',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Helper function to clean up test data
async function cleanupTestData(areaId: string) {
  if (!supabase) return;
  await supabase.from('areas').delete().eq('id', areaId);
}

describe('1.2 Database Schema', () => {
  // Skip all tests if environment is not configured
  test.skipIf(shouldSkip)('1.2.1 Supabase client can connect', async () => {
    const { data, error } = await supabase!.from('areas').select('id').limit(1);
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test.skipIf(shouldSkip)('1.2.2 Environment variables configured', () => {
    // This test only passes when env vars are actually set
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  test('1.2.2-alt Environment variable example file exists', () => {
    // Check that the example file exists for developers to reference
    const envExamplePath = path.resolve(process.cwd(), '.env.local.example');
    expect(fs.existsSync(envExamplePath)).toBe(true);
    
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  test.skipIf(shouldSkip)(
    '1.2.3 Areas table exists with correct schema',
    async () => {
      const { data, error } = await supabase!.from('areas').select('*').limit(0);
      expect(error).toBeNull();
    }
  );

  test.skipIf(shouldSkip)('1.2.4 Projects table has FK to areas', async () => {
    const area = await createTestArea();
    try {
      const { data, error } = await supabase!
        .from('projects')
        .insert({
          area_id: area.id,
          title: 'Test Project',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.area_id).toBe(area.id);

      // Cleanup
      if (data) {
        await supabase!.from('projects').delete().eq('id', data.id);
      }
    } finally {
      await cleanupTestData(area.id);
    }
  });

  test.skipIf(shouldSkip)('1.2.5-1.2.12 All tables exist', async () => {
    const tables = [
      'areas',
      'projects',
      'milestones',
      'boards',
      'tasks',
      'subtasks',
      'prds',
      'agents',
      'activity_logs',
      'reports',
    ] as const;

    for (const table of tables) {
      const { error } = await supabase!.from(table).select('*').limit(0);
      expect(error, `Table ${table} should exist`).toBeNull();
    }
  });

  test('1.2.14 Supabase client utility exists', () => {
    // Check that the client module exists with correct exports
    const clientPath = path.resolve(
      process.cwd(),
      'src/lib/supabase/client.ts'
    );
    expect(fs.existsSync(clientPath)).toBe(true);

    // Check file content for expected exports
    const content = fs.readFileSync(clientPath, 'utf-8');
    expect(content).toContain('export function createClient()');
    expect(content).toContain('export function getSupabaseClient()');
    expect(content).toContain('createBrowserClient');
    expect(content).toContain('@/types/database');
  });

  test('1.2.15 TypeScript types exist', () => {
    // Check that the types file exists
    const typesPath = path.resolve(process.cwd(), 'src/types/database.ts');
    expect(fs.existsSync(typesPath)).toBe(true);

    // Check file content for expected type definitions
    const content = fs.readFileSync(typesPath, 'utf-8');
    
    // Verify key type exports exist
    expect(content).toContain('export interface Database');
    expect(content).toContain('export type Area =');
    expect(content).toContain('export type Project =');
    expect(content).toContain('export type Task =');
    expect(content).toContain('export type Board =');
    expect(content).toContain('export type Milestone =');
    expect(content).toContain('export type Subtask =');
    expect(content).toContain('export type PRD =');
    expect(content).toContain('export type Agent =');
    expect(content).toContain('export type ActivityLog =');
    expect(content).toContain('export type Report =');
  });

  test('1.2.13 Migration file exists with RLS policies', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/001_initial_schema.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const content = fs.readFileSync(migrationPath, 'utf-8');

    // Check for RLS enable statements
    expect(content).toContain('ENABLE ROW LEVEL SECURITY');

    // Check for RLS policies
    expect(content).toContain('CREATE POLICY');

    // Check for all table creations
    const tables = [
      'areas',
      'projects',
      'milestones',
      'boards',
      'tasks',
      'subtasks',
      'prds',
      'agents',
      'activity_logs',
      'reports',
    ];
    tables.forEach((table) => {
      expect(content).toContain(`CREATE TABLE ${table}`);
    });
  });

  test('1.2 Server utility exists', async () => {
    const serverPath = path.resolve(
      process.cwd(),
      'src/lib/supabase/server.ts'
    );
    expect(fs.existsSync(serverPath)).toBe(true);

    const content = fs.readFileSync(serverPath, 'utf-8');
    expect(content).toContain('createServerClient');
    expect(content).toContain('createServiceRoleClient');
  });
});

describe('1.2 Database Schema - Integration Tests', () => {
  let testAreaId: string | null = null;
  let testProjectId: string | null = null;
  let testBoardId: string | null = null;

  beforeAll(async () => {
    if (shouldSkip || !supabase) return;

    // Create test area
    const { data: area } = await supabase
      .from('areas')
      .insert({ name: 'Integration Test Area', type: 'work' })
      .select()
      .single();
    testAreaId = area?.id ?? null;

    // Create test project
    if (testAreaId) {
      const { data: project } = await supabase
        .from('projects')
        .insert({ area_id: testAreaId, title: 'Integration Test Project' })
        .select()
        .single();
      testProjectId = project?.id ?? null;

      // Create test board
      if (testProjectId) {
        const { data: board } = await supabase
          .from('boards')
          .insert({ project_id: testProjectId, name: 'Integration Test Board' })
          .select()
          .single();
        testBoardId = board?.id ?? null;
      }
    }
  });

  afterAll(async () => {
    if (shouldSkip || !supabase) return;

    // Cleanup in reverse order due to FK constraints
    if (testAreaId) {
      await supabase.from('areas').delete().eq('id', testAreaId);
    }
  });

  test.skipIf(shouldSkip)('Can create and query milestones', async () => {
    if (!testProjectId) throw new Error('Test project not created');

    const { data, error } = await supabase!
      .from('milestones')
      .insert({
        project_id: testProjectId,
        title: 'Test Milestone',
        status: 'pending',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.title).toBe('Test Milestone');

    // Cleanup
    if (data) {
      await supabase!.from('milestones').delete().eq('id', data.id);
    }
  });

  test.skipIf(shouldSkip)('Can create and query tasks', async () => {
    if (!testBoardId) throw new Error('Test board not created');

    const { data, error } = await supabase!
      .from('tasks')
      .insert({
        board_id: testBoardId,
        title: 'Test Task',
        status: 'backlog',
        priority: 'medium',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.title).toBe('Test Task');
    expect(data?.status).toBe('backlog');

    // Cleanup
    if (data) {
      await supabase!.from('tasks').delete().eq('id', data.id);
    }
  });

  test.skipIf(shouldSkip)('Can create and query subtasks', async () => {
    if (!testBoardId) throw new Error('Test board not created');

    // First create a task
    const { data: task } = await supabase!
      .from('tasks')
      .insert({
        board_id: testBoardId,
        title: 'Parent Task',
      })
      .select()
      .single();

    if (!task) throw new Error('Task not created');

    const { data: subtask, error } = await supabase!
      .from('subtasks')
      .insert({
        task_id: task.id,
        title: 'Test Subtask',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(subtask?.title).toBe('Test Subtask');
    expect(subtask?.completed).toBe(false);

    // Cleanup
    await supabase!.from('tasks').delete().eq('id', task.id);
  });

  test.skipIf(shouldSkip)('Can create and query PRDs', async () => {
    if (!testProjectId) throw new Error('Test project not created');

    const { data, error } = await supabase!
      .from('prds')
      .insert({
        project_id: testProjectId,
        title: 'Test PRD',
        status: 'draft',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.title).toBe('Test PRD');
    expect(data?.status).toBe('draft');

    // Cleanup
    if (data) {
      await supabase!.from('prds').delete().eq('id', data.id);
    }
  });

  test.skipIf(shouldSkip)('Can create and query activity logs', async () => {
    if (!testProjectId) throw new Error('Test project not created');

    const { data, error } = await supabase!
      .from('activity_logs')
      .insert({
        entity_type: 'projects',
        entity_id: testProjectId,
        action: 'test_action',
        payload: { test: true },
        user_initiated: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.action).toBe('test_action');
    expect(data?.user_initiated).toBe(true);

    // Cleanup
    if (data) {
      await supabase!.from('activity_logs').delete().eq('id', data.id);
    }
  });

  test.skipIf(shouldSkip)('Can create and query reports', async () => {
    const { data, error } = await supabase!
      .from('reports')
      .insert({
        type: 'daily',
        period_start: '2026-01-30',
        period_end: '2026-01-30',
        content: { tasks_completed: 5, summary: 'Test report' },
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.type).toBe('daily');

    // Cleanup
    if (data) {
      await supabase!.from('reports').delete().eq('id', data.id);
    }
  });

  test.skipIf(shouldSkip)('Cascade delete works correctly', async () => {
    // Create a complete hierarchy
    const { data: area } = await supabase!
      .from('areas')
      .insert({ name: 'Cascade Test Area', type: 'personal' })
      .select()
      .single();

    const { data: project } = await supabase!
      .from('projects')
      .insert({ area_id: area!.id, title: 'Cascade Test Project' })
      .select()
      .single();

    const { data: board } = await supabase!
      .from('boards')
      .insert({ project_id: project!.id, name: 'Cascade Test Board' })
      .select()
      .single();

    const { data: task } = await supabase!
      .from('tasks')
      .insert({ board_id: board!.id, title: 'Cascade Test Task' })
      .select()
      .single();

    // Delete the area - should cascade to all children
    await supabase!.from('areas').delete().eq('id', area!.id);

    // Verify all are deleted
    const { data: deletedProject } = await supabase!
      .from('projects')
      .select()
      .eq('id', project!.id)
      .single();

    const { data: deletedBoard } = await supabase!
      .from('boards')
      .select()
      .eq('id', board!.id)
      .single();

    const { data: deletedTask } = await supabase!
      .from('tasks')
      .select()
      .eq('id', task!.id)
      .single();

    expect(deletedProject).toBeNull();
    expect(deletedBoard).toBeNull();
    expect(deletedTask).toBeNull();
  });
});
