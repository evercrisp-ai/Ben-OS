/**
 * Run SQL Migration via Supabase REST API
 * 
 * This script reads the migration file and executes it via the Supabase
 * SQL endpoint using the service role key.
 * 
 * Usage: npx tsx scripts/run-migration.ts
 */

import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing environment variables');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function runMigration() {
  console.log('\n🔄 Running Auth Allowlist Migration\n');

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/004_auth_allowlist.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split into individual statements (naive split, may need refinement for complex SQL)
  // For safety, we'll run the whole thing through the REST API
  
  console.log('Connecting to Supabase project:', projectRef);
  console.log('');

  // Use the Supabase REST API to execute SQL
  // The /rest/v1/rpc endpoint can call stored procedures
  // But we need to use the pg-meta API for raw SQL execution
  
  // Alternative: Use the database URL directly with fetch
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    } as HeadersInit,
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // If the RPC doesn't exist, we need to create it first or use an alternative
    if (errorText.includes('function') || errorText.includes('does not exist')) {
      console.log('⚠️  The exec_sql RPC function does not exist.');
      console.log('');
      console.log('Creating helper function and running migration...');
      
      // Try to create the function first
      const createFnResult = await runSqlViaPostgRest(`
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      
      if (createFnResult) {
        // Now try to run the migration
        const migrationResult = await runSqlViaPostgRest(sql);
        if (migrationResult) {
          console.log('✅ Migration completed successfully!');
          return;
        }
      }
      
      // If that failed, show manual instructions
      console.log('\n❌ Could not execute migration automatically.\n');
      showManualInstructions();
      return;
    }
    
    console.error('❌ Failed to run migration:', errorText);
    showManualInstructions();
    return;
  }

  console.log('✅ Migration completed successfully!');
}

async function runSqlViaPostgRest(sql: string): Promise<boolean> {
  // This is a workaround that may not work on all Supabase projects
  // The proper way is to use psql or the SQL Editor
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      } as HeadersInit,
      body: JSON.stringify({ sql }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function showManualInstructions() {
  console.log('='.repeat(60));
  console.log('📋 MANUAL MIGRATION INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. Open your Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('');
  console.log('2. Copy the contents of this file:');
  console.log('   supabase/migrations/004_auth_allowlist.sql');
  console.log('');
  console.log('3. Paste into the SQL Editor and click "Run"');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  console.log('Here is the SQL to run:\n');
  console.log('-'.repeat(60));
  
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/004_auth_allowlist.sql'),
    'utf-8'
  );
  console.log(sql);
  console.log('-'.repeat(60));
}

runMigration();
