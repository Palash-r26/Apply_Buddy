// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SYNC_APPLYBUDDY_DATA') {
    chrome.storage.local.set({ applybuddy_data: request.data }, () => {
      console.log('ApplyBuddy data synced successfully');
      sendResponse({ success: true });
    });
    return true; // keep channel open for async response
  }
});
