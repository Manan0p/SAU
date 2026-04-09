-- ============================================================
-- UniWell Full Schema v2
-- Run this in Supabase SQL Editor.
-- IMPORTANT: If upgrading, drop old tables first or run in order.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- MIGRATION: Handle transition from old MVP 'role' to 'roles' and ensure all new columns exist
do $$ 
begin 
  -- 1. Ensure 'roles' array exists
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='roles') then
    alter table public.profiles add column roles text[] default array['student'];
    if exists (select 1 from information_schema.columns where table_name='profiles' and column_name='role') then
      update public.profiles set roles = array[role];
    end if;
  end if;

  -- 2. Ensure 'college_id' exists (rename from student_id if needed)
  if exists (select 1 from information_schema.columns where table_name='profiles' and column_name='student_id') then
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='college_id') then
      alter table public.profiles rename column student_id to college_id;
    end if;
  elsif not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='college_id') then
    alter table public.profiles add column college_id text;
  end if;

  -- 3. Ensure all other platform columns exist
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='email') then
    alter table public.profiles add column email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='phone') then
    alter table public.profiles add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='class') then
    alter table public.profiles add column class text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='branch') then
    alter table public.profiles add column branch text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='batch') then
    alter table public.profiles add column batch text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='blood_group') then
    alter table public.profiles add column blood_group text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='medical_conditions') then
    alter table public.profiles add column medical_conditions text;
  end if;
end $$;



create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade not null primary key,
  name          text,
  email         text,
  phone         text,
  class         text,
  branch        text,
  batch         text,
  college_id    text,
  blood_group   text,
  medical_conditions text,
  roles         text[] default array['student'],
  avatar        text,
  created_at    timestamp with time zone default timezone('utc', now()) not null,
  updated_at    timestamp with time zone default timezone('utc', now()) not null
);


alter table public.profiles enable row level security;

-- Anyone can read their own profile
drop policy if exists "Users can view own profile" on profiles;
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- Anyone can update their own profile
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Admins can view/update all
drop policy if exists "Admins can view all profiles" on profiles;
create policy "Admins can view all profiles" on profiles
  for select using ('admin' = any(public.get_user_roles()));

drop policy if exists "Admins can update all profiles" on profiles;
create policy "Admins can update all profiles" on profiles
  for update using ('admin' = any(public.get_user_roles()));

-- Doctors can view all (needed for medical history)
drop policy if exists "Doctors can view all profiles" on profiles;
create policy "Doctors can view all profiles" on profiles
  for select using ('doctor' = any(public.get_user_roles()));


-- Helper function to get caller's roles (Bypasses RLS to avoid recursion)
create or replace function public.get_user_roles()
returns text[]
language plpgsql security definer
set search_path = public
as $$
declare user_roles text[];
begin
  select roles into user_roles from public.profiles where id = auth.uid();
  return coalesce(user_roles, array[]::text[]);
end;
$$;


-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, roles, college_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New User'),
    new.email,
    coalesce(
      case when new.raw_user_meta_data->>'role' is not null
        then array[new.raw_user_meta_data->>'role']
      else array['student']
      end,
      array['student']
    ),
    new.raw_user_meta_data->>'college_id'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. APPOINTMENTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id            uuid default gen_random_uuid() primary key,
  "userId"      uuid references public.profiles(id) on delete cascade not null,
  "doctorId"    text not null,
  "doctorName"  text not null,
  specialty     text not null,
  "timeSlot"    text not null,
  date          text not null,
  status        text check (status in ('booked', 'completed', 'cancelled')) default 'booked',
  notes         text,
  created_at    timestamp with time zone default timezone('utc', now()) not null
);

alter table public.appointments enable row level security;

drop policy if exists "Users can view own appointments" on appointments;
create policy "Users can view own appointments" on appointments
  for select using (auth.uid() = "userId");

drop policy if exists "Users can insert own appointments" on appointments;
create policy "Users can insert own appointments" on appointments
  for insert with check (auth.uid() = "userId");

drop policy if exists "Users can update own appointments" on appointments;
create policy "Users can update own appointments" on appointments
  for update using (auth.uid() = "userId");

-- Doctors see all appointments
drop policy if exists "Doctors can view all appointments" on appointments;
create policy "Doctors can view all appointments" on appointments
  for select using ('doctor' = any(public.get_user_roles()));

drop policy if exists "Doctors can update all appointments" on appointments;
create policy "Doctors can update all appointments" on appointments
  for update using ('doctor' = any(public.get_user_roles()));


-- ─────────────────────────────────────────────────────────────
-- 3. INSURANCE CLAIMS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.claims (
  id            uuid default gen_random_uuid() primary key,
  "userId"      uuid references public.profiles(id) on delete cascade not null,
  amount        numeric not null,
  description   text not null,
  status        text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  "fileUrl"     text,
  "reviewedBy"  uuid references public.profiles(id),
  "reviewNote"  text,
  "approvedAmount" numeric,
  "createdAt"   timestamp with time zone default timezone('utc', now()) not null,
  "updatedAt"   timestamp with time zone default timezone('utc', now()) not null
);

