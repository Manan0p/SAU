const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/[\'\"]/g, '').replace('\r','');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'admin@uniwell.edu', password: 'UniAdmin2024!' });
  if (data.user) {
    const { data: users, error: uError } = await supabase
      .from("profiles")
      .select("id,name,email,roles,college_id,created_at")
      .order("created_at", { ascending: false });
    console.log('Result:', users?.length, 'Error:', uError?.message);
    if (uError) console.log('Details:', uError.details, uError.hint);
  }
}
test();
