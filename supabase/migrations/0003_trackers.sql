-- 0003 — tables for the remaining trackers.
-- Every table follows the same shape: user_id FK with auth.uid() default,
-- an index on (user_id, <date column> desc), RLS enabled, four policies.
-- Safe to re-run.

/* ---------------------------------------------------------------- */
/* Habits                                                            */
/* ---------------------------------------------------------------- */

create table if not exists public.habits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name              text not null,
  cadence           text not null default 'daily' check (cadence in ('daily', 'weekly')),
  target_per_period integer not null default 1 check (target_per_period > 0),
  colour            text,
  archived_at       timestamptz,
  created_at        timestamptz not null default now()
);

create index if not exists habits_user_created_idx
  on public.habits (user_id, created_at desc);

create table if not exists public.habit_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  habit_id   uuid not null references public.habits (id) on delete cascade,
  entered_on date not null default current_date,
  count      integer not null default 1 check (count >= 0),
  note       text,
  created_at timestamptz not null default now(),
  unique (habit_id, entered_on)
);

create index if not exists habit_entries_user_day_idx
  on public.habit_entries (user_id, entered_on desc);

/* ---------------------------------------------------------------- */
/* Health metrics                                                    */
/* ---------------------------------------------------------------- */

create table if not exists public.health_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  metric_type text not null check (
    metric_type in ('weight', 'body_fat', 'waist', 'blood_pressure', 'resting_heart_rate')
  ),
  value       numeric(10, 2) not null,
  secondary   numeric(10, 2),          -- diastolic, when metric_type = 'blood_pressure'
  unit        text not null,
  measured_at timestamptz not null default now(),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists health_metrics_user_measured_idx
  on public.health_metrics (user_id, measured_at desc);

/* ---------------------------------------------------------------- */
/* Workouts                                                          */
/* ---------------------------------------------------------------- */

create table if not exists public.workouts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade default auth.uid(),
  activity         text not null,
  started_at       timestamptz not null default now(),
  duration_minutes numeric(6, 1) not null default 0 check (duration_minutes >= 0),
  intensity        text check (intensity in ('easy', 'moderate', 'hard')),
  calories_burned  numeric(10, 2),
  note             text,
  created_at       timestamptz not null default now()
);

create index if not exists workouts_user_started_idx
  on public.workouts (user_id, started_at desc);

/* ---------------------------------------------------------------- */
/* Sleep                                                             */
/* ---------------------------------------------------------------- */

create table if not exists public.sleep_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  slept_at   timestamptz not null,
  wake_at    timestamptz,
  quality    smallint check (quality between 1 and 5),
  note       text,
  created_at timestamptz not null default now(),
  constraint sleep_ends_after_start check (wake_at is null or wake_at > slept_at)
);

create index if not exists sleep_entries_user_slept_idx
  on public.sleep_entries (user_id, slept_at desc);

/* ---------------------------------------------------------------- */
/* Water                                                             */
/* ---------------------------------------------------------------- */

create table if not exists public.water_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  amount_ml  integer not null check (amount_ml > 0),
  drunk_at   timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists water_entries_user_drunk_idx
  on public.water_entries (user_id, drunk_at desc);

/* ---------------------------------------------------------------- */
/* Mood                                                              */
/* ---------------------------------------------------------------- */

create table if not exists public.mood_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  entered_on date not null default current_date,
  score      smallint not null check (score between 1 and 5),
  note       text,
  created_at timestamptz not null default now(),
  unique (user_id, entered_on)
);

create index if not exists mood_entries_user_day_idx
  on public.mood_entries (user_id, entered_on desc);

/* ---------------------------------------------------------------- */
/* RLS for all of the above                                          */
/* ---------------------------------------------------------------- */

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'habits', 'habit_entries', 'health_metrics',
    'workouts', 'sleep_entries', 'water_entries', 'mood_entries'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);

    execute format('drop policy if exists "read own rows" on public.%I', target_table);
    execute format(
      'create policy "read own rows" on public.%I for select to authenticated
         using ((select auth.uid()) = user_id)', target_table);

    execute format('drop policy if exists "insert own rows" on public.%I', target_table);
    execute format(
      'create policy "insert own rows" on public.%I for insert to authenticated
         with check ((select auth.uid()) = user_id)', target_table);

    execute format('drop policy if exists "update own rows" on public.%I', target_table);
    execute format(
      'create policy "update own rows" on public.%I for update to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', target_table);

    execute format('drop policy if exists "delete own rows" on public.%I', target_table);
    execute format(
      'create policy "delete own rows" on public.%I for delete to authenticated
         using ((select auth.uid()) = user_id)', target_table);
  end loop;
end;
$$;
