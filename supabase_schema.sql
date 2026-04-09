-- 1. Create Profiles table (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  role text check (role in ('student', 'doctor', 'admin')) default 'student',
  student_id text,
  avatar text
);

-- Turn on Row Level Security
alter table public.profiles enable row level security;

-- Create policies for Profiles
-- Users can read their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
-- Create a secure function to fetch user role without triggering RLS recursively
create or replace function public.get_user_role()
returns text
language plpgsql
security definer
as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = auth.uid();
  return user_role;
end;
$$;

-- Admins can view all profiles
create policy "Admins can view all profiles" on profiles
  for select using (
    public.get_user_role() = 'admin'
  );

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role, student_id)
  values (new.id, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'student'), new.raw_user_meta_data->>'student_id');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Create Appointments table
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references public.profiles(id) on delete cascade not null,
  "doctorId" text not null,
  "doctorName" text not null,
  specialty text not null,
  "timeSlot" text not null,
  date text not null,
  status text check (status in ('booked', 'completed', 'cancelled')) default 'booked',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.appointments enable row level security;

-- Create policies for Appointments
create policy "Users can view own appointments" on appointments
  for select using (auth.uid() = "userId");
create policy "Users can insert own appointments" on appointments
  for insert with check (auth.uid() = "userId");
create policy "Users can update own appointments" on appointments
  for update using (auth.uid() = "userId");


-- 3. Create Claims table
create table public.claims (
  id uuid default gen_random_uuid() primary key,
  "userId" uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  description text not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  "fileUrl" text,
  "createdAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.claims enable row level security;

-- Create policies for Claims
create policy "Users can view own claims" on claims
  for select using (auth.uid() = "userId");
create policy "Users can insert own claims" on claims
  for insert with check (auth.uid() = "userId");
create policy "Users can update own claims" on claims
  for update using (auth.uid() = "userId");
