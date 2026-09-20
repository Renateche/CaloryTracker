/**
 * Calorie tracker — meal builder page.
 *
 * The meal being built lives in localStorage so a refresh never loses work.
 * Finished meals are pushed to Supabase from the "Save to history" form.
 */

import {
  calculateIngredient,
  calculatePer100g,
  calculateTotals,
  normaliseIngredient
} from './nutrition.js';
import { saveMeal as saveMealToHistory } from './api.js';
import { initShell } from '../../app/shell.js';
import { confirmAction, escapeHtml, onAction, setStatus } from '../../lib/dom.js';
import { createId, format, toNumber } from '../../lib/format.js';
import { draftKey, migrateLegacyKey, readJson, writeJson } from '../../lib/storage.js';

const DRAFT_KEY = draftKey('calories');
migrateLegacyKey('meal-calculator:ingredients', DRAFT_KEY);

let ingredients = [];
let currentUser = null;

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

/** The save button needs both a signed-in user and something to save. */
const updateSaveState = () => {
  saveBtn.disabled = !currentUser || ingredients.length === 0;
};

const render = () => {
  renderTable();
  renderTotals();
  updateSaveState();
  writeJson(DRAFT_KEY, ingredients);
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
    setStatus(formError, 'Please enter an ingredient name.', { error: true });
    return;
  }
  if (caloriesRaw === '') {
    setStatus(formError, 'Please enter the calories per 100 g.', { error: true });
    return;
  }
  if (amount <= 0) {
    setStatus(formError, 'Please enter an amount greater than 0 g.', { error: true });
    return;
  }

  formError.hidden = true;

  ingredients.push({
    id: createId('ing'),
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
  writeJson(DRAFT_KEY, ingredients);
};

const clearMeal = () => {
  if (ingredients.length === 0) return;
  if (!confirmAction('Remove all ingredients from this meal?')) return;
  ingredients = [];
  render();
};

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

form.addEventListener('submit', addIngredient);
form.addEventListener('reset', () => {
  formError.hidden = true;
});
clearMealBtn.addEventListener('click', clearMeal);

onAction(mealBody, {
  remove: ({ id }) => {
    ingredients = ingredients.filter((ingredient) => ingredient.id !== id);
    render();
  }
});

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
  setStatus(saveStatus, 'Saving…');

  try {
    await saveMealToHistory({
      name: mealNameInput.value.trim() || 'Meal',
      eatenAt: eatenAtInput.value ? new Date(eatenAtInput.value).toISOString() : undefined,
      ingredients,
      totals: calculateTotals(ingredients)
    });
    setStatus(saveStatus, 'Saved. Open History to see it.');
    mealNameInput.value = '';
  } catch (error) {
    setStatus(saveStatus, `Could not save: ${error.message}`, { error: true });
  } finally {
    updateSaveState();
  }
});

/* ------------------------------------------------------------------ */
/* Init                                                                */
/* ------------------------------------------------------------------ */

ingredients = (readJson(DRAFT_KEY, []) ?? [])
  .filter((item) => item && typeof item.name === 'string')
  .map(normaliseIngredient);

renderTable();
renderTotals();
updateSaveState();

initShell({
  title: 'Calorie Tracker',
  subtitle: 'Build a meal from ingredients and get the nutrition breakdown.',
  active: 'calories',
  onUser: (user) => {
    currentUser = user;
    updateSaveState();
  }
});
