/**
 * Supabase client + GitHub OAuth helpers.
 *
 * The client is created lazily so the app still loads when the CDN module or
 * the credentials are unavailable.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from '../../config.js';

let clientPromise = null;

export const getClient = async () => {
  if (!isConfigured) return null;

  clientPromise ??= import('https://esm.sh/@supabase/supabase-js@2')
    .then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }
      })
    )
    .catch(() => null);

  return clientPromise;
};

export const getUser = async () => {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
};

export const signIn = async () => {
  const supabase = await getClient();
  if (!supabase) throw new Error('Supabase is not configured.');

  // Strip query/hash so the OAuth callback lands on a clean URL.
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo }
  });
  if (error) throw error;
};

export const signOut = async () => {
  const supabase = await getClient();
  if (!supabase) return;
  await supabase.auth.signOut();
};

/** Subscribe to sign-in/sign-out; fires immediately with the current user. */
export const onAuthChange = async (callback) => {
  const supabase = await getClient();
  if (!supabase) {
    callback(null);
    return;
  }
  callback(await getUser());
  supabase.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
};
