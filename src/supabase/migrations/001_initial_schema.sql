-- ============================================================
-- PadelHub — Initial Schema Migration
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- PROFILES
-- ──────────────────────────────────────────
create table if not exists profiles (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  full_name          text not null,
  phone              text,
  role               text not null default 'player' check (role in ('admin','player')),
  level              text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  notification_prefs jsonb not null default '{"email_24h":true,"push_1h":true,"match_prompt":true}'::jsonb,
  avatar_url         text,
  created_at         timestamptz not null default now(),
  unique (user_id)
);

-- ──────────────────────────────────────────
-- COURTS
-- ──────────────────────────────────────────
create table if not exists courts (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  surface    text not null default 'turf' check (surface in ('grass','clay','concrete','turf')),
  is_indoor  boolean not null default false,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- BOOKINGS
-- ──────────────────────────────────────────
create table if not exists bookings (
  id           uuid primary key default uuid_generate_v4(),
  court_id     uuid not null references courts(id) on delete restrict,
  player_id    uuid not null references profiles(id) on delete cascade,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  status       text not null default 'confirmed' check (status in ('confirmed','cancelled','completed')),
  players_json jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  constraint no_overlap exclude using gist (
    court_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status = 'confirmed')
);

-- ──────────────────────────────────────────
-- MATCH RESULTS
-- ──────────────────────────────────────────
create table if not exists match_results (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references bookings(id) on delete set null,
  player_id   uuid not null references profiles(id) on delete cascade,
  score       text not null,
  partner     text not null,
  opponents   text not null,
  court_name  text not null,
  played_at   timestamptz not null,
  notes       text,
  is_win      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- ACADEMY CLASSES
-- ──────────────────────────────────────────
create table if not exists classes (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  coach         text not null,
  level         text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  schedule_json jsonb not null default '[]'::jsonb,
  max_capacity  int not null default 10,
  is_active     boolean not null default true,
  description   text,
  created_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────
-- ENROLLMENTS
-- ──────────────────────────────────────────
create table if not exists enrollments (
  id          uuid primary key default uuid_generate_v4(),
  class_id    uuid not null references classes(id) on delete cascade,
  player_id   uuid not null references profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (class_id, player_id)
);

-- ──────────────────────────────────────────
-- NOTIFICATIONS LOG
-- ──────────────────────────────────────────
create table if not exists notifications_log (
  id       uuid primary key default uuid_generate_v4(),
  user_id  uuid not null references profiles(id) on delete cascade,
  type     text not null,
  sent_at  timestamptz not null default now(),
  status   text not null default 'sent' check (status in ('sent','failed','pending')),
  metadata jsonb not null default '{}'::jsonb
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles          enable row level security;
alter table courts             enable row level security;
alter table bookings           enable row level security;
alter table match_results      enable row level security;
alter table classes            enable row level security;
alter table enrollments        enable row level security;
alter table notifications_log  enable row level security;

-- Helper function: get current user's profile id
create or replace function get_my_profile_id()
returns uuid language sql stable security definer as $$
  select id from profiles where user_id = auth.uid() limit 1;
$$;

-- Helper function: is current user admin?
create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from profiles where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── PROFILES ──
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (user_id = auth.uid());
create policy "Users can update own profile" on profiles for update using (user_id = auth.uid());

-- ── COURTS ──
create policy "Anyone can view active courts" on courts for select using (is_active = true);
create policy "Admins can manage courts" on courts for all using (is_admin());

-- ── BOOKINGS ──
create policy "Players can view own bookings" on bookings for select
  using (player_id = get_my_profile_id() or is_admin());

create policy "Players can insert bookings" on bookings for insert
  with check (player_id = get_my_profile_id());

create policy "Players can cancel own bookings" on bookings for update
  using (player_id = get_my_profile_id() or is_admin());

-- Public can read confirmed bookings (to show availability)
create policy "Public can view confirmed bookings" on bookings for select
  using (status = 'confirmed');

-- ── MATCH RESULTS ──
create policy "Players view own results" on match_results for select
  using (player_id = get_my_profile_id() or is_admin());

create policy "Players insert own results" on match_results for insert
  with check (player_id = get_my_profile_id());

create policy "Players update own results" on match_results for update
  using (player_id = get_my_profile_id());

-- ── CLASSES ──
create policy "Anyone can view active classes" on classes for select using (is_active = true);
create policy "Admins manage classes" on classes for all using (is_admin());

-- ── ENROLLMENTS ──
create policy "Players view own enrollments" on enrollments for select
  using (player_id = get_my_profile_id() or is_admin());

create policy "Players can enroll" on enrollments for insert
  with check (player_id = get_my_profile_id());

create policy "Players can unenroll" on enrollments for delete
  using (player_id = get_my_profile_id());

-- ── NOTIFICATIONS LOG ──
create policy "Admins view all notifications" on notifications_log for select using (is_admin());
create policy "Users view own notifications" on notifications_log for select
  using (user_id = get_my_profile_id());

-- ============================================================
-- REALTIME
-- ============================================================
-- Enable realtime on bookings and notifications
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table notifications_log;

-- ============================================================
-- SEED — Demo courts
-- ============================================================
insert into courts (name, surface, is_indoor) values
  ('Cancha 1', 'turf', false),
  ('Cancha 2', 'turf', false),
  ('Cancha 3', 'turf', true),
  ('Cancha Techada A', 'concrete', true)
on conflict do nothing;
