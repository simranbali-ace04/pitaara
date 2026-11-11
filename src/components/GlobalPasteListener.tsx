'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, Loader2, X, Check } from 'lucide-react';
import { playDropSound } from '@/lib/sound';
import type { Artifact, IngestPayload } from '@/types/artifact';

interface GlobalPasteListenerProps {
  onArtifactAdded?: (artifact: Artifact) => void;
  onArtifactCreated?: (artifact: Artifact) => void;
  onArtifactUpdated?: (artifact: Artifact) => void;
  onReconcileOptimistic?: (tempId: string, realArtifact: Artifact) => void;
  onErrorOptimistic?: (tempId: string) => void;
}

interface FloatingPillState {
  id?: string;
  isIngesting: boolean;
  message: string;
  impressionText: string;
}

export function GlobalPasteListener({
  onArtifactAdded,
  onArtifactCreated,
  onArtifactUpdated,
  onReconcileOptimistic,
  onErrorOptimistic,
}: GlobalPasteListenerProps) {
  const [pill, setPill] = useState<FloatingPillState | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const scheduleDismiss = useCallback(
    (delayMs: number = 3000) => {
      clearDismissTimer();
      dismissTimerRef.current = setTimeout(() => {
        setPill(null);
      }, delayMs);
    },
    [clearDismissTimer]
  );

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Do not intercept if user is typing into an input/textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // 1. Check for image files in clipboardData
      const files = clipboardData.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = async (event) => {
              const base64 = event.target?.result as string;
              await processIngest({ image_base64: base64 });
            };
            reader.readAsDataURL(files[i]);
            return;
          }
        }
      }

      const items = clipboardData.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              const reader = new FileReader();
              reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                await processIngest({ image_base64: base64 });
              };
              reader.readAsDataURL(file);
              return;
            }
          }
        }
      }

      // 2. Check for text or URL
      const text = (clipboardData.getData('text/plain') || clipboardData.getData('text') || '').trim();
      if (text) {
        e.preventDefault();
        const isUrl = /^(https?:\/\/|www\.|github\.com|x\.com|twitter\.com)/i.test(text);
        const payload: IngestPayload = isUrl ? { raw_url: text } : { raw_content: text };
        await processIngest(payload);
      }
    };

    const processIngest = async (payload: IngestPayload) => {
      // Play tactile audio immediately on paste
      try {
        playDropSound();
      } catch {}

      // 1. Generate instant optimistic artifact for 0ms visual feedback
      const tempId = `optimistic-${Date.now()}`;
      let optimisticType: Artifact['type'] = 'quote';
      let optimisticTitle = 'Pasted Keepsake';
      let optimisticDesc: string | null = null;
      let optimisticUrl: string | null = null;
      let optimisticContent: string | null = null;
      let optimisticMedia: string | null = null;
      let optimisticSite = 'Pitaara Note';

      if (payload.image_base64) {
        optimisticType = 'image';
        optimisticTitle = 'Captured Image';
        optimisticDesc = 'Pasted image';
        optimisticMedia = payload.image_base64;
        optimisticSite = 'Pitaara Media';
      } else if (payload.raw_url) {
        optimisticType = 'url';
        optimisticUrl = payload.raw_url;
        try {
          const u = new URL(payload.raw_url.startsWith('http') ? payload.raw_url : `https://${payload.raw_url}`);
          const host = u.hostname.replace(/^www\./, '');
          optimisticTitle = host;
          optimisticDesc = `Link from ${host}`;
          optimisticSite = host.split('.')[0] || 'Web Link';
        } catch {
          optimisticTitle = payload.raw_url;
        }
      } else if (payload.raw_content) {
        optimisticContent = payload.raw_content;
        const trimmed = payload.raw_content.trim();
        if (trimmed.startsWith('```') || /(function|const|let|var|class|import)\b/.test(trimmed)) {
          optimisticType = 'code_snippet';
        } else {
          optimisticType = 'quote';
        }
        optimisticTitle = trimmed.split('\n')[0].slice(0, 60);
        optimisticDesc = trimmed.length > 80 ? trimmed.slice(0, 200) + '...' : trimmed;
      }

      const optimisticArtifact: Artifact = {
        id: tempId,
        created_at: new Date().toISOString(),
        type: optimisticType,
        title: optimisticTitle,
        description: optimisticDesc,
        raw_url: optimisticUrl,
        raw_content: optimisticContent,
        media_url: optimisticMedia,
        site_name: optimisticSite,
        dominant_color: '#C6A664',
        is_favorite: false,
      };

      // Instantly prepend the card into the canvas
      if (onArtifactAdded) {
        onArtifactAdded(optimisticArtifact);
      } else if (onArtifactCreated) {
        onArtifactCreated(optimisticArtifact);
      }

      // Show floating feedback pill immediately
      setPill({
        id: tempId,
        isIngesting: true,
        message: 'Dropping into Pitaara...',
        impressionText: '',
      });
      clearDismissTimer();

      try {
        const res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const artifact: Artifact = await res.json();

        if (!res.ok) {
          throw new Error(
            (artifact as unknown as { error?: string })?.error || 'Failed to ingest artifact'
          );
        }

        // Reconcile optimistic item with persisted backend artifact
        if (onReconcileOptimistic) {
          onReconcileOptimistic(tempId, artifact);
        } else if (onArtifactAdded) {
          onArtifactAdded(artifact);
        }

        // Update pill with interaction prompt
        setPill({
          id: artifact.id,
          isIngesting: false,
          message: 'Pasted into Pitaara! Add a thought?',
          impressionText: '',
        });

        // Focus the quick impression input if pill mounted
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);

        // Auto dismiss after 3 seconds if untouched
        scheduleDismiss(3200);
      } catch (err: unknown) {
        console.error('Paste ingestion error:', err);
        // Rollback optimistic artifact if network or DB failed
        if (onErrorOptimistic) {
          onErrorOptimistic(tempId);
        }
        setPill({
          isIngesting: false,
          message: 'Could not save pasted item',
          impressionText: '',
        });
        scheduleDismiss(2500);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
      clearDismissTimer();
    };
  }, [onArtifactAdded, onArtifactCreated, onReconcileOptimistic, onErrorOptimistic, scheduleDismiss, clearDismissTimer]);

  const handleImpressionSubmit = async () => {
    if (!pill?.id || !pill.impressionText.trim()) {
      setPill(null);
      return;
    }

    const artifactId = pill.id;
    const impression = pill.impressionText.trim();
    clearDismissTimer();
    setPill(null);

    try {
      const res = await fetch('/api/artifacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: artifactId,
          quick_impression: impression,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onArtifactUpdated?.(updated);
      }
    } catch (err) {
      console.warn('Failed to save impression note:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleImpressionSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clearDismissTimer();
      setPill(null);
    }
  };

  if (!pill) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="flex items-center gap-2.5 rounded-full border border-[#C86243]/40 bg-[#FAF8F4]/95 px-4 py-2 text-xs text-[#241E1A] shadow-[0_8px_30px_rgba(36,30,26,0.12)] backdrop-blur-md dark:border-[#E07A2B]/40 dark:bg-[#1C1815]/95 dark:text-[#EDE6DC] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
        {pill.isIngesting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C86243] dark:text-[#E07A2B]" />
            <span className="font-medium text-[#241E1A] dark:text-[#EDE6DC]">{pill.message}</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 text-[#C86243] dark:text-[#D4AF37] shrink-0" />
            <span className="font-medium text-[#241E1A] dark:text-[#EDE6DC] hidden sm:inline">
              {pill.message}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={pill.impressionText}
              onFocus={clearDismissTimer}
              onChange={(e) =>
                setPill((prev) => (prev ? { ...prev, impressionText: e.target.value } : null))
              }
              onKeyDown={handleKeyDown}
              placeholder="Add thought... (Enter to save, Esc to dismiss)"
              className="w-48 sm:w-64 rounded-full border border-[#E3DACD] bg-[#EFE9DF] px-3 py-1 text-xs text-[#241E1A] placeholder-[#6A5F56]/60 focus:border-[#C6A664] focus:outline-none dark:border-[#2D2621] dark:bg-[#131110] dark:text-[#EDE6DC] dark:placeholder-[#A69B8D]/60 dark:focus:border-[#B89352]"
            />
            {pill.impressionText.trim() && (
              <button
                onClick={handleImpressionSubmit}
                className="rounded-full bg-[#C86243]/15 p-1 text-[#C86243] hover:bg-[#C86243]/25 dark:bg-[#E07A2B]/20 dark:text-[#E07A2B] transition-all"
                title="Save note"
              >
                <Check className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => {
                clearDismissTimer();
                setPill(null);
              }}
              className="rounded-full p-1 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#EDE6DC] transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
