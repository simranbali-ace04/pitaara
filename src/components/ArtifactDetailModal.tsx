'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Heart,
  Trash2,
  Calendar,
  Sparkles,
  Save,
  Globe,
  Quote,
  Code2,
  Star,
} from 'lucide-react';
import { GithubIcon, TwitterIcon } from '@/components/Icons';
import type { Artifact } from '@/types/artifact';
import { playDropSound, playDrawerSound } from '@/lib/sound';

interface ArtifactDetailModalProps {
  artifact: Artifact | null;
  onClose: () => void;
  onUpdate: (updated: Artifact) => void;
  onDelete: (id: string) => void;
}

export function ArtifactDetailModal({
  artifact,
  onClose,
  onUpdate,
  onDelete,
}: ArtifactDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [impression, setImpression] = useState(artifact?.quick_impression || '');
  const [isSavingImpression, setIsSavingImpression] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync impression when artifact changes
  React.useEffect(() => {
    if (artifact) {
      setImpression(artifact.quick_impression || '');
    }
  }, [artifact]);

  if (!artifact) return null;

  const dominant = artifact.dominant_color || '#C6A664';
  const metadata = (artifact.metadata || {}) as Record<string, unknown>;

  const handleCopy = () => {
    const textToCopy =
      artifact.raw_url ||
      artifact.raw_content ||
      artifact.media_url ||
      artifact.title ||
      '';
    navigator.clipboard.writeText(textToCopy);
    playDrawerSound();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/artifacts?id=${artifact.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      if (onDelete) {
        onDelete(artifact.id);
      }
      onClose();
    } catch (err) {
      console.error('Failed to delete artifact:', err);
      alert('Could not delete artifact from database. Check console.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveImpression = async () => {
    setIsSavingImpression(true);
    try {
      const res = await fetch('/api/artifacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: artifact.id,
          quick_impression: impression.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        playDropSound();
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to update impression:', err);
    } finally {
      setIsSavingImpression(false);
    }
  };

  const handleFavoriteToggle = async () => {
    playDrawerSound();
    const nextFav = !artifact.is_favorite;
    onUpdate({ ...artifact, is_favorite: nextFav });
    try {
      await fetch('/api/artifacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: artifact.id, is_favorite: nextFav }),
      });
    } catch (err) {
      console.error('Favorite update error:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E3DACD] bg-[#FAF8F4] text-[#241E1A] shadow-2xl dark:border-[#2D2621] dark:bg-[#1C1815] dark:text-[#EDE6DC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Actions Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E3DACD] bg-[#FAF8F4]/90 px-6 py-4 backdrop-blur-md dark:border-[#2D2621] dark:bg-[#1C1815]/90">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full ring-2 ring-black/10 dark:ring-white/10"
              style={{ backgroundColor: dominant }}
            />
            <span className="font-mono text-xs uppercase tracking-wider text-[#6A5F56] dark:text-[#A69B8D]">
              {artifact.type.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFavoriteToggle}
              className={`rounded-lg p-2 transition-colors ${
                artifact.is_favorite
                  ? 'text-[#C86243] dark:text-[#E07A2B]'
                  : 'text-[#6A5F56] hover:text-[#C6A664] dark:text-[#A69B8D] dark:hover:text-[#D4AF37]'
              }`}
              title="Toggle Favorite"
            >
              <Heart className={`h-4 w-4 ${artifact.is_favorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleCopy}
              className="rounded-lg p-2 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#EDE6DC] transition-colors"
              title="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>

            {artifact.raw_url && (
              <a
                href={artifact.raw_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#EDE6DC] transition-colors"
                title="Open Source"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg p-2 text-[#6A5F56] hover:bg-rose-500/10 hover:text-rose-600 dark:text-[#A69B8D] dark:hover:text-rose-400 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="ml-2 rounded-lg p-2 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#EDE6DC] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Title & Site */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {artifact.favicon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artifact.favicon_url}
                  alt=""
                  className="h-4 w-4 rounded-sm object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : artifact.type === 'github_repo' ? (
                <GithubIcon className="h-4 w-4 text-[#241E1A] dark:text-[#EDE6DC]" />
              ) : artifact.type === 'tweet' ? (
                <TwitterIcon className="h-4 w-4 text-[#2B5B75] dark:text-[#76A8C8]" />
              ) : artifact.type === 'quote' ? (
                <Quote className="h-4 w-4 text-[#C86243] dark:text-[#E07A2B]" />
              ) : artifact.type === 'code_snippet' ? (
                <Code2 className="h-4 w-4 text-[#C86243] dark:text-[#D4AF37]" />
              ) : (
                <Globe className="h-4 w-4 text-[#6A5F56] dark:text-[#A69B8D]" />
              )}
              <span className="text-xs font-medium text-[#6A5F56] dark:text-[#A69B8D]">
                {artifact.site_name || 'Pitaara Artifact'}
              </span>
            </div>

            <h2 className="font-serif text-xl font-bold leading-tight text-[#241E1A] dark:text-[#EDE6DC]">
              {artifact.title}
            </h2>
          </div>

          {/* Media / Preview image if present */}
          {artifact.media_url && (
            <div className="overflow-hidden rounded-xl border border-[#E3DACD] bg-black/5 dark:border-[#2D2621] dark:bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artifact.media_url}
                alt={artifact.title || 'Artifact Media'}
                className="w-full max-h-[420px] object-contain"
              />
            </div>
          )}

          {/* GitHub Stats */}
          {artifact.type === 'github_repo' && metadata.stars !== undefined && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E3DACD] bg-[#EFE9DF]/60 p-3 text-xs dark:border-[#2D2621] dark:bg-[#26211C]/60">
              <span className="flex items-center gap-1 font-mono font-medium text-[#C86243] dark:text-[#D4AF37]">
                <Star className="h-3.5 w-3.5 fill-current" />
                {Number(metadata.stars).toLocaleString()} Stars
              </span>
              {Boolean(metadata.language) && (
                <span className="flex items-center gap-1.5 font-mono text-[#6A5F56] dark:text-[#A69B8D]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dominant }} />
                  {String(metadata.language)}
                </span>
              )}
              {Boolean(metadata.forks) && (
                <span className="font-mono text-[#6A5F56] dark:text-[#A69B8D]">
                  {Number(metadata.forks).toLocaleString()} Forks
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {artifact.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A5F56] dark:text-[#A69B8D] mb-1.5">
                Summary & Context
              </h4>
              <p className="text-sm leading-relaxed text-[#453F39] dark:text-[#D8CEBF]">
                {artifact.description}
              </p>
            </div>
          )}

          {/* Raw Content (Code snippet or Quote) */}
          {artifact.raw_content && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A5F56] dark:text-[#A69B8D] mb-1.5">
                {artifact.type === 'code_snippet' ? 'Code Content' : 'Raw Content'}
              </h4>
              <div className="rounded-xl border border-[#E3DACD] bg-white p-4 font-mono text-xs text-[#241E1A] dark:border-[#2D2621] dark:bg-[#151210] dark:text-[#EDE6DC] overflow-x-auto">
                <pre className="whitespace-pre-wrap">{artifact.raw_content}</pre>
              </div>
            </div>
          )}

          {/* Keepsake Thought / Impression (Editable) */}
          <div className="rounded-xl border border-[#E3DACD] bg-[#FAF8F4] p-4 dark:border-[#2D2621] dark:bg-[#151210]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#241E1A] dark:text-[#EDE6DC]">
                <Sparkles className="h-3.5 w-3.5 text-[#C86243] dark:text-[#E07A2B]" />
                <span>Keepsake Thought / Note</span>
              </div>
              {saveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Saved
                </span>
              )}
            </div>

            <textarea
              rows={2}
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              placeholder="Why this was saved, takeaways, impressions..."
              className="w-full rounded-lg border border-[#E3DACD] bg-white p-2.5 text-xs text-[#241E1A] placeholder-[#6A5F56]/60 focus:border-[#C6A664] focus:outline-none focus:ring-1 focus:ring-[#C6A664] dark:border-[#2D2621] dark:bg-[#131110] dark:text-[#EDE6DC] dark:placeholder-[#A69B8D]/60 dark:focus:border-[#B89352] dark:focus:ring-[#B89352]"
            />

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveImpression}
                disabled={isSavingImpression}
                className="flex items-center gap-1.5 rounded-lg bg-[#241E1A] px-3 py-1.5 text-xs font-semibold text-[#F7F3EB] shadow-sm hover:bg-[#38312B] transition-all disabled:opacity-50 dark:bg-[#D4AF37] dark:text-[#131110] dark:hover:bg-[#E6C35C]"
              >
                <Save className="h-3 w-3" />
                <span>{isSavingImpression ? 'Saving...' : 'Update Note'}</span>
              </button>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E3DACD] pt-4 text-xs text-[#6A5F56] dark:border-[#2D2621] dark:text-[#A69B8D]">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created {new Date(artifact.created_at).toLocaleString()}</span>
            </div>

            {artifact.dominant_color && (
              <div className="flex items-center gap-2">
                <span>Color Accent:</span>
                <span
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                  style={{ backgroundColor: artifact.dominant_color }}
                />
                <span className="font-mono">{artifact.dominant_color}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

