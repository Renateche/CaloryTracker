/**
 * Calorie & Meal Calculator — meal builder page.
 *
 * The meal being built lives in localStorage so a refresh never loses work.
 * Finished meals are pushed to Supabase from the "Save to history" form.
 */

import {
  calculateIngredient,
  calculatePer100g,
  calculateTotals,
  createId,
  escapeHtml,
  format,
  normaliseIngredient,
  toNumber
} from './nutrition.js';
import { initAuthBar } from './auth-bar.js';
import { saveMeal as saveMealToHistory } from './meals-api.js';

const STORAGE_KEY = 'meal-calculator:ingredients';

/** @type {Array<{id: string, name: string, calories: number, protein: number, carbs: number, fat: number, amount: number}>} */
let ingredients = [];
let currentUser = null;

/* ------------------------------------------------------------------ */
/* DOM references                                                      */
/* ------------------------------------------------------------------ */

const form = document.getElementById('ingredient-form');
const formError = document.getElementById('form-error');
const mealBody = document.getElementById('meal-body');
const tableWrap = document.getElementById('table-wrap');
const emptyState = document.getElementById('empty-state');
const clearMealBtn = document.getElementById('clear-meal');
const saveForm = document.getElementById('save-form');
const saveBtn = document.getElementById('save-meal');
const saveStatus = document.getElementById('save-status');
const mealNameInput = document.getElementById('meal-name');
const eatenAtInput = document.getElementById('eaten-at');

const output = {
  totalWeight: document.getElementById('total-weight'),
  totalCalories: document.getElementById('total-calories'),
  totalProtein: document.getElementById('total-protein'),
  totalCarbs: document.getElementById('total-carbs'),
  totalFat: document.getElementById('total-fat'),
  per100Calories: document.getElementById('per100-calories'),
  per100Protein: document.getElementById('per100-protein'),
  per100Carbs: document.getElementById('per100-carbs'),
  per100Fat: document.getElementById('per100-fat')
};

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

const saveMeal = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
  } catch {
    // Storage can be unavailable (private mode / quota) — the app still works.
  }
};

const loadMeal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => item && typeof item.name === 'string').map(normaliseIngredient);
  } catch {
    return [];
  }
};

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

const renderTable = () => {
  const hasItems = ingredients.length > 0;
  tableWrap.hidden = !hasItems;
  emptyState.hidden = hasItems;

  mealBody.innerHTML = ingredients
    .map((ingredient) => {
      const actual = calculateIngredient(ingredient);
      return `
        <tr data-id="${ingredient.id}">
          <td class="ingredient-name">${escapeHtml(ingredient.name)}</td>
          <td class="num">
            <input type="number" class="amount-input" min="0" step="any"
                   value="${ingredient.amount}"
                   aria-label="Amount in grams for ${escapeHtml(ingredient.name)}" />
          </td>
          <td class="num">${format(actual.calories)}</td>
          <td class="num">${format(actual.protein)}</td>
          <td class="num">${format(actual.carbs)}</td>
          <td class="num">${format(actual.fat)}</td>
          <td class="num">
            <button type="button" class="btn btn-icon" data-action="remove"
                    aria-label="Remove ${escapeHtml(ingredient.name)}">Remove</button>
          </td>
        </tr>`;
    })
    .join('');
};

const renderTotals = () => {
  const totals = calculateTotals(ingredients);
  const per100 = calculatePer100g(totals);

  output.totalWeight.textContent = format(totals.weight);
  output.totalCalories.textContent = format(totals.calories);
  output.totalProtein.textContent = format(totals.protein);
  output.totalCarbs.textContent = format(totals.carbs);
  output.totalFat.textContent = format(totals.fat);

  output.per100Calories.textContent = format(per100.calories);
  output.per100Protein.textContent = format(per100.protein);
  output.per100Carbs.textContent = format(per100.carbs);
  output.per100Fat.textContent = format(per100.fat);
};

/** Re-render everything and persist the current meal. */
const render = () => {
  renderTable();
  renderTotals();
  updateSaveState();
  saveMeal();
};

const showError = (message) => {
  formError.textContent = message;
  formError.hidden = false;
};

const hideError = () => {
  formError.hidden = true;
};

const showSaveStatus = (message, isError = false) => {
  saveStatus.textContent = message;
  saveStatus.classList.toggle('is-error', isError);
  saveStatus.hidden = false;
};

/** The save button needs both a signed-in user and something to save. */
const updateSaveState = () => {
  saveBtn.disabled = !currentUser || ingredients.length === 0;
};

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

const addIngredient = (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const amount = toNumber(data.get('amount'));
  const caloriesRaw = String(data.get('calories') || '').trim();

  if (!name) {
    showError('Please enter an ingredient name.');
    return;
  }
  if (caloriesRaw === '') {
    showError('Please enter the calories per 100 g.');
    return;
  }
  if (amount <= 0) {
    showError('Please enter an amount greater than 0 g.');
    return;
  }

  hideError();

  ingredients.push({
    id: createId(),
    name,
    calories: toNumber(caloriesRaw),
    protein: toNumber(data.get('protein')),
    carbs: toNumber(data.get('carbs')),
    fat: toNumber(data.get('fat')),
    amount
  });

  render();
  form.reset();
  document.getElementById('name').focus();
};

const removeIngredient = (id) => {
  ingredients = ingredients.filter((ingredient) => ingredient.id !== id);
  render();
};

/**
 * Update one amount without re-rendering the whole table, so the input the
 * user is typing in keeps its focus and caret.
 */
const updateAmount = (id, value, row) => {
  const ingredient = ingredients.find((item) => item.id === id);
  if (!ingredient) return;

  ingredient.amount = toNumber(value);

  const actual = calculateIngredient(ingredient);
  const cells = row.querySelectorAll('td');
  cells[2].textContent = format(actual.calories);
  cells[3].textContent = format(actual.protein);
  cells[4].textContent = format(actual.carbs);
  cells[5].textContent = format(actual.fat);

  renderTotals();
  saveMeal();
};

const clearMeal = () => {
  if (ingredients.length === 0) return;
  if (!window.confirm('Remove all ingredients from this meal?')) return;
  ingredients = [];
  render();
};

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

form.addEventListener('submit', addIngredient);
form.addEventListener('reset', hideError);
clearMealBtn.addEventListener('click', clearMeal);

// Delegated: remove buttons inside the table.
mealBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="remove"]');
  if (!button) return;
  removeIngredient(button.closest('tr').dataset.id);
});

// Delegated: live editing of ingredient amounts.
mealBody.addEventListener('input', (event) => {
  const input = event.target.closest('.amount-input');
  if (!input) return;

  const row = input.closest('tr');
  updateAmount(row.dataset.id, input.value, row);
});

saveForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (saveBtn.disabled) return;

  saveBtn.disabled = true;
  showSaveStatus('Saving…');

  try {
    await saveMealToHistory({
      name: mealNameInput.value.trim() || 'Meal',
      eatenAt: eatenAtInput.value ? new Date(eatenAtInput.value).toISOString() : undefined,
      ingredients,
      totals: calculateTotals(ingredients)
    });
    showSaveStatus('Saved. Open History to see it.');
    mealNameInput.value = '';
  } catch (error) {
    showSaveStatus(`Could not save: ${error.message}`, true);
  } finally {
    updateSaveState();
  }
});

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

ingredients = loadMeal();
renderTable();
renderTotals();
updateSaveState();

initAuthBar((user) => {
  currentUser = user;
  updateSaveState();
});
