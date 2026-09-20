/**
 * Meal history persistence.
 *
 * Every query relies on Row Level Security to scope rows to the signed-in
 * user, so no client-side user_id filter is applied on reads.
 */

import { getClient, getUser } from './supabase-client.js';

const requireClient = async () => {
  const supabase = await getClient();
  if (!supabase) throw new Error('Supabase is not configured — see config.js.');
  return supabase;
};

export const saveMeal = async ({ name, eatenAt, ingredients, totals }) => {
  const supabase = await requireClient();
  const user = await getUser();
  if (!user) throw new Error('Sign in to save meals.');

  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      name: name || 'Meal',
      eaten_at: eatenAt ?? new Date().toISOString(),
      ingredients,
      total_weight: totals.weight,
      total_calories: totals.calories,
      total_protein: totals.protein,
      total_carbs: totals.carbs,
      total_fat: totals.fat
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchMeals = async ({ from, to, limit = 500 } = {}) => {
  const supabase = await requireClient();

  let query = supabase
    .from('meals')
    .select('*')
    .order('eaten_at', { ascending: false })
    .limit(limit);

  if (from) query = query.gte('eaten_at', from);
  if (to) query = query.lte('eaten_at', to);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

export const deleteMeal = async (id) => {
  const supabase = await requireClient();
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw error;
};
