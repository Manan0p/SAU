const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const usersToCreate = [
  { email: 'admin@sau.edu.in', password: 'password123', meta: { name: 'System Admin', role: 'admin' } },
  { email: 'doctor@sau.edu.in', password: 'password123', meta: { name: 'Dr. Jane Smith', role: 'doctor' } },
  { email: 'pharmacy@sau.edu.in', password: 'password123', meta: { name: 'Campus Pharmacy', role: 'pharmacy' } },
  { email: 'insurance@sau.edu.in', password: 'password123', meta: { name: 'Insurance Officer', role: 'insurance' } },
  { email: 'medicalcenter@sau.edu.in', password: 'password123', meta: { name: 'Main Medical Center', role: 'medical_center' } }
];

async function seed() {
  for (const u of usersToCreate) {
    console.log(`Creating user: ${u.email}...`);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.meta
    });

    if (error) {
      if (error.message.includes('already been registered')) {
        console.log(`User ${u.email} already exists. Skipping.`);
      } else {
        console.error(`Error creating ${u.email}:`, error.message);
      }
    } else {
      console.log(`Successfully created ${u.email} (ID: ${data.user.id})`);
      // Since our trigger handles profile creation with roles, it might take a second.
      // But we can also manually ensure the roles are correctly set if the trigger misses some.
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ roles: [u.meta.role] })
        .eq('id', data.user.id);
        
      if (profileError) {
        console.warn(`Could not update specific role for ${u.email}:`, profileError.message);
      }
    }
  }
}

seed();
