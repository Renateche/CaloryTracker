/**
 * Single source of truth for every tracker: navigation, dashboard tiles and
 * table wiring all read from here, so adding a tracker is one entry.
 *
 * `ready` marks whether a real UI exists yet; unfinished trackers still have
 * tables and still render a tile.
 */

import { toNumber } from '../lib/format.js';

const sumBy = (rows, key) => rows.reduce((total, row) => total + toNumber(row[key]), 0);

export const TRACKERS = [
  {
    key: 'calories',
    label: 'Calories',
    href: 'calories.html',
    accent: 'calories',
    unit: 'kcal',
    table: 'meals',
    dateColumn: 'eaten_at',
    dateType: 'timestamptz',
    ready: true,
    summarise: (rows) => ({
      value: sumBy(rows, 'total_calories'),
      detail: `${rows.length} meal${rows.length === 1 ? '' : 's'}`
    })
  },
  {
    key: 'habits',
    label: 'Habits',
    href: 'habits.html',
    accent: 'habits',
    unit: 'done',
    table: 'habit_entries',
    dateColumn: 'entered_on',
    dateType: 'date',
    ready: false,
    summarise: (rows) => ({
      value: sumBy(rows, 'count'),
      detail: `${rows.length} habit${rows.length === 1 ? '' : 's'} logged`
    })
  },
  {
    key: 'health',
    label: 'Health',
    href: 'health.html',
    accent: 'health',
    unit: 'readings',
    table: 'health_metrics',
    dateColumn: 'measured_at',
    dateType: 'timestamptz',
    ready: false,
    summarise: (rows) => ({
      value: rows.length,
      detail: rows.length ? `latest: ${rows[0].metric_type}` : 'no readings'
    })
  },
  {
    key: 'exercise',
    label: 'Exercise',
    href: 'exercise.html',
    accent: 'exercise',
    unit: 'min',
    table: 'workouts',
    dateColumn: 'started_at',
    dateType: 'timestamptz',
    ready: false,
    summarise: (rows) => ({
      value: sumBy(rows, 'duration_minutes'),
      detail: `${rows.length} workout${rows.length === 1 ? '' : 's'}`
    })
  },
  {
    key: 'sleep',
    label: 'Sleep',
    href: 'sleep.html',
    accent: 'sleep',
    unit: 'h',
    table: 'sleep_entries',
    dateColumn: 'slept_at',
    dateType: 'timestamptz',
    ready: false,
    summarise: (rows) => {
      const hours = rows.reduce((total, row) => {
        if (!row.wake_at) return total;
        return total + (new Date(row.wake_at) - new Date(row.slept_at)) / 3_600_000;
      }, 0);
      return { value: hours, detail: rows.length ? 'logged' : 'not logged' };
    }
  },
  {
    key: 'water',
    label: 'Water',
    href: 'water.html',
    accent: 'water',
    unit: 'ml',
    table: 'water_entries',
    dateColumn: 'drunk_at',
    dateType: 'timestamptz',
    ready: false,
    summarise: (rows) => ({
      value: sumBy(rows, 'amount_ml'),
      detail: `${rows.length} drink${rows.length === 1 ? '' : 's'}`
    })
  },
  {
    key: 'mood',
    label: 'Mood',
    href: 'mood.html',
    accent: 'mood',
    unit: '/ 5',
    table: 'mood_entries',
    dateColumn: 'entered_on',
    dateType: 'date',
    ready: false,
    summarise: (rows) => ({
      value: rows.length ? sumBy(rows, 'score') / rows.length : 0,
      detail: rows.length ? 'rated today' : 'not rated'
    })
  }
];

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: 'index.html' },
  ...TRACKERS.map(({ key, label, href }) => ({ key, label, href }))
];

export const getTracker = (key) => TRACKERS.find((tracker) => tracker.key === key);
