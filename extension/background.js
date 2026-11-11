// Background Service Worker for Pitaara Web Clipper
// MUST NOT perform any network requests (fetch). Only forwards capture command to active tab.

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

// 1. Extension toolbar action click
chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    sendCaptureMessage(tab.id);
  }
});

// 2. Alt+S shortcut command forwarder
chrome.commands.onCommand.addListener((command) => {
  if (
    command === 'pitaara-capture' ||
    command === 'capture-artifact' ||
    command === '_execute_action'
  ) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        sendCaptureMessage(tabs[0].id);
      }
    });
  }
});
