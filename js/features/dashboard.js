/**
 * Dashboard — today's numbers across every tracker.
 *
 * Fires one query per tracker in parallel. That is fine at this scale; a
 * `dashboard_summary(day)` Postgres function is the optimisation if it grows.
 */

import { initShell } from '../app/shell.js';
import { TRACKERS } from '../app/trackers.js';
import { createTrackerApi } from '../api/tracker-api.js';
import { escapeHtml, setStatus } from '../lib/dom.js';
import { format } from '../lib/format.js';
import { today } from '../lib/dates.js';

let currentUser = null;

const tilesEl = document.getElementById('tiles');
const statusEl = document.getElementById('dashboard-status');
const introEl = document.getElementById('signed-out-intro');
const dateEl = document.getElementById('dashboard-date');

const tileMarkup = (tracker, { value, detail, error } = {}) => {
  const body = error
    ? `<p class="tile-error">${escapeHtml(error)}</p>`
    : `<p class="tile-value">${value === undefined ? '–' : format(value)}<span class="tile-unit">${escapeHtml(tracker.unit)}</span></p>
       <p class="tile-detail">${escapeHtml(detail ?? '')}</p>`;

  return `
    <a class="tile accent-${tracker.accent}" href="${tracker.href}">
      <span class="tile-head">
        <span class="tile-label">${escapeHtml(tracker.label)}</span>
        ${tracker.ready ? '' : '<span class="badge">Soon</span>'}
      </span>
      ${body}
    </a>`;
};

const renderSkeleton = () => {
  tilesEl.innerHTML = TRACKERS.map((tracker) => tileMarkup(tracker, { detail: 'Loading…' })).join(
    ''
  );
};

const renderSignedOut = () => {
  tilesEl.innerHTML = TRACKERS.map((tracker) =>
    tileMarkup(tracker, { detail: tracker.ready ? 'Sign in to see today' : 'Coming soon' })
  ).join('');
};

const loadTracker = async (tracker) => {
  const api = createTrackerApi(tracker);
  const day = today();

  try {
    const rows = await api.fetchRange({ from: day, to: day, limit: 200 });
    return tileMarkup(tracker, tracker.summarise(rows));
  } catch (error) {
    // A missing table just means that tracker's migration has not been run yet.
    const missingTable = /relation .* does not exist|schema cache/i.test(error.message ?? '');
    return tileMarkup(tracker, {
      error: missingTable ? 'Not set up yet' : error.message
    });
  }
};

const load = async () => {
  introEl.hidden = Boolean(currentUser);

  if (!currentUser) {
    renderSignedOut();
    setStatus(statusEl, 'Sign in to see your day at a glance.');
    return;
  }

  statusEl.hidden = true;
  renderSkeleton();

  const tiles = await Promise.all(TRACKERS.map(loadTracker));
  tilesEl.innerHTML = tiles.join('');
};

dateEl.textContent = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

initShell({
  title: 'Lifestyle Tracker',
  subtitle: 'Your habits, meals and health in one place.',
  active: 'dashboard',
  onUser: (user) => {
    currentUser = user;
    load();
  }
});
