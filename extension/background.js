// Background Service Worker for Pitaara Web Clipper

function sendCaptureMessage(tabId) {
  if (!tabId) return;

  chrome.tabs.sendMessage(tabId, { action: 'pitaara-capture' }, () => {
    // If content script was not already loaded on this tab, inject dynamically
    if (chrome.runtime.lastError) {
      chrome.scripting.insertCSS(
        {
          target: { tabId },
          files: ['overlay.css'],
        },
        () => {
          chrome.scripting.executeScript(
            {
              target: { tabId },
              files: ['content.js'],
            },
            () => {
              chrome.tabs.sendMessage(tabId, { action: 'pitaara-capture' }, () => {
                // Ignore any final silent error on restricted browser pages (chrome://, etc.)
                if (chrome.runtime.lastError) {
                  console.debug('Script injection not permitted on this URL');
                }
              });
            }
          );
        }
      );
    }
  });
}

// 1. Triggered when user clicks the extension toolbar action icon
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    sendCaptureMessage(tab.id);
  }
});

// 2. Triggered when user presses the Alt+S shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        sendCaptureMessage(tabs[0].id);
      }
    });
  }
});
