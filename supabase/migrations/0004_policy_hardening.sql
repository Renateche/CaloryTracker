-- 0004 — bring the original meals policies in line with the others.
--
-- Two changes:
--   * scope to the `authenticated` role, so anonymous requests are rejected
--     before the row check runs
--   * wrap auth.uid() in a scalar subquery, which lets Postgres evaluate it
--     once per statement instead of once per row
--
-- Safe to re-run.

drop policy if exists "read own meals" on public.meals;
create policy "read own meals" on public.meals
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "insert own meals" on public.meals;
create policy "insert own meals" on public.meals
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "update own meals" on public.meals;
create policy "update own meals" on public.meals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "delete own meals" on public.meals;
create policy "delete own meals" on public.meals
  for delete to authenticated using ((select auth.uid()) = user_id);
