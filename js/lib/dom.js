/** Small DOM helpers shared across pages. */

/** Escape text before inserting it into HTML. */
export const escapeHtml = (text) =>
  String(text ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
  );

export const setStatus = (element, message, { error = false } = {}) => {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('is-error', error);
  element.hidden = false;
};

export const clearStatus = (element) => {
  if (element) element.hidden = true;
};

/**
 * Delegate clicks on `[data-action]` buttons to handlers keyed by action name.
 * Each handler receives the id from the closest `[data-id]` ancestor.
 */
export const onAction = (container, handlers) => {
  container.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || !container.contains(button)) return;

    const handler = handlers[button.dataset.action];
    if (!handler) return;

    const owner = button.closest('[data-id]');
    handler({ id: owner?.dataset.id, button, event });
  });
};

/** Ask before a destructive action. */
export const confirmAction = (message) => window.confirm(message);
