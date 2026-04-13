-- ============================================================
-- NourishNet Community Board — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Surplus Food Posts
create table if not exists surplus_posts (
  id           uuid primary key default gen_random_uuid(),
  food_type    text not null,
  quantity     text not null,
  description  text default '',
  expires_at   timestamptz not null,
  pickup_zip   text not null,
  pickup_address text default '',
  contact      text not null,
  posted_at    timestamptz not null default now(),
  claimed      boolean not null default false
);

-- 2. Pantry Status Updates
create table if not exists status_posts (
  id           uuid primary key default gen_random_uuid(),
  pantry_name  text not null,
  zip          text not null,
  status_type  text not null,
  message      text default '',
  posted_at    timestamptz not null default now(),
  expires_at   timestamptz not null
);

-- 3. Community Need / Food Request Posts
create table if not exists need_posts (
  id           uuid primary key default gen_random_uuid(),
  need_type    text not null,
  zip          text not null,
  details      text default '',
  urgency      text not null check (urgency in ('today', 'week', 'flexible')),
  mobility     text not null check (mobility in ('walk', 'delivery', 'either')),
  posted_at    timestamptz not null default now(),
  expires_at   timestamptz not null,
  fulfilled    boolean not null default false
);

-- ─── Indexes for common queries ───────────────────────────────────────────────
create index if not exists idx_surplus_active on surplus_posts (expires_at) where claimed = false;
create index if not exists idx_status_active  on status_posts  (expires_at);
create index if not exists idx_need_active    on need_posts    (expires_at) where fulfilled = false;

-- ─── Row Level Security (open read/write for anonymous community board) ───────
alter table surplus_posts enable row level security;
alter table status_posts  enable row level security;
alter table need_posts    enable row level security;

-- Allow anyone to read
do $$ begin create policy "Public read surplus"  on surplus_posts for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public read status"   on status_posts  for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public read needs"    on need_posts    for select using (true); exception when duplicate_object then null; end $$;

-- Allow anyone to insert
do $$ begin create policy "Public insert surplus" on surplus_posts for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public insert status"  on status_posts  for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public insert needs"   on need_posts    for insert with check (true); exception when duplicate_object then null; end $$;

-- Allow anyone to update (for claim/fulfill)
do $$ begin create policy "Public update surplus" on surplus_posts for update using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public update needs"   on need_posts    for update using (true); exception when duplicate_object then null; end $$;

-- Allow anyone to delete their own posts (open for now)
do $$ begin create policy "Public delete surplus" on surplus_posts for delete using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public delete status"  on status_posts  for delete using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public delete needs"   on need_posts    for delete using (true); exception when duplicate_object then null; end $$;

-- ─── Enable Realtime ──────────────────────────────────────────────────────────
do $$ begin alter publication supabase_realtime add table surplus_posts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table status_posts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table need_posts; exception when duplicate_object then null; end $$;

-- ============================================================
-- Volunteer Registration & Donor-Volunteer Coordination
-- ============================================================

-- 4. Volunteer Registrations
create table if not exists volunteers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text default '',
  availability   text[] not null default '{}',
  interests      text default '',
  message        text default '',
  zip            text default '',
  opportunity_id text default null,          -- optional: the catalog opportunity they clicked on
  opportunity_title text default null,
  place_name     text default null,
  status         text not null default 'available' check (status in ('available', 'matched', 'inactive')),
  created_at     timestamptz not null default now()
);

-- 5. Donor ↔ Volunteer Matches (coordination requests)
create table if not exists volunteer_matches (
  id             uuid primary key default gen_random_uuid(),
  volunteer_id   uuid not null references volunteers(id) on delete cascade,
  donor_name     text not null,
  donor_email    text not null,
  donor_phone    text default '',
  place_name     text default '',
  place_address  text default '',
  message        text default '',
  status         text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at     timestamptz not null default now()
);

-- Indexes
create index if not exists idx_volunteers_status on volunteers (status, created_at desc);
create index if not exists idx_volunteers_zip    on volunteers (zip) where status = 'available';
create index if not exists idx_matches_volunteer on volunteer_matches (volunteer_id);
create index if not exists idx_matches_status    on volunteer_matches (status);

-- RLS
alter table volunteers enable row level security;
alter table volunteer_matches enable row level security;

do $$ begin create policy "Public read volunteers"   on volunteers for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public insert volunteers" on volunteers for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public update volunteers" on volunteers for update using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public delete volunteers" on volunteers for delete using (true); exception when duplicate_object then null; end $$;

do $$ begin create policy "Public read matches"   on volunteer_matches for select using (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public insert matches" on volunteer_matches for insert with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "Public update matches" on volunteer_matches for update using (true); exception when duplicate_object then null; end $$;

-- Realtime
do $$ begin alter publication supabase_realtime add table volunteers; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table volunteer_matches; exception when duplicate_object then null; end $$;
