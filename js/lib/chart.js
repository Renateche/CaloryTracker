/** Minimal line chart on a canvas — no chart library needed. */

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Array<{label: string, value: number}>} points oldest first
 */
export const drawLineChart = (canvas, points) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const padding = { top: 20, right: 16, bottom: 28, left: 52 };

  ctx.clearRect(0, 0, width, height);
  if (points.length === 0) return;

  const max = Math.max(...points.map((point) => point.value), 1);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const x = (index) => padding.left + (points.length > 1 ? index * stepX : plotWidth / 2);
  const y = (value) => padding.top + plotHeight - (value / max) * plotHeight;

  const primary = cssVar('--primary', '#2f6df6');
  const border = cssVar('--border', '#e2e7f0');
  const muted = cssVar('--muted', '#64708a');
  const font = cssVar('--chart-font', 'system-ui, sans-serif');

  ctx.strokeStyle = border;
  ctx.fillStyle = muted;
  ctx.font = `12px ${font}`;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const value = (max / 4) * i;
    const lineY = Math.round(y(value)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, lineY);
    ctx.lineTo(width - padding.right, lineY);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(value).toString(), padding.left - 8, lineY + 4);
  }

  ctx.strokeStyle = primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const px = x(index);
    const py = y(point.value);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = primary;
  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(x(index), y(point.value), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Only label the ends so the axis stays readable on narrow screens.
  ctx.fillStyle = muted;
  ctx.textAlign = 'left';
  ctx.fillText(points[0].label, padding.left, height - 8);
  if (points.length > 1) {
    ctx.textAlign = 'right';
    ctx.fillText(points.at(-1).label, width - padding.right, height - 8);
  }
};
