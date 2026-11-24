const toggle = document.getElementById('insight-timer');
const message = document.getElementById('insight-timer-form-message');
let clearMessage;

browser.storage.local.get('isShowTimer').then(({ isShowTimer }) => {
  toggle.checked = Boolean(isShowTimer);
});

toggle.addEventListener('change', async () => {
  await browser.storage.local.set({ isShowTimer: toggle.checked });
  message.textContent = 'Saved!';
  clearTimeout(clearMessage);
  clearMessage = setTimeout(() => (message.textContent = ''), 5000);
});
