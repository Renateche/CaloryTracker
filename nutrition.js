/**
 * Nutrition maths shared by the meal builder and the history page.
 * Values marked "per 100 g" are what the user types; actual values are derived.
 */

/** Parse user input into a non-negative number; accepts both "3.6" and "3,6". */
export const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

/** Round to at most one decimal and drop a trailing ".0". */
export const format = (value) => (Math.round(value * 10) / 10).toString();

export const createId = () =>
  `ing_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Escape text before inserting it into HTML. */
export const escapeHtml = (text) =>
  String(text).replace(
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

/**
 * Actual nutrition for one ingredient:
 * actual_value = value_per_100g × (amount / 100)
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

/** Sum the actual values of every ingredient plus the total weight. */
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
 * Nutrition per 100 g of the whole meal:
 * (total / total_weight) × 100
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
  id: typeof item?.id === 'string' ? item.id : createId(),
  name: String(item?.name ?? ''),
  calories: toNumber(item?.calories),
  protein: toNumber(item?.protein),
  carbs: toNumber(item?.carbs),
  fat: toNumber(item?.fat),
  amount: toNumber(item?.amount)
});
