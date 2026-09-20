/**
 * Shared sign-in bar used by both pages.
 * Expects #auth-status, #auth-signin and #auth-signout in the document.
 */

import { isConfigured } from './config.js';
import { onAuthChange, signIn, signOut } from './supabase-client.js';
import { escapeHtml } from './nutrition.js';

/**
 * @param {(user: object|null) => void} onUserChange called on every auth change
 */
export const initAuthBar = async (onUserChange = () => {}) => {
  const status = document.getElementById('auth-status');
  const signInBtn = document.getElementById('auth-signin');
  const signOutBtn = document.getElementById('auth-signout');

  if (!isConfigured) {
    status.innerHTML =
      'Supabase is not configured — add your project URL and anon key to config.js.';
    signInBtn.hidden = true;
    signOutBtn.hidden = true;
    onUserChange(null);
    return;
  }

  signInBtn.addEventListener('click', async () => {
    signInBtn.disabled = true;
    try {
      await signIn();
    } catch (error) {
      status.textContent = `Sign-in failed: ${error.message}`;
      signInBtn.disabled = false;
    }
  });

  signOutBtn.addEventListener('click', () => signOut());

  await onAuthChange((user) => {
    const label = user?.user_metadata?.user_name ?? user?.email ?? 'your account';
    status.innerHTML = user
      ? `Signed in as <strong>${escapeHtml(label)}</strong>`
      : 'Sign in to save and view your meal history.';
    signInBtn.hidden = Boolean(user);
    signInBtn.disabled = false;
    signOutBtn.hidden = !user;
    onUserChange(user);
  });
};
