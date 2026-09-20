-- 0002 — shared foundation for every tracker.
-- Safe to re-run.

-- Keeps updated_at honest without application code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Per-user preferences and targets. One row per user.
create table if not exists public.user_settings (
  user_id                uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  timezone               text not null default 'UTC',
  daily_calorie_target   integer,
  daily_water_target_ml  integer,
  weight_unit            text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

drop policy if exists "read own settings" on public.user_settings;
create policy "read own settings" on public.user_settings
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insert own settings" on public.user_settings;
create policy "insert own settings" on public.user_settings
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "update own settings" on public.user_settings;
create policy "update own settings" on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "delete own settings" on public.user_settings;
create policy "delete own settings" on public.user_settings
  for delete to authenticated using ((select auth.uid()) = user_id);
