'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Hourglass,
  Waves,
  Sparkles,
  Shuffle,
  ExternalLink,
  ArrowRight,
  Loader2,
  Inbox,
  Globe,
  Quote,
  Code2,
  Calendar,
} from 'lucide-react';
import { GithubIcon, TwitterIcon } from '@/components/Icons';
import { playDrawerSound, playDropSound } from '@/lib/sound';
import type { Artifact } from '@/types/artifact';
import type { RediscoveredPick } from '@/app/api/artifacts/reach-in/route';

interface ReachInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArtifact?: (artifact: Artifact) => void;
}

export function ReachInDrawer({ isOpen, onClose, onSelectArtifact }: ReachInDrawerProps) {
  const [picks, setPicks] = useState<RediscoveredPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPicks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/artifacts/reach-in', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to draw keepsakes (Status ${res.status})`);
      }
      const data = await res.json();
      setPicks(data.picks || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reaching into vault';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch picks when drawer is opened
  useEffect(() => {
    if (isOpen) {
      fetchPicks();
    }
  }, [isOpen, fetchPicks]);

  // Handle Escape key to dismiss drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        playDrawerSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleShuffle = () => {
    playDropSound();
    fetchPicks();
  };

  const handleClose = () => {
    playDrawerSound();
    onClose();
  };

  const handlePickClick = (artifact: Artifact) => {
    playDrawerSound();
    onSelectArtifact?.(artifact);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative flex h-full w-full max-w-md sm:max-w-lg flex-col overflow-hidden border-l bg-[#FAF8F4] border-[#E3DACD] text-[#241E1A] shadow-2xl dark:bg-[#181412] dark:border-[#2D2621] dark:text-[#EDE6DC] animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Antique Brass Top Drawer Rail */}
        <div className="h-1.5 w-full bg-[#C6A664] dark:bg-[#D4AF37]" />

        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-[#E3DACD] px-6 py-5 dark:border-[#2D2621]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {/* Antique Key Latch Icon */}
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#C6A664] bg-[#FAF8F4] text-[#C86243] shadow-xs dark:border-[#B89352] dark:bg-[#1C1815] dark:text-[#D4AF37]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="7.5" cy="15.5" r="5.5" />
                  <path d="m21 2-9.6 9.6" />
                  <path d="m15.5 7.5 3 3" />
                </svg>
              </div>
              <h2 className="font-serif text-xl font-bold tracking-tight text-[#241E1A] dark:text-[#EDE6DC]">
                Reach In
              </h2>
            </div>
            <p className="font-sans text-xs text-[#6A5F56] dark:text-[#A69B8D] leading-relaxed">
              Three serendipitous keepsakes drawn from your Pitaara.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Draw Again / Shuffle Button */}
            <button
              onClick={handleShuffle}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-[#E3DACD] bg-[#EFE9DF] px-3 py-1.5 text-xs font-medium text-[#6A5F56] hover:border-[#C6A664] hover:text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352] dark:hover:text-[#EDE6DC] transition-all disabled:opacity-50"
              title="Shuffle / Draw Again"
            >
              <Shuffle className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Shuffle</span>
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="rounded-xl border border-transparent p-2 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#EDE6DC] transition-colors"
              title="Close drawer (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-[#6A5F56] dark:text-[#A69B8D]">
              <Loader2 className="h-6 w-6 animate-spin text-[#C86243] dark:text-[#D4AF37]" />
              <p className="font-serif text-xs">Reaching deep into the chest...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
              <p className="font-medium">{error}</p>
              <button
                onClick={fetchPicks}
                className="mt-2 font-semibold underline underline-offset-2 hover:opacity-80"
              >
                Try drawing again
              </button>
            </div>
          ) : picks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3DACD] bg-[#FAF8F4]/50 py-16 px-4 text-center dark:border-[#2D2621] dark:bg-[#1C1815]/30">
              <Inbox className="h-8 w-8 text-[#6A5F56] mb-3 dark:text-[#A69B8D]" />
              <h3 className="font-serif text-sm font-semibold text-[#241E1A] dark:text-[#EDE6DC]">
                Vault feels empty
              </h3>
              <p className="text-xs text-[#6A5F56] dark:text-[#A69B8D] mt-1 max-w-xs">
                Save a few bookmarks, images, or quotes to let Pitaara draw serendipitous treasures for you.
              </p>
            </div>
          ) : (
            picks.map((pick, index) => {
              const { artifact, badge_type, badge_label, badge_sub, resonance_note } = pick;
              const dominant = artifact.dominant_color || '#C6A664';

              return (
                <div
                  key={`${artifact.id}-${index}`}
                  onClick={() => handlePickClick(artifact)}
                  className="group relative rounded-2xl border border-[#E3DACD] bg-white p-4 text-[#241E1A] shadow-[0_2px_12px_-4px_rgba(36,30,26,0.06)] hover:border-[#C6A664] hover:shadow-md transition-all duration-200 cursor-pointer dark:border-[#2D2621] dark:bg-[#1C1815] dark:text-[#EDE6DC] dark:hover:border-[#B89352]"
                >
                  {/* Heirloom Persona Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {badge_type === 'purani_khoj' && (
                        <span className="flex items-center gap-1.5 rounded-full border border-[#C86243]/30 bg-[#C86243]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#C86243] dark:border-[#E07A2B]/30 dark:bg-[#E07A2B]/15 dark:text-[#E07A2B]">
                          <Hourglass className="h-3 w-3" />
                          <span className="font-serif">{badge_label}</span>
                          <span className="opacity-60 text-[10px]">· {badge_sub}</span>
                        </span>
                      )}

                      {badge_type === 'tarang' && (
                        <span className="flex items-center gap-1.5 rounded-full border border-[#2B5B75]/30 bg-[#2B5B75]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#2B5B75] dark:border-[#76A8C8]/30 dark:bg-[#76A8C8]/15 dark:text-[#76A8C8]">
                          <Waves className="h-3 w-3" />
                          <span className="font-serif">{badge_label}</span>
                          <span className="opacity-60 text-[10px]">· {badge_sub}</span>
                        </span>
                      )}

                      {badge_type === 'anokha_tukda' && (
                        <span className="flex items-center gap-1.5 rounded-full border border-[#C6A664]/40 bg-[#C6A664]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#8E6E28] dark:border-[#D4AF37]/30 dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]">
                          <Sparkles className="h-3 w-3" />
                          <span className="font-serif">{badge_label}</span>
                          <span className="opacity-60 text-[10px]">· {badge_sub}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6A5F56] dark:text-[#A69B8D] uppercase tracking-wider">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dominant }} />
                      <span>{artifact.type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Serendipity Note */}
                  {resonance_note && (
                    <p className="mb-2 text-[11px] italic text-[#6A5F56] dark:text-[#A69B8D] leading-snug">
                      “{resonance_note}”
                    </p>
                  )}

                  {/* Card Media Preview if present */}
                  {artifact.media_url && (
                    <div className="relative mb-3 overflow-hidden rounded-xl border border-[#E3DACD] bg-[#FAF8F4] dark:border-[#2D2621] dark:bg-[#151210] max-h-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={artifact.media_url}
                        alt={artifact.title || 'Preview'}
                        className="w-full object-cover max-h-36 transition-transform duration-300 group-hover:scale-[1.01]"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Card Title & Content */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {artifact.favicon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={artifact.favicon_url}
                          alt=""
                          className="h-3.5 w-3.5 rounded-sm object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : artifact.type === 'github_repo' ? (
                        <GithubIcon className="h-3.5 w-3.5 text-[#241E1A] dark:text-[#EDE6DC]" />
                      ) : artifact.type === 'tweet' ? (
                        <TwitterIcon className="h-3.5 w-3.5 text-[#2B5B75] dark:text-[#76A8C8]" />
                      ) : artifact.type === 'quote' ? (
                        <Quote className="h-3.5 w-3.5 text-[#C86243] dark:text-[#E07A2B]" />
                      ) : artifact.type === 'code_snippet' ? (
                        <Code2 className="h-3.5 w-3.5 text-[#C86243] dark:text-[#D4AF37]" />
                      ) : (
                        <Globe className="h-3.5 w-3.5 text-[#6A5F56] dark:text-[#A69B8D]" />
                      )}
                      <span className="text-[11px] font-medium text-[#6A5F56] dark:text-[#A69B8D] truncate">
                        {artifact.site_name ||
                          (artifact.raw_url ? new URL(artifact.raw_url).hostname : 'Pitaara')}
                      </span>
                    </div>

                    <h4 className="font-serif text-sm font-semibold leading-snug text-[#241E1A] dark:text-[#EDE6DC] line-clamp-2">
                      {artifact.title || artifact.raw_content || 'Untitled Keepsake'}
                    </h4>

                    {artifact.description && (
                      <p className="text-xs text-[#6A5F56] dark:text-[#A69B8D] line-clamp-2 leading-relaxed">
                        {artifact.description}
                      </p>
                    )}
                  </div>

                  {/* Keepsake Quick Impression Note if set */}
                  {artifact.quick_impression && (
                    <div className="mt-2.5 rounded-lg border-l-2 border-[#C86243] bg-[#F4EFEA] px-2.5 py-1.5 text-[11px] font-medium text-[#453F39] dark:border-[#E07A2B] dark:bg-[#241E19] dark:text-[#D8CEBF]">
                      {artifact.quick_impression}
                    </div>
                  )}

                  {/* Footer & Action Link */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-[#E3DACD]/80 dark:border-[#2D2621]/80 pt-2.5 text-[10px] text-[#6A5F56] dark:text-[#A69B8D]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(artifact.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    <div className="flex items-center gap-2">
                      {artifact.raw_url && (
                        <a
                          href={artifact.raw_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="rounded p-1 text-[#6A5F56] hover:text-[#C6A664] dark:text-[#A69B8D] dark:hover:text-[#D4AF37]"
                          title="Open original source"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-[#C86243] group-hover:translate-x-0.5 transition-transform dark:text-[#D4AF37]">
                        Open Keep
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Bottom Bar */}
        <div className="border-t border-[#E3DACD] bg-[#FAF8F4] px-6 py-3 text-center text-xs text-[#6A5F56] dark:border-[#2D2621] dark:bg-[#181412] dark:text-[#A69B8D]">
          <span className="font-mono text-[11px]">
            Tip: Press <kbd className="rounded border border-[#E3DACD] bg-[#EFE9DF] px-1 py-0.5 dark:border-[#2D2621] dark:bg-[#26211C]">R</kbd> anytime on canvas to Reach In
          </span>
        </div>
      </div>
    </div>
  );
}
