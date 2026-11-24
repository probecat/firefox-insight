import { addDays, formatDuration, mondayOf, parseYmd, ymd } from '../lib/util.js';
import { detailedStats, excludeHost, generalStats } from '../lib/stats.js';
import { renderBars, renderTimeSeries } from './charts.js';

const $ = (id) => document.getElementById(id);
const show = (id, visible) => $(id).classList.toggle('hidden', !visible);

const OTHER = 'other websites';

// null = overview of all sites, otherwise the domain whose detailed report is shown
let selectedDomain = new URLSearchParams(location.search).get('detailed');
// incremented per render so a slow, outdated render does not overwrite a newer one
let renderId = 0;

async function generateReport() {
  const from = parseYmd($('report-date-from').value);
  const to = parseYmd($('report-date-to').value);
  const limit = parseInt($('report-limit').value, 10) || 0;
  const id = ++renderId;

  // ask the background to save time from the running session first
  await browser.runtime.sendMessage({ subject: 'flush' }).catch(() => {});
  if (id !== renderId) return;

  if (selectedDomain) await generateDetailedReport(from, to, selectedDomain, id);
  else await generateGeneralReport(from, to, limit, id);
}

async function generateGeneralReport(from, to, limit, id) {
  const stats = await generalStats(from, to, limit);
  if (id !== renderId) return;

  show('detailed-chart-wrapper', false);
  show('report-limit-wrapper', true);

  const entries = [...stats];
  setTotalTime(entries.reduce((sum, [, v]) => sum + v, 0));
  show('no-data-message', entries.length === 0);
  show('general-chart-wrapper', entries.length > 0);

  renderBars($('general-chart'), entries, (domain, index) => {
    if (domain === OTHER && index === entries.length - 1) {
      $('report-limit').value = limit + 10;
      generateReport();
      return;
    }
    selectedDomain = domain;
    history.pushState(null, '', `${location.pathname}?${new URLSearchParams({ detailed: domain })}`);
    selectRange('btn-last-week');
  });
}

async function generateDetailedReport(from, to, domain, id) {
  const rows = await detailedStats(from, to, domain);
  if (id !== renderId) return;

  show('general-chart-wrapper', false);
  show('report-limit-wrapper', false);
  show('detailed-chart-wrapper', true);

  const total = rows.reduce((sum, r) => sum + r.timeSpent, 0);
  setTotalTime(total, domain);
  $('detailed-title').textContent = `Time spent on ${domain}`;

  const empty = rows.length === 0 || total === 0;
  show('no-data-message', empty);
  show('detailed-chart', !empty);
  if (!empty) renderTimeSeries($('detailed-chart'), rows, domain);
}

function setTotalTime(seconds, domain = null) {
  show('time-message', seconds > 0);
  show('no-time-message', seconds <= 0);
  $('total-time').textContent = formatDuration(seconds);
  $('total-time-domain').textContent = domain ? ` on ${domain}` : '';
  if (domain) $('excluded-domain').textContent = domain;
}

const RANGES = {
  'btn-today': () => [new Date(), new Date()],
  'btn-yesterday': () => [addDays(new Date(), -1), addDays(new Date(), -1)],
  'btn-this-week': () => [mondayOf(new Date()), new Date()],
  'btn-last-week': () => {
    const monday = addDays(mondayOf(new Date()), -7);
    return [monday, addDays(monday, 6)];
  },
};

function selectRange(buttonId) {
  const [from, to] = RANGES[buttonId]();
  $('report-date-from').value = ymd(from);
  $('report-date-to').value = ymd(to);
  highlight(buttonId);
  show('custom-filter', false);
  generateReport();
}

function highlight(buttonId) {
  for (const b of document.querySelectorAll('.report-filter button')) {
    b.classList.toggle('selected', b.id === buttonId);
  }
}

function backToOverview() {
  selectedDomain = null;
  history.pushState(null, '', location.pathname);
  selectRange('btn-today');
}

for (const id of Object.keys(RANGES)) $(id).addEventListener('click', () => selectRange(id));

$('btn-custom').addEventListener('click', () => {
  highlight('btn-custom');
  show('custom-filter', true);
});

for (const id of ['report-date-from', 'report-date-to']) {
  $(id).addEventListener('change', () => {
    // avoid generating huge reports from half-typed years
    const day = parseYmd($(id).value);
    if (day && day > new Date(2000, 0, 1)) generateReport();
  });
}
$('report-limit').addEventListener('change', generateReport);

$('show-general-report').addEventListener('click', (e) => {
  e.preventDefault();
  backToOverview();
});

$('btn-exclude-domain').addEventListener('click', async (e) => {
  e.preventDefault();
  if (!confirm(`Are you sure you want to exclude "${selectedDomain}" from the Insight reporting?`)) return;
  await excludeHost(selectedDomain);
  backToOverview();
});

window.addEventListener('popstate', () => location.reload());

selectRange(selectedDomain ? 'btn-last-week' : 'btn-today');
