// sync.js - Injected into the ApplyBuddy Web App to sync data to the extension

function syncDataToExtension() {
  const dataString = localStorage.getItem('applybuddy_data');
  if (dataString) {
    try {
      const data = JSON.parse(dataString);
      // Send message to background script
      chrome.runtime.sendMessage({
        action: 'SYNC_APPLYBUDDY_DATA',
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Background script might be inactive, that's fine
          console.debug("ApplyBuddy Sync: ", chrome.runtime.lastError.message);
        } else {
          console.log("ApplyBuddy Extension Sync Successful");
        }
      });
    } catch (e) {
      console.error("ApplyBuddy Sync Error:", e);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== 'FORCE_SYNC_APPLYBUDDY_DATA') {
    return false;
  }

  const dataString = localStorage.getItem('applybuddy_data');
  if (!dataString) {
    sendResponse({ success: false, data: null });
    return true;
  }

  try {
    const data = JSON.parse(dataString);
    chrome.runtime.sendMessage({ action: 'SYNC_APPLYBUDDY_DATA', data });
    sendResponse({ success: true, data });
  } catch (e) {
    console.error('ApplyBuddy force sync parse error:', e);
    sendResponse({ success: false, data: null });
  }

  return true;
});

// Initial sync on load
syncDataToExtension();

// Re-sync when user returns to this tab.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    syncDataToExtension();
  }
});

// Sync when localStorage changes (e.g. from React state updates)
window.addEventListener('storage', (e) => {
  if (e.key === 'applybuddy_data') {
    syncDataToExtension();
  }
});

// Receive cross-world real-time updates from React main-world
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'APPLYBUDDY_LOCAL_UPDATE') {
    syncDataToExtension();
  }
});

// Capture same-tab localStorage updates immediately instead of waiting for polling.
const originalSetItem = localStorage.setItem;
localStorage.setItem = function patchedSetItem(key, value) {
  originalSetItem.call(this, key, value);
  if (key === 'applybuddy_data') {
    syncDataToExtension();
  }
};
