/** Meal persistence, built on the generic tracker API. */

import { createTrackerApi } from '../../api/tracker-api.js';
import { getTracker } from '../../app/trackers.js';

const { table, dateColumn, dateType } = getTracker('calories');

export const mealsApi = createTrackerApi({ table, dateColumn, dateType });

export const saveMeal = ({ name, eatenAt, ingredients, totals }) =>
  mealsApi.save({
    name: name || 'Meal',
    eaten_at: eatenAt ?? new Date().toISOString(),
    ingredients,
    total_weight: totals.weight,
    total_calories: totals.calories,
    total_protein: totals.protein,
    total_carbs: totals.carbs,
    total_fat: totals.fat
  });

export const fetchMeals = (range) => mealsApi.fetchRange(range);

export const deleteMeal = (id) => mealsApi.remove(id);