alter table public.claims enable row level security;

drop policy if exists "Users can view own claims" on claims;
create policy "Users can view own claims" on claims
  for select using (auth.uid() = "userId");

drop policy if exists "Users can insert own claims" on claims;
create policy "Users can insert own claims" on claims
  for insert with check (auth.uid() = "userId");

-- Insurance role can view & update all claims
drop policy if exists "Insurance role can view all claims" on claims;
create policy "Insurance role can view all claims" on claims
  for select using ('insurance' = any(public.get_user_roles()) or 'admin' = any(public.get_user_roles()));

drop policy if exists "Insurance role can update claims" on claims;
create policy "Insurance role can update claims" on claims
  for update using ('insurance' = any(public.get_user_roles()) or 'admin' = any(public.get_user_roles()));


-- ─────────────────────────────────────────────────────────────
-- 4. MEDICAL RECORDS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.medical_records (
  id            uuid default gen_random_uuid() primary key,
  "patientId"   uuid references public.profiles(id) on delete cascade not null,
  "doctorId"    uuid references public.profiles(id) not null,
  "doctorName"  text not null,
  diagnosis     text not null,
  treatment     text,
  prescription  text,
  notes         text,
  "visitDate"   text not null,
  created_at    timestamp with time zone default timezone('utc', now()) not null
);

alter table public.medical_records enable row level security;

-- Patients read their own records
drop policy if exists "Patients view own records" on medical_records;
create policy "Patients view own records" on medical_records
  for select using (auth.uid() = "patientId");

-- Doctors can view all records (emergency access) and create/update
drop policy if exists "Doctors can view all records" on medical_records;
create policy "Doctors can view all records" on medical_records
  for select using ('doctor' = any(public.get_user_roles()));

drop policy if exists "Doctors can insert records" on medical_records;
create policy "Doctors can insert records" on medical_records
  for insert with check ('doctor' = any(public.get_user_roles()));

drop policy if exists "Doctors can update records" on medical_records;
create policy "Doctors can update records" on medical_records
  for update using ('doctor' = any(public.get_user_roles()));

-- Admins can view all
drop policy if exists "Admins view all records" on medical_records;
create policy "Admins view all records" on medical_records
  for select using ('admin' = any(public.get_user_roles()));


-- ─────────────────────────────────────────────────────────────
-- 5. PRESCRIPTIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.prescriptions (
  id            uuid default gen_random_uuid() primary key,
  "patientId"   uuid references public.profiles(id) on delete cascade not null,
  "patientName" text not null,
  "doctorId"    uuid references public.profiles(id) not null,
  "doctorName"  text not null,
  "recordId"    uuid references public.medical_records(id),
  medicines     jsonb not null default '[]',  -- [{name, dosage, duration, qty}]
  instructions  text,
  status        text check (status in ('pending', 'dispensed')) default 'pending',
  created_at    timestamp with time zone default timezone('utc', now()) not null
);

alter table public.prescriptions enable row level security;

drop policy if exists "Patients view own prescriptions" on prescriptions;
create policy "Patients view own prescriptions" on prescriptions
  for select using (auth.uid() = "patientId");

drop policy if exists "Doctors manage prescriptions" on prescriptions;
create policy "Doctors manage prescriptions" on prescriptions
  for all using ('doctor' = any(public.get_user_roles()));

drop policy if exists "Pharmacy can view and update prescriptions" on prescriptions;
create policy "Pharmacy can view and update prescriptions" on prescriptions
  for select using ('pharmacy' = any(public.get_user_roles()));

drop policy if exists "Pharmacy can mark dispensed" on prescriptions;
create policy "Pharmacy can mark dispensed" on prescriptions
  for update using ('pharmacy' = any(public.get_user_roles()));


-- ─────────────────────────────────────────────────────────────
-- 6. PHARMACY INVENTORY
-- ─────────────────────────────────────────────────────────────
create table if not exists public.pharmacy_inventory (
  id            uuid default gen_random_uuid() primary key,
  name          text not null,
  generic_name  text,
  category      text,
  quantity      integer not null default 0,
  unit          text default 'tablets',
  threshold     integer default 10,  -- low-stock alert trigger
  price_per_unit numeric default 0,
  updated_at    timestamp with time zone default timezone('utc', now()) not null
);

alter table public.pharmacy_inventory enable row level security;

drop policy if exists "Pharmacy and doctors can view inventory" on pharmacy_inventory;
create policy "Pharmacy and doctors can view inventory" on pharmacy_inventory
  for select using (
    'pharmacy' = any(public.get_user_roles()) or
    'doctor' = any(public.get_user_roles()) or
    'admin' = any(public.get_user_roles())
  );

drop policy if exists "Pharmacy can manage inventory" on pharmacy_inventory;
create policy "Pharmacy can manage inventory" on pharmacy_inventory
  for all using ('pharmacy' = any(public.get_user_roles()) or 'admin' = any(public.get_user_roles()));


