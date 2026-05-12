create extension if not exists "pgcrypto";

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  year integer not null,
  make text not null,
  model text not null,
  trim text default '',
  price integer not null,
  mileage integer not null,
  location text not null,
  transmission text not null,
  drivetrain text not null,
  fuel_type text not null,
  body_type text not null,
  exterior_color text default '',
  interior_color text default '',
  vin text default '',
  condition text not null,
  engine text not null,
  mpg text default '',
  images text[] not null default '{}',
  pills text[] not null default '{}',
  features text[] not null default '{}',
  description text not null,
  sold boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.cars enable row level security;

drop policy if exists "Public can read car listings" on public.cars;
create policy "Public can read car listings"
  on public.cars
  for select
  using (true);

-- Writes happen only through Next.js API routes using SUPABASE_SERVICE_ROLE_KEY.

insert into storage.buckets (id, name, public)
values ('cars', 'cars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read car images" on storage.objects;
create policy "Public can read car images"
  on storage.objects
  for select
  using (bucket_id = 'cars');
