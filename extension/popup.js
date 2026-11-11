document.addEventListener('DOMContentLoaded', async () => {
  const tabTitleEl = document.getElementById('tabTitle');
  const tabUrlEl = document.getElementById('tabUrl');
  const quickImpressionEl = document.getElementById('quickImpression');
  const selectedTextEl = document.getElementById('selectedText');
  const quoteFieldEl = document.getElementById('quoteField');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');

  let currentTab = null;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];

    if (currentTab) {
      tabTitleEl.textContent = currentTab.title || 'Current Web Page';
      tabUrlEl.textContent = currentTab.url || '';

      // Try to get selected text from page
      if (currentTab.id) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: () => window.getSelection()?.toString() || '',
          });
          const text = results[0]?.result?.trim();
          if (text) {
            quoteFieldEl.style.display = 'block';
            selectedTextEl.value = text;
          }
        } catch {
          // Scripting injection may fail on chrome:// urls
        }
      }
    }
  } catch (err) {
    tabTitleEl.textContent = 'Could not access active tab';
    console.error(err);
  }

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Ingesting into Pitaara...';
    statusMsg.className = 'status-msg';

    const payload = {
      raw_url: currentTab?.url,
      quick_impression: quickImpressionEl.value.trim() || undefined,
    };

    if (selectedTextEl.value.trim()) {
      payload.raw_content = selectedTextEl.value.trim();
    }

    try {
      const stored = await new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.get(['pitaara_user_id'], resolve);
        } else {
          resolve({});
        }
      });

      const headers = {
        'Content-Type': 'application/json',
      };
      if (stored?.pitaara_user_id) {
        headers['x-pitaara-user-id'] = stored.pitaara_user_id;
      }

      const response = await fetch('http://localhost:3000/api/ingest', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }

      statusMsg.textContent = '✓ Saved to Pitaara!';
      statusMsg.className = 'status-msg success';
      saveBtn.textContent = 'Saved!';

      setTimeout(() => {
        window.close();
      }, 1000);
    } catch (err) {
      statusMsg.textContent = 'Ensure Pitaara server is running on http://localhost:3000';
      statusMsg.className = 'status-msg error';
      saveBtn.disabled = false;
      saveBtn.textContent = 'Try Again';
      console.error(err);
    }
  });
});

