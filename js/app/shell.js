/**
 * Renders the header, navigation and auth bar so every page shares one shell.
 * Pages supply only their own content inside <main class="container">.
 */

import { NAV_ITEMS } from './trackers.js';
import { AUTH_BAR_MARKUP, initAuthBar } from './auth-bar.js';
import { escapeHtml } from '../lib/dom.js';
import { mountAvatar, setAvatarMood } from './avatar.js';

const GLOSSY_ICON_PATH = 'assets/icons/glossy/';
const PAGE_ICONS = {
  dashboard: ['camera'],
  calories: ['digital-pet'],
  habits: ['gamepad'],
  health: ['heart-status'],
  mood: ['music-player', 'messenger']
};
const NAV_ICONS = {
  dashboard: 'camera',
  calories: 'digital-pet',
  habits: 'gamepad',
  health: 'heart-status',
  exercise: 'exercise',
  sleep: 'sleep',
  water: 'water',
  mood: 'music-player'
};

const navMarkup = (active) =>
  NAV_ITEMS.map(
    (item) =>
      `<a href="${item.href}" class="nav-link${item.key === active ? ' is-active' : ''}" data-tracker="${escapeHtml(item.key)}"><span class="nav-icon" aria-hidden="true"><img src="${GLOSSY_ICON_PATH}${NAV_ICONS[item.key]}.svg" alt="" /></span><span class="nav-label">${escapeHtml(item.label)}</span></a>`
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
  document.title = title === suffix ? title : `${title} · ${suffix}`;

  const header = document.querySelector('.app-header');
  if (header) {
    const icons = (PAGE_ICONS[active] ?? [])
      .map(
        (icon) =>
          `<img class="page-icon" src="${GLOSSY_ICON_PATH}${icon}.svg" alt="" aria-hidden="true" />`
      )
      .join('');
    header.innerHTML = `
      <div class="page-title"><h1>${escapeHtml(title)}</h1>${icons ? `<div class="page-icons">${icons}</div>` : ''}</div>
      ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
      <nav class="app-nav" aria-label="Trackers">${navMarkup(active)}</nav>
      ${AUTH_BAR_MARKUP}`;
  }

  const container = document.querySelector('.container');
  if (header && container) {
    const parkBanner = container.querySelector('.park-diary-banner');
    if (parkBanner) header.prepend(parkBanner);
    // Pages declare their decorative motif in <main> and it's relocated into the header.
    const scene = container.querySelector('.page-scene');
    if (scene) header.prepend(scene);
  }

  mountAvatar(active);
  await initAuthBar((user) => {
    onUser(user);
    setAvatarMood(user, active);
  });
};
