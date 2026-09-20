/**
 * Nutrition maths for the calorie tracker.
 * Ingredients store values *per 100 g*; actual values are always derived.
 */

import { createId, toNumber } from '../../lib/format.js';

/**
 * actual_value = value_per_100g × (amount_in_grams / 100)
 */
export const calculateIngredient = (ingredient) => {
  const factor = ingredient.amount / 100;
  return {
    calories: ingredient.calories * factor,
    protein: ingredient.protein * factor,
    carbs: ingredient.carbs * factor,
    fat: ingredient.fat * factor
  };
};

export const calculateTotals = (list) =>
  list.reduce(
    (totals, ingredient) => {
      const actual = calculateIngredient(ingredient);
      return {
        weight: totals.weight + ingredient.amount,
        calories: totals.calories + actual.calories,
        protein: totals.protein + actual.protein,
        carbs: totals.carbs + actual.carbs,
        fat: totals.fat + actual.fat
      };
    },
    { weight: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

/**
 * meal_value_per_100g = (total_value / total_weight) × 100
 */
export const calculatePer100g = (totals) => {
  if (totals.weight <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  const factor = 100 / totals.weight;
  return {
    calories: totals.calories * factor,
    protein: totals.protein * factor,
    carbs: totals.carbs * factor,
    fat: totals.fat * factor
  };
};

/** Normalise an ingredient coming from storage or the database. */
export const normaliseIngredient = (item) => ({
  id: typeof item?.id === 'string' ? item.id : createId('ing'),
  name: String(item?.name ?? ''),
  calories: toNumber(item?.calories),
  protein: toNumber(item?.protein),
  carbs: toNumber(item?.carbs),
  fat: toNumber(item?.fat),
  amount: toNumber(item?.amount)
});
