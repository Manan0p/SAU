
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
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, serviceRoleKey!);

async function inspect() {
  console.log('Inspecting profiles table...');
  const { data, error } = await supabase.rpc('inspect_table', { table_name: 'profiles' });
  
  // If RPC doesn't exist (likely), try raw select from information_schema
  // But Supabase doesn't let you query information_schema easily via REST
  // unless you have an RPC.
  
  // Let's try to just select one row and see the keys
  const { data: rows, error: rowError } = await supabase.from('profiles').select('*').limit(1);
  if (rows && rows.length > 0) {
    console.log('Columns found:', Object.keys(rows[0]));
  } else {
    console.log('No rows found to inspect or error:', rowError?.message);
  }
}

inspect();
