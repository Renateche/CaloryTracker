/**
 * Generic CRUD for any per-user tracker table.
 *
 * Reads carry no client-side user_id filter on purpose — Row Level Security
 * scopes rows to the signed-in user, and duplicating that here would be
 * cosmetic rather than protective.
 */

import { getClient, getUser } from './client.js';
import { endOfDayIso, startOfDayIso } from '../lib/dates.js';

const requireClient = async () => {
  const supabase = await getClient();
  if (!supabase) throw new Error('Supabase is not configured — see config.js.');
  return supabase;
};

/**
 * @param {object} options
 * @param {string} options.table        Postgres table name
 * @param {string} options.dateColumn   Column the history/dashboard filters on
 * @param {'timestamptz'|'date'} [options.dateType]
 */
export const createTrackerApi = ({ table, dateColumn, dateType = 'timestamptz' }) => {
  const lowerBound = (value) => (dateType === 'date' ? value : startOfDayIso(value));
  const upperBound = (value) => (dateType === 'date' ? value : endOfDayIso(value));

  return {
    table,
    dateColumn,

    async save(row) {
      const supabase = await requireClient();
      const user = await getUser();
      if (!user) throw new Error('Sign in to save your data.');

      const { data, error } = await supabase
        .from(table)
        .insert({ ...row, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    /** @param {{from?: string, to?: string, limit?: number}} range YYYY-MM-DD bounds */
    async fetchRange({ from, to, limit = 500 } = {}) {
      const supabase = await requireClient();

      let query = supabase
        .from(table)
        .select('*')
        .order(dateColumn, { ascending: false })
        .limit(limit);

      if (from) query = query.gte(dateColumn, lowerBound(from));
      if (to) query = query.lte(dateColumn, upperBound(to));

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    async remove(id) {
      const supabase = await requireClient();
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    }
  };
};
