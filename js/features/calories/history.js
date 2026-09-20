/** Calorie tracker — history page: filters, daily grouping, summary and chart. */

import { normaliseIngredient } from './nutrition.js';
import { deleteMeal, fetchMeals } from './api.js';
import { initShell } from '../../app/shell.js';
import { confirmAction, escapeHtml, onAction, setStatus } from '../../lib/dom.js';
import { format, toNumber } from '../../lib/format.js';
import {
  dayKey,
  formatDayLabel,
  formatTime,
  lastNDays,
  toDateInputValue
} from '../../lib/dates.js';
import { drawLineChart } from '../../lib/chart.js';
import { draftKey, writeJson } from '../../lib/storage.js';

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
  calories: document.getElementById('sum-calories'),
  protein: document.getElementById('sum-protein'),
  carbs: document.getElementById('sum-carbs'),
  fat: document.getElementById('sum-fat')
};

const insights = {
  busiest: document.getElementById('rhythm-busiest'),
  first: document.getElementById('rhythm-first'),
  last: document.getElementById('rhythm-last'),
  average: document.getElementById('consistency-average'),
  high: document.getElementById('consistency-high'),
  low: document.getElementById('consistency-low'),
  protein: document.getElementById('macro-protein'),
  carbs: document.getElementById('macro-carbs'),
  fat: document.getElementById('macro-fat'),
  proteinBar: document.getElementById('macro-protein-bar'),
  carbsBar: document.getElementById('macro-carbs-bar'),
  fatBar: document.getElementById('macro-fat-bar'),
  proteinDensity: document.getElementById('protein-density'),
  favorites: document.getElementById('ingredient-favorites')
};

const setDefaultRange = () => {
  const { from, to } = lastNDays(30);
  fromInput.value = from;
  toInput.value = to;
};

const currentRange = () => ({
  from: fromInput.value || undefined,
  to: toInput.value || undefined
});

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

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
    day.weight += toNumber(meal.total_weight);
    day.calories += toNumber(meal.total_calories);
    day.protein += toNumber(meal.total_protein);
    day.carbs += toNumber(meal.total_carbs);
    day.fat += toNumber(meal.total_fat);
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

  summary.calories.textContent = format(totals.calories);
  summary.protein.textContent = format(totals.protein);
  summary.carbs.textContent = format(totals.carbs);
  summary.fat.textContent = format(totals.fat);

  return totals;
};

const macroPercentages = (totals) => {
  const macroCalories = {
    protein: totals.protein * 4,
    carbs: totals.carbs * 4,
    fat: totals.fat * 9
  };
  const total = macroCalories.protein + macroCalories.carbs + macroCalories.fat;

  return Object.fromEntries(
    Object.entries(macroCalories).map(([key, value]) => [key, total ? (value / total) * 100 : 0])
  );
};

const renderInsights = (days, totals) => {
  const chronologicalMeals = [...meals].sort(
    (left, right) => new Date(left.eaten_at) - new Date(right.eaten_at)
  );
  const hourCounts = new Map();
  const ingredientCounts = new Map();

  for (const meal of chronologicalMeals) {
    const hour = new Date(meal.eaten_at).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);

    const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    for (const ingredient of ingredients) {
      const name = normaliseIngredient(ingredient).name.trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase();
      const item = ingredientCounts.get(key) ?? { name, count: 0 };
      item.count += 1;
      ingredientCounts.set(key, item);
    }
  }

  const busiestHour = [...hourCounts.entries()].sort(
    ([leftHour, leftCount], [rightHour, rightCount]) =>
      rightCount - leftCount || leftHour - rightHour
  )[0];
  insights.busiest.textContent = busiestHour
    ? `${String(busiestHour[0]).padStart(2, '0')}:00 (${busiestHour[1]})`
    : 'No meals yet';
  insights.first.textContent = chronologicalMeals.length
    ? formatTime(chronologicalMeals[0].eaten_at)
    : '--:--';
  insights.last.textContent = chronologicalMeals.length
    ? formatTime(chronologicalMeals.at(-1).eaten_at)
    : '--:--';

  const dailyCalories = days.map((day) => day.calories);
  const averageCalories = dailyCalories.length
    ? dailyCalories.reduce((total, value) => total + value, 0) / dailyCalories.length
    : 0;
  insights.average.textContent = `${format(averageCalories)} kcal`;
  insights.high.textContent = `${format(Math.max(0, ...dailyCalories))} kcal`;
  insights.low.textContent = `${format(dailyCalories.length ? Math.min(...dailyCalories) : 0)} kcal`;

  const macros = macroPercentages(totals);
  for (const [key, value] of Object.entries(macros)) {
    insights[key].textContent = `${format(value)}%`;
    insights[`${key}Bar`].style.width = `${value}%`;
  }
  insights.proteinDensity.textContent = `${format(totals.calories ? (totals.protein / totals.calories) * 100 : 0)} g`;

  const favorites = [...ingredientCounts.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 5);
  insights.favorites.innerHTML = favorites.length
    ? favorites
        .map((item) => `<li><span>${escapeHtml(item.name)}</span><b>${item.count}</b></li>`)
        .join('')
    : '<li>No ingredients in this range.</li>';
};

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

