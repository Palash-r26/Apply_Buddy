// background.js

chrome.action.onClicked.addListener((tab) => {
  try {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (e) {
    console.warn("Manual side panel open not supported:", e);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SYNC_APPLYBUDDY_DATA') {
    chrome.storage.local.set({ applybuddy_data: request.data }, () => {
      console.log('ApplyBuddy data synced successfully');
      sendResponse({ success: true });
    });
    return true; // keep channel open for async response
  }
});
