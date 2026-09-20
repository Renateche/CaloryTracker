/** Number parsing and display formatting shared by every tracker. */

/** Parse user input into a non-negative number; accepts both "3.6" and "3,6". */
export const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

/** Round to at most one decimal and drop a trailing ".0". */
export const format = (value) => (Math.round(value * 10) / 10).toString();

/** Round to whole numbers, for tile headlines where decimals are noise. */
export const formatWhole = (value) => Math.round(Number(value) || 0).toString();

export const createId = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
