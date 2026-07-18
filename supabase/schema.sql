-- ---------------------------------------------------------------------------
-- Starter schema for the hackathon.
-- Run this in the Supabase dashboard:  SQL Editor -> New query -> paste -> Run.
-- Adjust table/columns to your app; this is just a smoke-test table so the
-- demo screen in App.tsx has something to read/write.
-- ---------------------------------------------------------------------------

create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  created_at  timestamptz not null default now()
);

-- Row Level Security: ON by default is the safe posture.
alter table public.notes enable row level security;

-- HACKATHON-ONLY policy: allow anyone (anon key) to read & write.
-- Tighten this before anything real ships (e.g. restrict to auth.uid()).
drop policy if exists "public notes access" on public.notes;
create policy "public notes access"
  on public.notes
  for all
  to anon, authenticated
  using (true)
  with check (true);
