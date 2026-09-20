/**
 * Namespaced localStorage for per-tracker drafts.
 * Storage can be unavailable (private mode, quota) — every call degrades quietly.
 */

const PREFIX = 'lifestyle';

export const draftKey = (tracker) => `${PREFIX}:${tracker}:draft`;

export const readJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignored: the app stays usable without persistence.
  }
};

export const remove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored.
  }
};

/** One-time move of a pre-rename key onto its new namespaced home. */
export const migrateLegacyKey = (legacyKey, newKey) => {
  try {
    const legacy = localStorage.getItem(legacyKey);
    if (legacy === null) return;
    if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, legacy);
    localStorage.removeItem(legacyKey);
  } catch {
    // Ignored.
  }
};
