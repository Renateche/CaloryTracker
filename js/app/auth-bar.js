/**
 * Shared sign-in bar. The markup is injected by the shell, so pages only need
 * to exist — they do not carry auth markup of their own.
 */

import { isConfigured } from '../../config.js';
import { onAuthChange, signIn, signOut } from '../api/client.js';
import { escapeHtml } from '../lib/dom.js';

export const AUTH_BAR_MARKUP = `
  <section class="card auth-bar">
    <p id="auth-status" class="auth-status">Checking sign-in status…</p>
    <div class="auth-actions">
      <button type="button" id="auth-signin" class="btn btn-primary" hidden>
        Sign in with GitHub
      </button>
      <button type="button" id="auth-signout" class="btn btn-ghost" hidden>Sign out</button>
    </div>
  </section>`;

/**
 * @param {(user: object|null) => void} onUserChange called on every auth change
 */
export const initAuthBar = async (onUserChange = () => {}) => {
  const status = document.getElementById('auth-status');
  const signInBtn = document.getElementById('auth-signin');
  const signOutBtn = document.getElementById('auth-signout');
  if (!status) return;

  if (!isConfigured) {
    status.textContent =
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
      : 'Sign in to save and sync your data across devices.';
    signInBtn.hidden = Boolean(user);
    signInBtn.disabled = false;
    signOutBtn.hidden = !user;
    onUserChange(user);
  });
};
