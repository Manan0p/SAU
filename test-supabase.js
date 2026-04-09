const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/[\'\"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'arjun@sau.edu.in', password: 'password123' });
  console.log('Login attempt:', data.user ? 'Success' : 'Failed', error ? error.message : '');

  if (data.user) {
     const { data: profile, error: pError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
     console.log('Profile query:', profile ? 'Found' : 'Not Found', pError ? pError.message : '');
     console.log('Profile Data:', profile);
  } else {
     // Let's also check if user exists at all via a sign up attempt
     const signupRes = await supabase.auth.signUp({ email: 'arjun@sau.edu.in', password: 'password123' });
     console.log('SignUp test:', signupRes.data?.user ? 'Success' : 'Failed', signupRes.error ? signupRes.error.message : '');
  }
}
test();
