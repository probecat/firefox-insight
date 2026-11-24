// Local-time date helpers and duration formatting.

const pad = (n) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" in local time (also the value format of <input type="date">). */
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parse "YYYY-MM-DD" as local midnight. Returns null when invalid. */
export function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}

/** Storage key for one day's per-host seconds. */
export const dayKey = (d) => `stat_${ymd(d)}`;

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Monday of the week containing d. */
export const mondayOf = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

/** 3725 -> "1h 2m 5s", 65 -> "1m 5s", 5 -> "5s" (leading zero units dropped). */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (h || m) parts.push(`${m}m`);
  parts.push(`${s % 60}s`);
  return parts.join(' ');
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Nov 24 2026" */
export const formatDate = (d) => `${MONTHS[d.getMonth()]} ${pad(d.getDate())} ${d.getFullYear()}`;