-- ─────────────────────────────────────────────────────────────
-- 7. SOS REQUESTS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sos_requests (
  id              uuid default gen_random_uuid() primary key,
  "userId"        uuid references public.profiles(id) on delete cascade not null,
  "userName"      text not null,
  "userPhone"     text,
  "collegeId"     text,
  lat             double precision not null,
  lng             double precision not null,
  accuracy        double precision,
  status          text check (status in ('active', 'responding', 'resolved')) default 'active',
  message         text,
  "resolvedBy"    uuid references public.profiles(id),
  "resolvedNote"  text,
  "resolvedAt"    timestamp with time zone,
  -- For ambulance-ready architecture
  "ambulanceCalled" boolean default false,
  created_at      timestamp with time zone default timezone('utc', now()) not null,
  updated_at      timestamp with time zone default timezone('utc', now()) not null
);

alter table public.sos_requests enable row level security;

-- Students can create their own SOS
drop policy if exists "Users can create own SOS" on sos_requests;
create policy "Users can create own SOS" on sos_requests
  for insert with check (auth.uid() = "userId");

-- Users can view their own SOS
drop policy if exists "Users can view own SOS" on sos_requests;
create policy "Users can view own SOS" on sos_requests
  for select using (auth.uid() = "userId");

-- Authorized roles (doctor, medical_center, pharmacy, admin) can view ALL SOS
drop policy if exists "Authorized roles view all SOS" on sos_requests;
create policy "Authorized roles view all SOS" on sos_requests
  for select using (
    'doctor' = any(public.get_user_roles()) or
    'medical_center' = any(public.get_user_roles()) or
    'pharmacy' = any(public.get_user_roles()) or
    'admin' = any(public.get_user_roles())
  );

-- Authorized roles can update SOS status (mark responding/resolved)
drop policy if exists "Authorized roles update SOS" on sos_requests;
create policy "Authorized roles update SOS" on sos_requests
  for update using (
    'doctor' = any(public.get_user_roles()) or
    'medical_center' = any(public.get_user_roles()) or
    'admin' = any(public.get_user_roles())
  );

-- Enable realtime for SOS (Supabase handled)
-- Note: You might need to add it manually in the dashboard IF this errors on re-run
-- alter publication supabase_realtime add table public.sos_requests;


-- ─────────────────────────────────────────────────────────────
-- 8. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid default gen_random_uuid() primary key,
  "userId"    uuid references public.profiles(id) on delete cascade not null,
  type        text not null,  -- 'sos', 'appointment', 'insurance', 'general'
  title       text not null,
  message     text not null,
  read        boolean default false,
  "relatedId" uuid,    -- optional FK to sos/appointment/claim
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table public.notifications enable row level security;

drop policy if exists "Users see own notifications" on notifications;
create policy "Users see own notifications" on notifications
  for select using (auth.uid() = "userId");

drop policy if exists "Users update own notifications" on notifications;
create policy "Users update own notifications" on notifications
  for update using (auth.uid() = "userId");

-- Enable realtime for notifications
-- alter publication supabase_realtime add table public.notifications;


-- ─────────────────────────────────────────────────────────────
-- 9. AUDIT LOGS
-- ─────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid default gen_random_uuid() primary key,
  "actorId"   uuid references public.profiles(id),
  action      text not null,   -- 'role_change', 'sos_resolved', 'claim_reviewed', etc.
  target      text,            -- table or entity name
  "targetId"  uuid,
  details     jsonb,
  created_at  timestamp with time zone default timezone('utc', now()) not null
);

alter table public.audit_logs enable row level security;

drop policy if exists "Admins can view audit logs" on audit_logs;
create policy "Admins can view audit logs" on audit_logs
  for select using ('admin' = any(public.get_user_roles()));

drop policy if exists "System can insert audit logs" on audit_logs;
create policy "System can insert audit logs" on audit_logs
  for insert with check (true);


-- ─────────────────────────────────────────────────────────────
-- 10. SEED PHARMACY INVENTORY (sample data)
-- ─────────────────────────────────────────────────────────────
insert into public.pharmacy_inventory (name, generic_name, category, quantity, unit, threshold, price_per_unit) values
  ('Paracetamol 500mg', 'Paracetamol', 'Analgesic', 500, 'tablets', 50, 2.50),
  ('Ibuprofen 400mg', 'Ibuprofen', 'NSAID', 300, 'tablets', 30, 4.00),
  ('Amoxicillin 500mg', 'Amoxicillin', 'Antibiotic', 150, 'capsules', 20, 12.00),
  ('ORS Sachet', 'ORS', 'Electrolyte', 200, 'sachets', 25, 8.00),
  ('Antacid Suspension', 'Magnesium Hydroxide', 'Antacid', 80, 'bottles', 10, 45.00),
  ('Cetrizine 10mg', 'Cetirizine', 'Antihistamine', 400, 'tablets', 40, 3.50),
  ('Bandage Large', NULL, 'First Aid', 50, 'rolls', 5, 30.00),
  ('Betadine Solution', 'Povidone Iodine', 'Antiseptic', 30, 'bottles', 5, 85.00)
on conflict do nothing;
