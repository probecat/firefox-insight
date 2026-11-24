// Time tracking.
//
// MV3 suspends idle background pages, so timers cannot poll. Tracking is event
// driven instead. When the tab, URL, window focus, idle state, or audio
// changes, the time since the last checkpoint is credited to the tracked site
// and a new checkpoint starts. A one-minute alarm adds checkpoints, so a long
// stay on one page is saved regularly. The current checkpoint lives in
// storage.session, so it survives suspension.
//
// Time counts only while the browser window is focused. The user must not be
// idle for 15s, unless the active tab is playing audio. A locked screen never
// counts.

import { domainOf } from './lib/domain.js';
import { dayKey, formatDuration } from './lib/util.js';

const IDLE_SECONDS = 15;
const CHECKPOINT_ALARM = 'checkpoint';
// Checkpoints normally happen at least once a minute. A longer gap means the
// machine slept or the browser stalled, so that span is not credited.
const MAX_GAP_MS = 3 * 60 * 1000;

browser.idle.setDetectionInterval(IDLE_SECONDS);

browser.alarms.get(CHECKPOINT_ALARM).then((alarm) => {
  if (!alarm) browser.alarms.create(CHECKPOINT_ALARM, { periodInMinutes: 1 });
});

// Checkpoints read-modify-write storage, so run them one at a time.
let queue = Promise.resolve();
function checkpoint() {
  const run = queue.then(doCheckpoint);
  queue = run.catch((e) => console.error('checkpoint failed', e));
  return run;
}

/** The tab whose site accumulates time now, or null. */
async function findTarget() {
  let win;
  try {
    win = await browser.windows.getLastFocused();
  } catch {
    return null;
  }
  if (!win?.focused) return null;

  const [tab] = await browser.tabs.query({ active: true, windowId: win.id });
  if (!tab) return null;

  const state = await browser.idle.queryState(IDLE_SECONDS);
  if (state === 'locked') return null;
  if (state === 'idle' && !tab.audible) return null;

  return { tabId: tab.id, host: domainOf(tab.url) };
}

/** Split [from, to) at local midnights: [[dayKey, ms], ...]. */
function splitByDay(from, to) {
  const chunks = [];
  for (let t = from; t < to; ) {
    const d = new Date(t);
    const end = Math.min(to, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime());
    chunks.push([dayKey(d), end - t]);
    t = end;
  }
  return chunks;
}

async function credit(host, from, to) {
  if (to - from > MAX_GAP_MS) return;
  const chunks = splitByDay(from, to)
    .map(([key, ms]) => [key, Math.round(ms / 1000)])
    .filter(([, s]) => s > 0);
  if (!chunks.length) return;

  const stored = await browser.storage.local.get(chunks.map(([key]) => key));
  const update = {};
  for (const [key, s] of chunks) {
    const day = stored[key] ?? {};
    day[host] = (day[host] ?? 0) + s;
    update[key] = day;
  }
  await browser.storage.local.set(update);
}

function send(tabId, msg) {
  browser.tabs.sendMessage(tabId, msg).catch(() => {}); // no content script on this page
}

async function doCheckpoint() {
  const now = Date.now();
  const { current } = await browser.storage.session.get('current');
  if (current?.host) await credit(current.host, current.since, now);

  const target = await findTarget();
  const next = target && { ...target, since: now };
  await browser.storage.session.set({ current: next });

  if (current && current.tabId !== next?.tabId) send(current.tabId, { subject: 'pauseTimer' });
  if (!target) return;

  if (!target.host) {
    browser.action.setTitle({ title: 'Not tracking activity for this website' });
    return;
  }

  const key = dayKey(new Date(now));
  const { [key]: today = {}, isShowTimer } = await browser.storage.local.get([key, 'isShowTimer']);
  const seconds = today[target.host] ?? 0;

  browser.action.setTitle({ title: `Time spent on ${target.host} today: ${formatDuration(seconds)}` });
  if (isShowTimer) send(target.tabId, { subject: 'setTimer', timeSpent: seconds, domain: target.host });
}

browser.tabs.onActivated.addListener(checkpoint);
browser.tabs.onUpdated.addListener(checkpoint, { properties: ['url', 'audible'] });
browser.tabs.onRemoved.addListener(checkpoint);
browser.windows.onFocusChanged.addListener(checkpoint);
browser.idle.onStateChanged.addListener(checkpoint);
browser.alarms.onAlarm.addListener(checkpoint);
browser.runtime.onStartup.addListener(checkpoint);
browser.runtime.onInstalled.addListener(checkpoint);

browser.runtime.onMessage.addListener((msg) => {
  // 'hello': a page's content script just loaded and wants its timer.
  // 'flush': the report page wants up-to-date numbers.
  if (msg?.subject === 'hello' || msg?.subject === 'flush') {
    return checkpoint().then(() => true);
  }
});

browser.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local' || !('isShowTimer' in changes)) return;
  if (changes.isShowTimer.newValue) {
    checkpoint();
  } else {
    for (const tab of await browser.tabs.query({})) send(tab.id, { subject: 'hideTimer' });
  }
});
