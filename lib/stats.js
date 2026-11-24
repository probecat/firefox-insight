// Read-side queries over the stored daily stats, used by the report page.
// Storage layout:
//   stat_YYYY-MM-DD -> { [host]: seconds }
//   excludedHosts   -> { [host]: true }

import { addDays, dayKey, mondayOf, ymd } from './util.js';

const isDate = (d) => d instanceof Date && !isNaN(d);

/** [[date, {host: seconds}], ...] for every day in [from, to], fetched in one storage call. */
async function loadDays(from, to) {
  const days = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  const data = await browser.storage.local.get(days.map(dayKey));
  return days.map((d) => [d, data[dayKey(d)] ?? {}]);
}

/**
 * Total seconds per host between two dates, sorted descending, limited to the
 * top `limit` non-excluded hosts. Everything else is summed under 'other websites'.
 */
export async function generalStats(from, to, limit = 10) {
  if (!isDate(from) || !isDate(to)) return new Map();

  const totals = {};
  for (const [, day] of await loadDays(from, to)) {
    for (const [host, s] of Object.entries(day)) totals[host] = (totals[host] ?? 0) + s;
  }

  const { excludedHosts = {} } = await browser.storage.local.get('excludedHosts');
  const result = new Map();
  let other = 0;
  for (const host of Object.keys(totals).sort((a, b) => totals[b] - totals[a])) {
    if (result.size < limit && !(host in excludedHosts)) result.set(host, totals[host]);
    else other += totals[host];
  }
  if (other > 0) result.set('other websites', other);
  return result;
}

/** [{date, timeSpent}] per day for one host; grouped by week for ranges over ~2 months. */
export async function detailedStats(from, to, host) {
  if (!isDate(from) || !isDate(to)) return [];

  const rows = (await loadDays(from, to)).map(([date, day]) => ({ date, timeSpent: day[host] ?? 0 }));

  const diffDays = Math.ceil(Math.abs(to - from) / 864e5);
  if (diffDays <= 61) return rows;

  const weeks = new Map();
  for (const { date, timeSpent } of rows) {
    const monday = mondayOf(date);
    const week = weeks.get(ymd(monday)) ?? { date: monday, timeSpent: 0 };
    week.timeSpent += timeSpent;
    weeks.set(ymd(monday), week);
  }
  return [...weeks.values()];
}

export async function excludeHost(host) {
  const { excludedHosts = {} } = await browser.storage.local.get('excludedHosts');
  excludedHosts[host] = true;
  await browser.storage.local.set({ excludedHosts });
}
