// Service worker: applies the saved CSS/JS for a site to its tabs.
//
// Styles are stored in chrome.storage.local, keyed by hostname: { css, js }.
// Popup settings (width, fontsize, wrap) live under SETTINGS_KEY.

const SETTINGS_KEY = '__settings';

function isInjectable(url) {
  return !!url && /^https?:\/\//i.test(url);
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

async function getStyles(hostname) {
  const result = await chrome.storage.local.get(hostname);
  return result[hostname] || { css: '', js: '' };
}

// Replace the CSS this extension previously inserted into the tab with the current CSS.
async function applyCSS(tabId, css) {
  const key = 'css:' + tabId;
  const previous = (await chrome.storage.session.get(key))[key];
  if (previous) {
    await chrome.scripting.removeCSS({ target: { tabId }, css: previous }).catch(() => {});
    await chrome.storage.session.remove(key);
  }
  if (css) {
    await chrome.scripting.insertCSS({ target: { tabId }, css });
    await chrome.storage.session.set({ [key]: css });
  }
}

// Run the saved JS in the page's own world, as a <script> element (replacing the previous one).
async function applyJS(tabId, js) {
  if (!js) {
    return;
  }
  await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: (code) => {
      const old = document.getElementById('superScripts');
      if (old) {
        old.remove();
      }
      const script = document.createElement('script');
      script.id = 'superScripts';
      script.textContent = code;
      (document.head || document.documentElement).appendChild(script);
    },
    args: [js]
  });
}

async function applyToTab(tabId, url, what) {
  const hostname = isInjectable(url) && hostnameOf(url);
  if (!hostname) {
    return;
  }
  const styles = await getStyles(hostname);
  try {
    if (what.css) {
      await applyCSS(tabId, styles.css);
    }
    if (what.js) {
      await applyJS(tabId, styles.js);
    }
  } catch (e) {
    console.error('Super Styles: could not apply styles', e);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    applyToTab(tabId, tab.url, { css: true });
  } else if (changeInfo.status === 'complete') {
    applyToTab(tabId, tab.url, { js: true });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.session.remove('css:' + tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'apply') {
    // Sent by the popup after an edit: re-apply both CSS and JS to that tab.
    chrome.tabs.get(message.tabId).then((tab) => applyToTab(tab.id, tab.url, { css: true, js: true }));
  } else if (message.type === 'legacy-storage') {
    importLegacyStorage(message.entries).then(() => sendResponse(true));
    return true;
  }
});

// Versions before 1.1 kept everything in the popup's localStorage under "<origin>-css", "<origin>-js"
// plus width/fontsize/wrap. An offscreen document can read that localStorage and hand it over.
async function importLegacyStorage(entries) {
  const sites = {};
  const settings = {};
  for (const [key, value] of Object.entries(entries)) {
    const site = /^(https?:\/\/.+)-(css|js)$/.exec(key);
    if (site) {
      const hostname = hostnameOf(site[1]);
      if (hostname) {
        sites[hostname] = sites[hostname] || {};
        sites[hostname][site[2]] = value;
      }
    } else if (['width', 'fontsize', 'wrap'].includes(key)) {
      settings[key] = value;
    }
  }

  const existing = await chrome.storage.local.get(null);
  const toSave = {};
  for (const [hostname, styles] of Object.entries(sites)) {
    // Never overwrite something already saved with the new version.
    if (!existing[hostname]) {
      toSave[hostname] = { css: styles.css || '', js: styles.js || '' };
    }
  }
  if (!existing[SETTINGS_KEY] && Object.keys(settings).length) {
    toSave[SETTINGS_KEY] = settings;
  }
  await chrome.storage.local.set(toSave);
}

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== 'update') {
    return;
  }
  try {
    await chrome.offscreen.createDocument({
      url: 'migrate.html',
      reasons: ['LOCAL_STORAGE'],
      justification: 'Move styles saved by earlier versions into extension storage'
    });
  } catch (e) {
    console.error('Super Styles: could not start migration', e);
  }
});

// The offscreen document reports once it has sent the old data.
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'legacy-done') {
    chrome.offscreen.closeDocument().catch(() => {});
  }
});
