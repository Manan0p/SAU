
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve('.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        env[match[1]] = value.trim();
      }
    });
    return env;
  } catch (e) {
    console.error('Failed to load .env.local', e);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'admin@uniwell.edu';
  const password = 'UniAdmin2024!';

  console.log(`Creating user ${email}...`);

  // 1. Create the user in Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Super Admin' }
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    if (authError.message.includes('already registered')) {
        console.log('User already exists, attempting to promote...');
        // Try to fetch existing user
        const { data: usersList } = await adminClient.auth.admin.listUsers();
        const existingUser = usersList.users.find(u => u.email === email);
        if (existingUser) {
             await promote(existingUser.id);
             return;
        }
    }
    return;
  }

  const userId = authData.user.id;
  console.log(`User created with ID: ${userId}`);

  // 2. Promotion step
  await promote(userId);
}

async function promote(userId: string) {
  console.log('Promoting to admin...');
  
  // Wait for trigger to create row
  await new Promise(resolve => setTimeout(resolve, 3000));

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ roles: ['admin', 'student'], name: 'System Admin' })
    .eq('id', userId);

  if (profileError) {
    console.error('Profile Update Error:', profileError.message);
    // If update failed because row doesn't exist, try upsert
    console.log('Attempting upsert...');
    await adminClient.from('profiles').upsert({
        id: userId,
        email: 'admin@uniwell.edu',
        name: 'System Admin',
        roles: ['admin', 'student']
    });
  }
  
  console.log('✅ Admin user ready!');
  console.log(`Email: admin@uniwell.edu`);
  console.log(`Password: UniAdmin2024!`);
}

createAdmin();
