// Runs in an offscreen document so it can read the localStorage used by versions before 1.1.
const entries = {};
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  entries[key] = localStorage.getItem(key);
}
chrome.runtime.sendMessage({ type: 'legacy-storage', entries }, () => {
  chrome.runtime.sendMessage({ type: 'legacy-done' });
});
