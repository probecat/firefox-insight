// Minimal dependency-free charts.

import { formatDate, formatDuration } from '../lib/util.js';

const COLORS = [
  '#4E79A7', '#A0CBE8', '#F28E2B', '#FFBE7D', '#59A14F', '#8CD17D', '#B6992D', '#F1CE63', '#499894', '#86BCB6',
  '#E15759', '#FF9D9A', '#79706E', '#BAB0AC', '#D37295', '#FABFD2', '#B07AA1', '#D4A6C8', '#9D7660', '#D7B5A6',
];

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

/**
 * Horizontal bar list. `entries` is [[label, seconds], ...];
 * onSelect(label, index) fires when a row is clicked.
 */
export function renderBars(container, entries, onSelect) {
  const max = Math.max(...entries.map(([, v]) => v), 1);
  container.replaceChildren(
    ...entries.map(([label, value], i) => {
      const row = el(
        'li',
        { title: `show detailed report for ${label}` },
        el('span', { className: 'bar-label', textContent: label }),
        el(
          'span',
          { className: 'bar-track' },
          el('span', { className: 'bar', style: `width:${(value / max) * 85}%;background:${COLORS[i % COLORS.length]}` }),
          formatDuration(value),
        ),
      );
      row.addEventListener('click', () => onSelect(label, i));
      return row;
    }),
  );
}

const NS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text != null) node.textContent = text;
  return node;
}

// Tick steps that read well as durations.
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200];

function niceStep(raw) {
  return STEPS.find((s) => s >= raw) ?? Math.ceil(raw / 3600) * 3600;
}

/**
 * Time-series chart for [{date, timeSpent}]: a line chart, or a single bar
 * when there is only one row.
 */
export function renderTimeSeries(container, rows, label) {
  const W = 1000, H = 400, L = 90, R = 60, T = 15, B = 40;
  const plotW = W - L - R, plotH = H - T - B;

  const max = Math.max(...rows.map((r) => r.timeSpent), 1);
  const step = niceStep(max / 5);
  const top = Math.ceil(max / step) * step;

  const y = (v) => T + plotH * (1 - v / top);
  const x = (i) => (rows.length === 1 ? L + plotW / 2 : L + (i * plotW) / (rows.length - 1));

  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });

  for (let v = 0; v <= top; v += step) {
    root.append(
      svg('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }),
      svg('text', { class: 'axis-label', x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, formatDuration(v)),
    );
  }

  const every = Math.ceil(rows.length / 10);
  rows.forEach((r, i) => {
    if (i % every === 0) {
      root.append(svg('text', { class: 'axis-label', x: x(i), y: H - B + 20, 'text-anchor': 'middle' }, formatDate(r.date)));
    }
  });

  const color = '#F28E2B';
  if (rows.length === 1) {
    const w = Math.min(150, plotW / 2);
    const bar = svg('rect', { x: x(0) - w / 2, y: y(rows[0].timeSpent), width: w, height: plotH - (y(rows[0].timeSpent) - T), fill: color });
    bar.append(svg('title', {}, `${formatDate(rows[0].date)}\n${label}: ${formatDuration(rows[0].timeSpent)}`));
    root.append(bar);
  } else {
    root.append(
      svg('polyline', {
        points: rows.map((r, i) => `${x(i)},${y(r.timeSpent)}`).join(' '),
        fill: 'none',
        stroke: color,
        'stroke-width': 3,
      }),
    );
    rows.forEach((r, i) => {
      const point = svg('circle', { class: 'point', cx: x(i), cy: y(r.timeSpent), r: 4, fill: color });
      point.append(svg('title', {}, `${formatDate(r.date)}\n${label}: ${formatDuration(r.timeSpent)}`));
      root.append(point);
    });
  }

  container.replaceChildren(root);
}
