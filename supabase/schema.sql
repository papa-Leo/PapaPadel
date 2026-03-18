-- ============================================================
-- PADEL COURT BOOKING APP — SUPABASE SCHEMA
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  full_name   text not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- COURTS
-- ============================================================
create table public.courts (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,                         -- e.g. "Court 1"
  description text,
  is_indoor   boolean default false,
  is_active   boolean default true,
  image_url   text,
  created_at  timestamptz default now()
);

alter table public.courts enable row level security;

create policy "Anyone can view active courts"
  on public.courts for select using (is_active = true);

-- Seed some courts (run after creating the table)
insert into public.courts (name, description, is_indoor) values
  ('Court 1', 'Outdoor panoramic court with professional lighting', false),
  ('Court 2', 'Outdoor court with shade cover', false),
  ('Court 3', 'Indoor climate-controlled court', true),
  ('Court 4', 'Indoor VIP court with spectator seating', true);

-- ============================================================
-- BOOKINGS
-- ============================================================
create type booking_status as enum ('confirmed', 'cancelled', 'completed');

create table public.bookings (
  id          uuid default uuid_generate_v4() primary key,
  court_id    uuid references public.courts(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  date        date not null,
  start_time  time not null,                         -- e.g. 08:00
  end_time    time not null,                         -- e.g. 09:30
  status      booking_status default 'confirmed',
  notes       text,
  player_count int default 4 check (player_count between 2 and 4),
  created_at  timestamptz default now(),

  -- Prevent double-bookings on the same court/date/time
  constraint no_overlap exclude using gist (
    court_id with =,
    date with =,
    tsrange(
      (date + start_time)::timestamp,
      (date + end_time)::timestamp
    ) with &&
  )
);

alter table public.bookings enable row level security;

create policy "Users can view own bookings"
  on public.bookings for select using (auth.uid() = user_id);

create policy "Users can create bookings"
  on public.bookings for insert with check (auth.uid() = user_id);

create policy "Users can cancel own bookings"
  on public.bookings for update using (auth.uid() = user_id);

-- ============================================================
-- AVAILABLE SLOTS VIEW
-- Returns all time slots and marks which are taken
-- ============================================================
create or replace view public.court_availability as
select
  c.id          as court_id,
  c.name        as court_name,
  c.is_indoor,
  b.date,
  b.start_time,
  b.end_time,
  b.status
from public.courts c
left join public.bookings b
  on b.court_id = c.id and b.status = 'confirmed'
where c.is_active = true;

-- ============================================================
-- FUNCTION: check if a slot is available
-- ============================================================
create or replace function public.is_slot_available(
  p_court_id  uuid,
  p_date      date,
  p_start     time,
  p_end       time
) returns boolean language sql security definer as $$
  select not exists (
    select 1 from public.bookings
    where court_id = p_court_id
      and date = p_date
      and status = 'confirmed'
      and (start_time, end_time) overlaps (p_start, p_end)
  );
$$;

-- ============================================================
-- INDEXES
-- ============================================================
create index on public.bookings (court_id, date, status);
create index on public.bookings (user_id, date);
