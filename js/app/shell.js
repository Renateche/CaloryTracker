/**
 * Renders the header, navigation and auth bar so every page shares one shell.
 * Pages supply only their own content inside <main class="container">.
 */

import { NAV_ITEMS } from './trackers.js';
import { AUTH_BAR_MARKUP, initAuthBar } from './auth-bar.js';
import { escapeHtml } from '../lib/dom.js';

const navMarkup = (active, retroIcons = false) =>
  NAV_ITEMS.map(
    (item) =>
      `<a href="${item.href}" class="nav-link${item.key === active ? ' is-active' : ''}" data-tracker="${escapeHtml(item.key)}">${retroIcons ? '<span class="nav-icon" aria-hidden="true"></span><span class="nav-label">' : ''}${escapeHtml(item.label)}${retroIcons ? '</span>' : ''}</a>`
  ).join('');

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.subtitle]
 * @param {string} options.active      nav key to highlight
 * @param {(user: object|null) => void} [options.onUser]
 */
export const initShell = async ({ title, subtitle = '', active, onUser = () => {} }) => {
  const suffix = 'Lifestyle Tracker';
  const isRetroHistory = document.body.classList.contains('calorie-history-page');
  document.title = title === suffix ? title : `${title} · ${suffix}`;

  const header = document.querySelector('.app-header');
  if (header) {
    header.innerHTML = `
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
      <nav class="app-nav" aria-label="Trackers">${navMarkup(active, isRetroHistory)}</nav>
      ${isRetroHistory ? AUTH_BAR_MARKUP : ''}`;
  }

  const container = document.querySelector('.container');
  if (isRetroHistory && header && container) {
    const parkBanner = container.querySelector('.park-diary-banner');
    if (parkBanner) header.prepend(parkBanner);
  }

  if (container && !isRetroHistory) {
    container.insertAdjacentHTML('afterbegin', AUTH_BAR_MARKUP);
  }

  await initAuthBar(onUser);
};
