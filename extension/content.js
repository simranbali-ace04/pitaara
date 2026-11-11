(() => {
  // Prevent duplicate script execution
  if (window.__pitaaraContentScriptLoaded) return;
  window.__pitaaraContentScriptLoaded = true;

  const PITAARA_INGEST_URL = 'https://pitaara-fmha.vercel.app/api/ingest';

  // Sync authenticated user ID from web vault if on live or local Pitaara domain
  if (
    window.location.origin.includes('pitaara-fmha.vercel.app') ||
    window.location.origin.includes('localhost:3000') ||
    window.location.origin.includes('127.0.0.1:3000')
  ) {
    try {
      const storedId = localStorage.getItem('pitaara_user_id');
      if (storedId && typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ pitaara_user_id: storedId });
      }
    } catch { }

    window.addEventListener('message', (e) => {
      if (e.data?.type === 'PITAARA_USER_SYNC' && e.data.userId) {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
          chrome.storage.local.set({ pitaara_user_id: e.data.userId });
        }
      }
    });
  }

  const LATCH_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M7 8V5a5 5 0 0 1 10 0v3"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><path d="M12 15.5V17"/></svg>`;
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
    // If overlay is already active, refocus its input and return
    if (activeOverlay) {
      const existingInput = activeOverlay.querySelector('.pitaara-toast-input');
      if (existingInput) existingInput.focus();
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
    icon.innerHTML = LATCH_SVG;

    const status = document.createElement('span');
    status.className = 'pitaara-toast-status';
    status.textContent = 'Pitaara Keepsake';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pitaara-toast-input';
    input.placeholder = 'Add a quick thought... (Enter to save, Esc to skip)';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'pitaara-toast-close';
    closeBtn.innerHTML = CLOSE_SVG;
    closeBtn.title = 'Dismiss (Esc)';

    pill.appendChild(icon);
    pill.appendChild(status);
    pill.appendChild(input);
    pill.appendChild(closeBtn);
    host.appendChild(pill);

    activeOverlay = pill;

    requestAnimationFrame(() => {
      pill.classList.add('pitaara-visible');
      input.focus();
    });

    // Boolean lock: guarantees fetch is called at most once per overlay invocation
    let isDispatched = false;

    // Single point of network ingestion
    const executeSave = (thought = '', immediateDismiss = false) => {
      if (isDispatched) return;
      isDispatched = true;

      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }

      const trimmedThought = (thought || '').trim();

      if (!immediateDismiss) {
        icon.innerHTML = CHECK_SVG;
        icon.style.borderColor = '#10B981';
        icon.style.color = '#34D399';
        status.textContent = 'Saved to your Pitaara!';
        status.className = 'pitaara-toast-status pitaara-success';
        input.style.display = 'none';
        closeBtn.style.display = 'none';

        setTimeout(() => {
          dismissOverlay();
        }, 1000);
      } else {
        dismissOverlay();
      }

      const payload = {
        raw_url: currentUrl,
        title: document.title || '',
        quick_impression: trimmedThought,
      };
      if (selectedText) {
        payload.raw_content = selectedText;
      }

      const dispatch = (userId) => {
        const headers = {
          'Content-Type': 'application/json',
        };
        if (userId) {
          headers['x-pitaara-user-id'] = userId;
        }

        fetch(PITAARA_INGEST_URL, {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers,
          body: JSON.stringify(payload),
        })
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              console.error('Pitaara capture error:', errData.error || res.statusText);
            }
          })
          .catch((err) => {
            console.error('Pitaara background capture error:', err);
          });
      };

      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get(['pitaara_user_id'], (items) => {
          dispatch(items?.pitaara_user_id || null);
        });
      } else {
        dispatch(null);
      }
    };

    // Timer management: 3-second countdown, reset on active typing
    function startOrResetTimer() {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = null;
      }
      autoSaveTimeout = setTimeout(() => {
        if (!isDispatched) {
          executeSave(input.value.trim(), false);
        }
      }, 3000);
    }

    // Start 3-second timer on mount
    startOrResetTimer();

    // Reset timer when user types
    input.addEventListener('input', () => {
      if (isDispatched) return;
      startOrResetTimer();
    });

    // Keydown interactions
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        executeSave(input.value.trim(), false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        executeSave('', true);
      }
    });

    // Close button dismisses immediately with empty impression
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      executeSave('', true);
    };
  }

  // Background worker listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'pitaara-capture') {
      triggerCapture();
      sendResponse({ status: 'triggered' });
    }
  });

  // In-page hotkey listener (Alt + S)
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) {
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      triggerCapture();
    }
  });
})();