const mealRow = (meal) => `
  <tr data-id="${escapeHtml(meal.id)}">
    <td>${formatTime(meal.eaten_at)}</td>
    <td class="ingredient-name">${escapeHtml(meal.name)}</td>
    <td class="num">${format(toNumber(meal.total_weight))}</td>
    <td class="num">${format(toNumber(meal.total_calories))}</td>
    <td class="num">${format(toNumber(meal.total_protein))}</td>
    <td class="num">${format(toNumber(meal.total_carbs))}</td>
    <td class="num">${format(toNumber(meal.total_fat))}</td>
    <td class="num row-actions">
      <button type="button" class="btn btn-icon btn-icon-neutral" data-action="load">Load</button>
      <button type="button" class="btn btn-icon" data-action="delete">Delete</button>
    </td>
  </tr>`;

const dayBlock = (day) => `
  <article class="day-block">
    <div class="day-head">
      <h3>${formatDayLabel(day.key)}</h3>
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
  const totals = renderSummary(days);
  renderInsights(days, totals);

  drawLineChart(
    canvas,
    [...days].reverse().map((day) => ({ label: day.key.slice(5), value: day.calories }))
  );

  statusEl.hidden = meals.length > 0;
  if (meals.length === 0 && currentUser) {
    setStatus(statusEl, 'No meals saved in this date range.');
  }
};

/* ------------------------------------------------------------------ */
/* Data loading                                                        */
/* ------------------------------------------------------------------ */

const load = async () => {
  if (!currentUser) {
    meals = [];
    render();
    setStatus(statusEl, 'Sign in to load your history.');
    return;
  }

  setStatus(statusEl, 'Loading…');

  try {
    meals = await fetchMeals(currentRange());
    render();
  } catch (error) {
    meals = [];
    render();
    setStatus(statusEl, `Could not load history: ${error.message}`, { error: true });
  }
};

/** Copy a saved meal back into the builder draft and open it. */
const loadIntoBuilder = (meal) => {
  const list = Array.isArray(meal.ingredients) ? meal.ingredients.map(normaliseIngredient) : [];
  writeJson(draftKey('calories'), list);
  window.location.href = 'calories.html';
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

onAction(daysEl, {
  load: ({ id }) => {
    const meal = meals.find((item) => item.id === id);
    if (meal) loadIntoBuilder(meal);
  },
  delete: async ({ id, button }) => {
    const meal = meals.find((item) => item.id === id);
    if (!meal || !confirmAction(`Delete "${meal.name}"?`)) return;

    button.disabled = true;
    try {
      await deleteMeal(id);
      meals = meals.filter((item) => item.id !== id);
      render();
    } catch (error) {
      button.disabled = false;
      setStatus(statusEl, `Could not delete: ${error.message}`, { error: true });
    }
  }
});

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

setDefaultRange();
toInput.max = toDateInputValue(new Date());

initShell({
  title: 'Calorie History',
  subtitle: 'Every meal you have saved, grouped by day.',
  active: 'calories',
  onUser: (user) => {
    currentUser = user;
    load();
  }
});
