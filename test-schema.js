const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/[\'\"]/g, '').replace('\r','');
});

const { createClient } = require('@supabase/supabase-js');
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { error: e1 } = await s.from('claims').select('approvedAmount').limit(1);
  console.log('approvedAmount:', e1?.message || 'Success');

  const { error: e2 } = await s.from('claims').select('approved_amount').limit(1);
  console.log('approved_amount:', e2?.message || 'Success');
}
test();
