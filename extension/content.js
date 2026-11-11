(() => {
  // Prevent duplicate script execution
  if (window.__pitaaraContentScriptLoaded) return;
  window.__pitaaraContentScriptLoaded = true;

  // Sync authenticated user ID from web vault if on local Pitaara domain
  if (window.location.origin.includes('localhost:3000') || window.location.origin.includes('127.0.0.1:3000')) {
    try {
      const storedId = localStorage.getItem('pitaara_user_id');
      if (storedId && typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ pitaara_user_id: storedId });
      }
    } catch {}

    window.addEventListener('message', (e) => {
      if (e.data?.type === 'PITAARA_USER_SYNC' && e.data.userId) {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ pitaara_user_id: e.data.userId });
        }
      }
    });
  }

  const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const CLOSE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  let activeOverlay = null;
  let autoSaveTimeout = null;

  function dismissOverlay() {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = null;
    }
    if (activeOverlay) {
      activeOverlay.classList.remove('pitaara-visible');
      activeOverlay.classList.add('pitaara-hiding');
      setTimeout(() => {
        const host = document.getElementById('pitaara-toast-host');
        if (host) host.remove();
        activeOverlay = null;
      }, 260);
    }
  }

  function triggerCapture() {
    // If overlay is already active, refocus its input
    if (activeOverlay) {
      const input = activeOverlay.querySelector('.pitaara-toast-input');
      if (input) input.focus();
      return;
    }

    const currentUrl = window.location.href;
    const selectedText = window.getSelection()?.toString().trim() || '';

    // Create toast container
    let host = document.getElementById('pitaara-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'pitaara-toast-host';
      document.body.appendChild(host);
    }

    const pill = document.createElement('div');
    pill.className = 'pitaara-toast-pill';

    const icon = document.createElement('div');
    icon.className = 'pitaara-toast-icon';
    icon.innerHTML = CHECK_SVG;
    icon.style.borderColor = '#10B981';
    icon.style.color = '#34D399';

    const status = document.createElement('span');
    status.className = 'pitaara-toast-status pitaara-success';
    status.textContent = 'Saved to your Pitaara!';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pitaara-toast-input';
    input.placeholder = 'Add a quick thought... (Enter to update, Esc to close)';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'pitaara-toast-close';
    closeBtn.innerHTML = CLOSE_SVG;
    closeBtn.title = 'Dismiss (Esc)';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      dismissOverlay();
    };

    pill.appendChild(icon);
    pill.appendChild(status);
    pill.appendChild(input);
    pill.appendChild(closeBtn);
    host.appendChild(pill);

    activeOverlay = pill;

    // Trigger smooth fade-in immediately upon pressing Alt+S
    requestAnimationFrame(() => {
      pill.classList.add('pitaara-visible');
      input.focus();
    });

    let createdArtifactId = null;

    // 1. Dispatch ingestion asynchronously and immediately in background
    const payload = {
      raw_url: currentUrl,
      title: document.title || '',
      quick_impression: '',
    };
    if (selectedText) {
      payload.raw_content = selectedText;
    }

    const sendIngestRequest = (userId, impression = '') => {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (userId) {
        headers['x-pitaara-user-id'] = userId;
      }
      if (impression) {
        payload.quick_impression = impression;
      }

      fetch('http://localhost:3000/api/ingest', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            createdArtifactId = data.id || null;
          } else {
            const errData = await res.json().catch(() => ({}));
            console.error('Pitaara capture error:', errData.error || res.statusText);
          }
        })
        .catch((err) => {
          console.error('Pitaara background capture error:', err);
        });
    };

    let activeUserId = null;
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['pitaara_user_id'], (items) => {
        activeUserId = items?.pitaara_user_id || null;
        sendIngestRequest(activeUserId);
      });
    } else {
      sendIngestRequest(null);
    }

    const submitNote = (note) => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }
      if (note && note.trim()) {
        const trimmed = note.trim();
        status.textContent = 'Thought saved to Pitaara!';
        input.style.display = 'none';

        if (createdArtifactId) {
          fetch('http://localhost:3000/api/artifacts', {
            method: 'PATCH',
            mode: 'cors',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(activeUserId ? { 'x-pitaara-user-id': activeUserId } : {}),
            },
            body: JSON.stringify({ id: createdArtifactId, quick_impression: trimmed }),
          }).catch(() => {});
        } else {
          sendIngestRequest(activeUserId, trimmed);
        }
      } else {
        dismissOverlay();
        return;
      }

      setTimeout(() => {
        dismissOverlay();
      }, 1200);
    };

    input.addEventListener('keydown', (e) => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        submitNote(input.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        dismissOverlay();
      }
    });

    // Pause auto-dismiss if user begins typing
    input.addEventListener('input', () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }
    });

    // Auto-dismiss after 2.4s if left untouched
    autoSaveTimeout = setTimeout(() => {
      if (!input.value.trim()) {
        dismissOverlay();
      }
    }, 2400);
  }

  // Listen for messages from background service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'pitaara-capture') {
      triggerCapture();
      sendResponse({ status: 'triggered' });
    }
  });

  // Also support direct in-page Alt+S keyboard shortcut
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) {
      // Avoid conflict if user is typing in form controls
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      triggerCapture();
    }
  });
})();
