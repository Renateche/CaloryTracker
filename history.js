/**
 * Meal history page: filters, daily grouping, summary and a calories chart.
 */

import { escapeHtml, format, normaliseIngredient } from './nutrition.js';
import { initAuthBar } from './auth-bar.js';
import { deleteMeal, fetchMeals } from './meals-api.js';

const DRAFT_KEY = 'meal-calculator:ingredients';

let meals = [];
let currentUser = null;

const filterForm = document.getElementById('filter-form');
const fromInput = document.getElementById('from-date');
const toInput = document.getElementById('to-date');
const resetFilterBtn = document.getElementById('reset-filter');
const statusEl = document.getElementById('history-status');
const daysEl = document.getElementById('history-days');
const canvas = document.getElementById('chart');

const summary = {
  meals: document.getElementById('sum-meals'),
  calories: document.getElementById('sum-calories'),
  avg: document.getElementById('sum-avg'),
  protein: document.getElementById('sum-protein'),
  carbs: document.getElementById('sum-carbs'),
  fat: document.getElementById('sum-fat')
};

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const toDateInputValue = (date) => date.toISOString().slice(0, 10);

/** Local calendar day key (YYYY-MM-DD) for a stored timestamp. */
const dayKey = (isoString) => {
  const date = new Date(isoString);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
};

const setDefaultRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  fromInput.value = toDateInputValue(thirtyDaysAgo);
  toInput.value = toDateInputValue(today);
};

const currentRange = () => ({
  from: fromInput.value ? new Date(`${fromInput.value}T00:00:00`).toISOString() : undefined,
  to: toInput.value ? new Date(`${toInput.value}T23:59:59.999`).toISOString() : undefined
});

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

const num = (value) => Number(value) || 0;

const groupByDay = (list) => {
  const map = new Map();

  for (const meal of list) {
    const key = dayKey(meal.eaten_at);
    const day = map.get(key) ?? {
      key,
      meals: [],
      weight: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    day.meals.push(meal);
    day.weight += num(meal.total_weight);
    day.calories += num(meal.total_calories);
    day.protein += num(meal.total_protein);
    day.carbs += num(meal.total_carbs);
    day.fat += num(meal.total_fat);
    map.set(key, day);
  }

  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
};

const renderSummary = (days) => {
  const totals = days.reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  summary.meals.textContent = meals.length.toString();
  summary.calories.textContent = format(totals.calories);
  summary.avg.textContent = days.length ? format(totals.calories / days.length) : '0';
  summary.protein.textContent = format(totals.protein);
  summary.carbs.textContent = format(totals.carbs);
  summary.fat.textContent = format(totals.fat);
};

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

const drawChart = (days) => {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const padding = { top: 20, right: 16, bottom: 28, left: 52 };

  ctx.clearRect(0, 0, width, height);
  if (days.length === 0) return;

  const points = [...days].reverse();
  const max = Math.max(...points.map((day) => day.calories), 1);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const x = (index) => padding.left + (points.length > 1 ? index * stepX : plotWidth / 2);
  const y = (value) => padding.top + plotHeight - (value / max) * plotHeight;

  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue('--primary').trim() || '#2f6df6';
  const border = styles.getPropertyValue('--border').trim() || '#e2e7f0';
  const muted = styles.getPropertyValue('--muted').trim() || '#64708a';

  // Horizontal gridlines with value labels.
  ctx.strokeStyle = border;
  ctx.fillStyle = muted;
  ctx.font = '12px system-ui, sans-serif';
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
  points.forEach((day, index) => {
    const px = x(index);
    const py = y(day.calories);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.fillStyle = primary;
  points.forEach((day, index) => {
    ctx.beginPath();
    ctx.arc(x(index), y(day.calories), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Only label the ends to keep the axis readable on narrow screens.
  ctx.fillStyle = muted;
  ctx.textAlign = 'left';
  ctx.fillText(points[0].key.slice(5), padding.left, height - 8);
  if (points.length > 1) {
    ctx.textAlign = 'right';
    ctx.fillText(points.at(-1).key.slice(5), width - padding.right, height - 8);
  }
};

/* ------------------------------------------------------------------ */
/* Table rendering                                                     */
/* ------------------------------------------------------------------ */

const mealRow = (meal) => {
  const time = new Date(meal.eaten_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <tr data-id="${escapeHtml(meal.id)}">
      <td>${time}</td>
      <td class="ingredient-name">${escapeHtml(meal.name)}</td>
      <td class="num">${format(num(meal.total_weight))}</td>
      <td class="num">${format(num(meal.total_calories))}</td>
      <td class="num">${format(num(meal.total_protein))}</td>
      <td class="num">${format(num(meal.total_carbs))}</td>
      <td class="num">${format(num(meal.total_fat))}</td>
      <td class="num row-actions">
        <button type="button" class="btn btn-icon btn-icon-neutral" data-action="load">Load</button>
        <button type="button" class="btn btn-icon" data-action="delete">Delete</button>
      </td>
    </tr>`;
};

const dayBlock = (day) => `
  <article class="day-block">
    <div class="day-head">
      <h3>${day.key}</h3>
      <span class="day-total">${format(day.calories)} kcal · ${format(day.weight)} g</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Meal</th>
            <th scope="col" class="num">Weight (g)</th>
            <th scope="col" class="num">Calories</th>
            <th scope="col" class="num">Protein (g)</th>
            <th scope="col" class="num">Carbs (g)</th>
            <th scope="col" class="num">Fat (g)</th>
            <th scope="col"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>${day.meals.map(mealRow).join('')}</tbody>
      </table>
    </div>
  </article>`;

const render = () => {
  const days = groupByDay(meals);
  daysEl.innerHTML = days.map(dayBlock).join('');
  renderSummary(days);
  drawChart(days);

  statusEl.hidden = meals.length > 0;
  if (meals.length === 0 && currentUser) {
    statusEl.textContent = 'No meals saved in this date range.';
    statusEl.hidden = false;
  }
};

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

const load = async () => {
  if (!currentUser) {
    meals = [];
    statusEl.textContent = 'Sign in to load your history.';
    statusEl.hidden = false;
    render();
    return;
  }

  statusEl.textContent = 'Loading…';
  statusEl.hidden = false;

  try {
    meals = await fetchMeals(currentRange());
    render();
  } catch (error) {
    meals = [];
    render();
    statusEl.textContent = `Could not load history: ${error.message}`;
    statusEl.hidden = false;
  }
};

/** Copy a saved meal back into the builder draft and open it. */
const loadIntoBuilder = (meal) => {
  const list = Array.isArray(meal.ingredients) ? meal.ingredients.map(normaliseIngredient) : [];
  localStorage.setItem(DRAFT_KEY, JSON.stringify(list));
  window.location.href = 'index.html';
};

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  load();
});

resetFilterBtn.addEventListener('click', () => {
  setDefaultRange();
  load();
});

daysEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { id } = button.closest('tr').dataset;
  const meal = meals.find((item) => item.id === id);
  if (!meal) return;

  if (button.dataset.action === 'load') {
    loadIntoBuilder(meal);
    return;
  }

  if (!window.confirm(`Delete "${meal.name}"?`)) return;

  button.disabled = true;
  try {
    await deleteMeal(id);
    meals = meals.filter((item) => item.id !== id);
    render();
  } catch (error) {
    button.disabled = false;
    statusEl.textContent = `Could not delete: ${error.message}`;
    statusEl.hidden = false;
  }
});

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

setDefaultRange();

initAuthBar((user) => {
  currentUser = user;
  load();
});
