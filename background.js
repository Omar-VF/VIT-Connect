// Background service worker - handles tab management requests from content script

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'closeTab' && sender?.tab?.id) {
    chrome.tabs.remove(sender.tab.id).catch(() => {});
  }
});

