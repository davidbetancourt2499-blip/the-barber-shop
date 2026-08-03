-- ============================================================================
-- THE BARBER SHOP — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

-- Bookings table (folio is the primary key, matching the client-side TBS-XXXXX)
create table if not exists public.bookings (
  id             text primary key,
  folio          text not null,
  name           text not null,
  phone          text not null,
  email          text,
  date           text not null,
  time           text,
  preference     text,
  barber         text not null,
  services       jsonb not null default '[]'::jsonb,
  total          numeric not null default 0,
  status         text not null default 'pending',
  whatsapp_message text,
  whatsapp_phone text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Indexes for the admin panel filters
create index if not exists bookings_date_idx     on public.bookings (date);
create index if not exists bookings_status_idx   on public.bookings (status);
create index if not exists bookings_barber_idx   on public.bookings (barber);
create index if not exists bookings_created_idx  on public.bookings (created_at desc);

-- Row Level Security: block public access (we talk to the DB from serverless
-- functions using the service role key, which bypasses RLS).
alter table public.bookings enable row level security;
