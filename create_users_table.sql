create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  name text not null,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policy to enable all operations for authenticated users only
create policy "Users can manage their own data" on public.users
  for all
  using (auth.uid() = id);
