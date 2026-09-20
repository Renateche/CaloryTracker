/**
 * Supabase connection settings.
 *
 * Replace both placeholders with the values from
 * Supabase Dashboard → Project Settings → API.
 *
 * The anon key is designed to be public — it is safe to commit as long as
 * Row Level Security is enabled on every table (see supabase/schema.sql).
 * NEVER put the service_role key here; it bypasses RLS.
 */

export const SUPABASE_URL = 'https://lxdepwhjjuwdtawzzzrm.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_LYhsxdDi5GrI0VeuWzI0Lw_4pZqHwlI';

export const isConfigured =
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') && !SUPABASE_ANON_KEY.includes('YOUR-SUPABASE');
