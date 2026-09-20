/** Placeholder page controller for trackers that have tables but no UI yet. */

import { initShell } from '../app/shell.js';
import { getTracker } from '../app/trackers.js';

const key = document.body.dataset.tracker;
const tracker = getTracker(key);

document.getElementById('stub-table').textContent = tracker?.table ?? 'unknown';

initShell({
  title: tracker?.label ?? 'Tracker',
  subtitle: 'This tracker is planned — the database is ready, the screen is not.',
  active: key
});
