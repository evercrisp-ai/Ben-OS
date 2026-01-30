/**
 * Ben OS Auth Setup Script
 * 
 * This script:
 * 1. Creates the two allowed users in Supabase Auth
 * 2. Runs the allowlist migration
 * 
 * Usage: npx tsx scripts/setup-auth.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// User accounts to create
const USERS = [
  { email: 'ben@evercrisp.ai', password: '', name: 'Ben', role: 'owner' },
  { email: 'jules@evercrisp.ai', password: '', name: 'Jules (AI Agent)', role: 'agent' },
];

async function generateSecurePassword(): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createUsers() {
  console.log('\n🔐 Ben OS Auth Setup\n');
  console.log('Creating user accounts...\n');

  const createdUsers: { email: string; password: string }[] = [];

  for (const user of USERS) {
    // Generate a secure password
    const password = await generateSecurePassword();
    
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === user.email);
    
    if (existingUser) {
      console.log(`⚠️  User ${user.email} already exists, updating password...`);
      
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: password,
        email_confirm: true,
      });
      
      if (error) {
        console.error(`❌ Failed to update ${user.email}: ${error.message}`);
        continue;
      }
      
      createdUsers.push({ email: user.email, password });
      console.log(`✅ Updated ${user.email}`);
    } else {
      // Create new user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      });

      if (error) {
        console.error(`❌ Failed to create ${user.email}: ${error.message}`);
        continue;
      }

      createdUsers.push({ email: user.email, password });
      console.log(`✅ Created ${user.email}`);
    }
  }

  // Print credentials
  if (createdUsers.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('🔑 USER CREDENTIALS (save these securely!)');
    console.log('='.repeat(60) + '\n');
    
    for (const user of createdUsers) {
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔒 Password: ${user.password}`);
      console.log('');
    }
    
    console.log('='.repeat(60));
    console.log('⚠️  IMPORTANT: Save these passwords now! They cannot be retrieved later.');
    console.log('='.repeat(60) + '\n');
  }
}

async function runMigration() {
  console.log('Running allowlist migration...\n');

  // Read the migration file
  const fs = await import('fs');
  const path = await import('path');
  
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/004_auth_allowlist.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements and run them
  // Note: This is a simplified approach - complex migrations may need psql
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();
  
  if (error) {
    // RPC doesn't exist, need to run via SQL Editor
    console.log('⚠️  Cannot run migration automatically via RPC.');
    console.log('');
    console.log('Please run the migration manually:');
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Paste the contents of: supabase/migrations/004_auth_allowlist.sql');
    console.log('5. Click "Run"');
    console.log('');
  } else {
    console.log('✅ Migration completed successfully!');
  }
}

async function main() {
  try {
    await createUsers();
    await runMigration();
    
    console.log('\n✅ Setup complete!\n');
    console.log('Next steps:');
    console.log('1. Save the passwords shown above');
    console.log('2. If migration was not auto-run, run it manually in SQL Editor');
    console.log('3. Start the app with: npm run dev');
    console.log('4. Sign in with your email and password\n');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main();
