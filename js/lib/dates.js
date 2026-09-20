/**
 * Date helpers. Everything is expressed in the browser's local timezone so a
 * "day" matches what the user actually experienced.
 */

/** YYYY-MM-DD for an <input type="date">, in local time. */
export const toDateInputValue = (date) => {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
};

/** Local calendar day key (YYYY-MM-DD) for a stored timestamp or date string. */
export const dayKey = (value) => {
  if (typeof value === 'string' && value.length === 10) return value;
  return toDateInputValue(new Date(value));
};

export const startOfDayIso = (dateValue) => new Date(`${dateValue}T00:00:00`).toISOString();

export const endOfDayIso = (dateValue) => new Date(`${dateValue}T23:59:59.999`).toISOString();

export const today = () => toDateInputValue(new Date());

/** Inclusive range covering the last n days, ending today. */
export const lastNDays = (days) => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  return { from: toDateInputValue(start), to: toDateInputValue(end) };
};

export const formatTime = (value) =>
  new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** "Mon 20 Sep" style label for day headings. */
export const formatDayLabel = (dayValue) =>
  new Date(`${dayValue}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
