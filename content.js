// On-page timer overlay (only shown when enabled in settings).
// The background sends today's total for this site; this script ticks it
// locally every second until told to pause.

(() => {
  // The background can inject this script again into a tab that already has it.
  if (globalThis.insightTimerLoaded) return;
  globalThis.insightTimerLoaded = true;

  let host = null;
  let tick = null;

  const pad = (n) => String(n).padStart(2, '0');
  const hms = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(pad).join(':');
  const today = () =>
    new Date()
      .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      .toUpperCase();

  function ensureOverlay() {
    if (host?.isConnected) return host.shadowRoot;
    host = document.createElement('div');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host { all: initial; }
      div.box { position: fixed; top: 20px; right: 20px; z-index: 2147483647; pointer-events: none;
        background: grey; opacity: .9; color: #fff; border: 1px solid #000; border-radius: 5px;
        padding: 10px; font: 16px/20px sans-serif; text-align: center; }
      .date { font-size: 14px; } .label { font-weight: bold; }
      .time { font-weight: bold; font-size: 20px; margin-top: 5px; }
    </style><div class="box"><div class="date"></div><div class="label">Time spent on</div>
      <div class="domain"></div><div class="time"></div></div>`;
    (document.body || document.documentElement).appendChild(host);
    return root;
  }

  function stop() {
    clearInterval(tick);
    tick = null;
  }

  function show(seconds, domain) {
    stop();
    const root = ensureOverlay();
    root.querySelector('.domain').textContent = domain;
    const start = Date.now();
    const render = () => {
      root.querySelector('.date').textContent = today();
      root.querySelector('.time').textContent = hms(seconds + Math.floor((Date.now() - start) / 1000));
    };
    render();
    tick = setInterval(render, 1000);
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (msg.subject === 'setTimer') show(msg.timeSpent, msg.domain);
    else if (msg.subject === 'pauseTimer') stop();
    else if (msg.subject === 'hideTimer') {
      stop();
      host?.remove();
      host = null;
    }
  });

  browser.runtime.sendMessage({ subject: 'hello' }).catch(() => {});
})();
