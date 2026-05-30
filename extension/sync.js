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

// Initial sync on load
syncDataToExtension();

// Sync when localStorage changes (e.g. from React state updates)
window.addEventListener('storage', (e) => {
  if (e.key === 'applybuddy_data') {
    syncDataToExtension();
  }
});

// For same-tab dynamic updates where 'storage' event doesn't fire for the same window,
// we can hijack localStorage.setItem or rely on a periodic check, or a custom event if the app emits one.
// Periodic check for simplicity:
let lastData = localStorage.getItem('applybuddy_data');
setInterval(() => {
  const currentData = localStorage.getItem('applybuddy_data');
  if (currentData !== lastData) {
    lastData = currentData;
    syncDataToExtension();
  }
}, 2000);
