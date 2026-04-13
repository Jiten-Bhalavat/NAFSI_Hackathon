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
create policy "Public read surplus"  on surplus_posts for select using (true);
create policy "Public read status"   on status_posts  for select using (true);
create policy "Public read needs"    on need_posts    for select using (true);

-- Allow anyone to insert
create policy "Public insert surplus" on surplus_posts for insert with check (true);
create policy "Public insert status"  on status_posts  for insert with check (true);
create policy "Public insert needs"   on need_posts    for insert with check (true);

-- Allow anyone to update (for claim/fulfill)
create policy "Public update surplus" on surplus_posts for update using (true);
create policy "Public update needs"   on need_posts    for update using (true);

-- Allow anyone to delete their own posts (open for now)
create policy "Public delete surplus" on surplus_posts for delete using (true);
create policy "Public delete status"  on status_posts  for delete using (true);
create policy "Public delete needs"   on need_posts    for delete using (true);

-- ─── Enable Realtime ──────────────────────────────────────────────────────────
alter publication supabase_realtime add table surplus_posts;
alter publication supabase_realtime add table status_posts;
alter publication supabase_realtime add table need_posts;
