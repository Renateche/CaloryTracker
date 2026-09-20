-- Calorie & Meal Calculator — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).

create table if not exists public.meals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name           text not null default 'Meal',
  eaten_at       timestamptz not null default now(),
  ingredients    jsonb not null default '[]'::jsonb,
  total_weight   numeric(10, 2) not null default 0,
  total_calories numeric(10, 2) not null default 0,
  total_protein  numeric(10, 2) not null default 0,
  total_carbs    numeric(10, 2) not null default 0,
  total_fat      numeric(10, 2) not null default 0,
  created_at     timestamptz not null default now(),
  constraint ingredients_is_array check (jsonb_typeof(ingredients) = 'array')
);

create index if not exists meals_user_eaten_idx
  on public.meals (user_id, eaten_at desc);

-- The anon key is public, so RLS is the only thing protecting this data.
alter table public.meals enable row level security;

drop policy if exists "read own meals" on public.meals;
create policy "read own meals" on public.meals
  for select using (auth.uid() = user_id);

drop policy if exists "insert own meals" on public.meals;
create policy "insert own meals" on public.meals
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own meals" on public.meals;
create policy "update own meals" on public.meals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own meals" on public.meals;
create policy "delete own meals" on public.meals
  for delete using (auth.uid() = user_id);
