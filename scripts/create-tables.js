const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

const sql1 = `
CREATE TABLE IF NOT EXISTS public.pharmacy_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "studentId" uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  "itemId" uuid REFERENCES public.pharmacy_inventory(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  quantity_requested integer NOT NULL DEFAULT 1 CHECK (quantity_requested > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','rejected')),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pharmacy_orders ENABLE ROW LEVEL SECURITY;
`;

const sql2 = `
CREATE TABLE IF NOT EXISTS public.medical_leave (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "studentId" uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  reason text NOT NULL,
  supporting_doc_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid REFERENCES public.profiles(id),
  review_note text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (to_date >= from_date)
);
ALTER TABLE public.medical_leave ENABLE ROW LEVEL SECURITY;
`;

async function runSQL(sql, name) {
  const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const data = await resp.json();
  if (!resp.ok || data.error) {
    console.log(name, 'Error:', JSON.stringify(data));
  } else {
    console.log(name, 'Created OK');
  }
}

runSQL(sql1, 'pharmacy_orders').then(() => runSQL(sql2, 'medical_leave'));
