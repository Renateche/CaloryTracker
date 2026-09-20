/**
 * Shared sign-in bar. The markup is injected by the shell, so pages only need
 * to exist — they do not carry auth markup of their own.
 */

import { isConfigured } from '../../config.js';
import { onAuthChange, signIn, signInWithGoogle, signOut } from '../api/client.js';
import { escapeHtml } from '../lib/dom.js';

export const AUTH_BAR_MARKUP = `
  <section class="card auth-bar">
    <p id="auth-status" class="auth-status">Checking sign-in status…</p>
    <div class="auth-actions">
      <button type="button" id="auth-signin-github" class="btn btn-primary" hidden>
        Sign in with GitHub
      </button>
      <button type="button" id="auth-signin-google" class="btn btn-ghost" hidden>
        Sign in with Google
      </button>
      <button type="button" id="auth-signout" class="btn btn-ghost" hidden>Sign out</button>
    </div>
  </section>`;

/**
 * @param {(user: object|null) => void} onUserChange called on every auth change
 */
export const initAuthBar = async (onUserChange = () => {}) => {
  const status = document.getElementById('auth-status');
  const signInButtons = [
    { element: document.getElementById('auth-signin-github'), signIn: () => signIn() },
    { element: document.getElementById('auth-signin-google'), signIn: signInWithGoogle }
  ];
  const signOutBtn = document.getElementById('auth-signout');
  if (!status) return;

  if (!isConfigured) {
    status.textContent =
      'Supabase is not configured — add your project URL and anon key to config.js.';
    signInButtons.forEach(({ element }) => {
      element.hidden = true;
    });
    signOutBtn.hidden = true;
    onUserChange(null);
    return;
  }

  signInButtons.forEach(({ element, signIn: startSignIn }) => {
    element.addEventListener('click', async () => {
      signInButtons.forEach(({ element: button }) => {
        button.disabled = true;
      });
      try {
        await startSignIn();
      } catch (error) {
        status.textContent = `Sign-in failed: ${error.message}`;
        signInButtons.forEach(({ element: button }) => {
          button.disabled = false;
        });
      }
    });
  });

  signOutBtn.addEventListener('click', () => signOut());

  await onAuthChange((user) => {
    const label = user?.user_metadata?.user_name ?? user?.email ?? 'your account';
    status.innerHTML = user
      ? `Signed in as <strong>${escapeHtml(label)}</strong>`
      : 'Sign in to save and sync your data across devices.';
    signInButtons.forEach(({ element }) => {
      element.hidden = Boolean(user);
      element.disabled = false;
    });
    signOutBtn.hidden = !user;
    onUserChange(user);
  });
};
