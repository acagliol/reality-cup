-- Real or Fake game schema
-- Run in Supabase SQL Editor. Designed for efficient reads during gameplay
-- and leaderboard/history queries.

-- ---------------------------------------------------------------------------
-- Reference data (admin-managed, read-heavy)
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id            text primary key,
  name          text not null,
  description   text not null,
  icon          text not null default '🎮',
  sort_order    int not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.ai_models (
  id            text primary key,
  name          text not null,
  provider      text not null,
  version       text not null,
  active        boolean not null default true
);

-- Shared round content per category (images reused across sessions)
create table if not exists public.round_content (
  id            text primary key,
  category_id   text not null references public.categories(id) on delete cascade,
  image_url     text not null,
  truth_value   smallint not null check (truth_value between 0 and 100),
  sort_order    int not null default 0,
  active        boolean not null default true
);

create index if not exists idx_round_content_category
  on public.round_content(category_id, sort_order);

-- Precomputed AI answers per image (stable, cacheable)
create table if not exists public.ai_answers (
  id                uuid primary key default gen_random_uuid(),
  round_content_id  text not null references public.round_content(id) on delete cascade,
  ai_model_id       text not null references public.ai_models(id) on delete cascade,
  answer_value      smallint not null check (answer_value between 0 and 100),
  unique (round_content_id, ai_model_id)
);

-- Crowd aggregate per image (updated on each player submission)
create table if not exists public.crowd_stats (
  round_content_id  text primary key references public.round_content(id) on delete cascade,
  mean_answer       numeric(5,2) not null default 50,
  answer_count      int not null default 0,
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Player & session data
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  device_id     text unique not null,
  display_name  text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.games (
  id            text primary key,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  category_id   text not null references public.categories(id),
  status        text not null check (status in ('in_progress', 'completed')),
  total_score   int not null default 0,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists idx_games_profile on public.games(profile_id, started_at desc);
create index if not exists idx_games_category_score
  on public.games(category_id, total_score desc)
  where status = 'completed';

create table if not exists public.game_rounds (
  id                uuid primary key default gen_random_uuid(),
  game_id           text not null references public.games(id) on delete cascade,
  round_content_id  text not null references public.round_content(id),
  round_number      smallint not null check (round_number between 1 and 10),
  truth_value       smallint not null check (truth_value between 0 and 100),
  unique (game_id, round_number)
);

create table if not exists public.player_answers (
  id                uuid primary key default gen_random_uuid(),
  game_round_id     uuid not null references public.game_rounds(id) on delete cascade,
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  answer_value      smallint not null check (answer_value between 0 and 100),
  response_time_ms  int not null check (response_time_ms >= 0),
  round_score       int not null check (round_score between 0 and 100),
  answered_at       timestamptz not null default now(),
  unique (game_round_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Leaderboard view (best score per player per category)
-- ---------------------------------------------------------------------------

create or replace view public.leaderboard_by_category as
select
  g.category_id,
  p.display_name as player_name,
  max(g.total_score) as best_score,
  count(*) filter (where g.status = 'completed') as games_played,
  max(g.completed_at) as last_played_at
from public.games g
join public.profiles p on p.id = g.profile_id
where g.status = 'completed'
group by g.category_id, p.id, p.display_name;

-- ---------------------------------------------------------------------------
-- Crowd stats update function (call after each answer insert)
-- ---------------------------------------------------------------------------

create or replace function public.update_crowd_stats(
  p_round_content_id text,
  p_answer_value smallint
) returns void
language plpgsql
as $$
declare
  v_count int;
  v_mean numeric;
begin
  select answer_count, mean_answer
  into v_count, v_mean
  from public.crowd_stats
  where round_content_id = p_round_content_id
  for update;

  if not found then
    insert into public.crowd_stats (round_content_id, mean_answer, answer_count)
    values (p_round_content_id, p_answer_value, 1);
  else
    update public.crowd_stats
    set
      mean_answer = ((v_mean * v_count) + p_answer_value) / (v_count + 1),
      answer_count = v_count + 1,
      updated_at = now()
    where round_content_id = p_round_content_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (hackathon-open; tighten for production)
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.ai_models enable row level security;
alter table public.round_content enable row level security;
alter table public.ai_answers enable row level security;
alter table public.crowd_stats enable row level security;
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_rounds enable row level security;
alter table public.player_answers enable row level security;

-- Read-only public reference tables
create policy "read categories" on public.categories for select to anon, authenticated using (active);
create policy "read ai_models" on public.ai_models for select to anon, authenticated using (active);
create policy "read round_content" on public.round_content for select to anon, authenticated using (active);
create policy "read ai_answers" on public.ai_answers for select to anon, authenticated using (true);
create policy "read crowd_stats" on public.crowd_stats for select to anon, authenticated using (true);

-- Profiles: device-scoped read/write (replace with auth.uid() in production)
create policy "profiles read" on public.profiles for select to anon, authenticated using (true);
create policy "profiles insert" on public.profiles for insert to anon, authenticated with check (true);
create policy "profiles update" on public.profiles for update to anon, authenticated using (true);

create policy "games all" on public.games for all to anon, authenticated using (true) with check (true);
create policy "game_rounds all" on public.game_rounds for all to anon, authenticated using (true) with check (true);
create policy "player_answers all" on public.player_answers for all to anon, authenticated using (true) with check (true);

-- Keep starter notes table for backwards compatibility
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  created_at  timestamptz not null default now()
);
alter table public.notes enable row level security;
drop policy if exists "public notes access" on public.notes;
create policy "public notes access" on public.notes for all to anon, authenticated using (true) with check (true);
