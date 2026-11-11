'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Star,
  ExternalLink,
  Copy,
  Check,
  Heart,
  Trash2,
  Quote,
  Code2,
  Globe,
  Sparkles,
  Play,
} from 'lucide-react';
import { GithubIcon, TwitterIcon } from '@/components/Icons';
import type { Artifact } from '@/types/artifact';
import { playDrawerSound } from '@/lib/sound';
import { getArtifactCategory } from '@/lib/categorizer';

interface ArtifactCardProps {
  artifact: Artifact;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string, nextFav: boolean) => void;
  onSelect?: (artifact: Artifact) => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function ArtifactCard({ artifact, onDelete, onToggleFavorite, onSelect }: ArtifactCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dominant = artifact.dominant_color || '#C6A664';
  const timeString = formatRelativeTime(artifact.created_at);
  const isVideo = getArtifactCategory(artifact) === 'videos';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playDrawerSound();
    onToggleFavorite?.(artifact.id, !artifact.is_favorite);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

      // Only notify parent to remove from local state AFTER the backend responds 200/OK
      if (onDelete) {
        onDelete(artifact.id);
      }
    } catch (err) {
      console.error('Failed to delete artifact:', err);
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const metadata = (artifact.metadata || {}) as Record<string, unknown>;

  return (
    <article
      onClick={() => onSelect?.(artifact)}
      className="group relative break-inside-avoid overflow-hidden rounded-2xl bg-white dark:bg-[#1C1815] border border-[#E3DACD] dark:border-[#2D2621] hover:border-[#C6A664] dark:hover:border-[#B89352] text-[#241E1A] dark:text-[#EDE6DC] transition-all duration-300 ease-out shadow-[0_2px_12px_-4px_rgba(36,30,26,0.06)] dark:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.5)] p-4 hover:-translate-y-1 hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-bottom-2"
    >
      {/* Top Keepsake Note (Quick Impression) - Clean modern sans-serif with terracotta/saffron indicator bar */}
      {artifact.quick_impression && (
        <div className="mb-3 rounded-r-xl border-l-2 border-[#C86243] bg-[#F4EFEA] px-3 py-2 text-xs font-medium text-[#453F39] dark:border-[#E07A2B] dark:bg-[#241E19] dark:text-[#D8CEBF]">
          <div className="flex items-start gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#C86243] dark:text-[#E07A2B] shrink-0 mt-0.5" />
            <p className="leading-relaxed tracking-normal">{artifact.quick_impression}</p>
          </div>
        </div>
      )}

      {/* GitHub Repo Layout */}
      {artifact.type === 'github_repo' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#241E1A] dark:text-[#EDE6DC]">
              <GithubIcon className="h-4 w-4 text-[#241E1A] dark:text-[#EDE6DC]" />
              <span className="font-mono text-xs font-semibold truncate">
                {artifact.title}
              </span>
            </div>
            {metadata.stars !== undefined && (
              <span className="flex items-center gap-1 rounded-full border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 text-[10px] font-mono font-medium text-[#C86243] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#D4AF37]">
                <Star className="h-2.5 w-2.5 fill-current" />
                {Number(metadata.stars).toLocaleString()}
              </span>
            )}
          </div>

          {artifact.description && (
            <p className="text-xs text-[#6A5F56] dark:text-[#A69B8D] leading-relaxed line-clamp-3">
              {artifact.description}
            </p>
          )}

          {Boolean(metadata.language) && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6A5F56] dark:text-[#A69B8D]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dominant }} />
              <span>{String(metadata.language)}</span>
            </div>
          )}
        </div>
      )}

      {/* Image Layout */}
      {artifact.type === 'image' && (
        <div className="space-y-2.5">
          {artifact.media_url && (
            <div className="relative w-full aspect-[4/3] max-h-72 overflow-hidden rounded-xl border border-[#E3DACD] bg-[#FAF8F4] dark:border-[#2D2621] dark:bg-[#151210] flex items-center justify-center">
              <Image
                src={artifact.media_url}
                alt={artifact.title || 'Artifact Image'}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-[#241E1A] dark:text-[#EDE6DC] truncate">
              {artifact.title || 'Image'}
            </span>
            {artifact.dominant_color && (
              <div
                className="flex items-center gap-1.5 rounded-full border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 text-[10px] font-mono text-[#6A5F56] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A69B8D]"
                title={`Dominant color: ${artifact.dominant_color}`}
              >
                <span
                  className="h-2 w-2 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                  style={{ backgroundColor: artifact.dominant_color }}
                />
                <span>{artifact.dominant_color}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quote Layout */}
      {artifact.type === 'quote' && (
        <div className="relative rounded-xl border border-[#E3DACD] bg-[#FAF8F4] p-4 space-y-2.5 dark:border-[#2D2621] dark:bg-[#151210]">
          <Quote className="h-5 w-5 text-[#C86243] dark:text-[#E07A2B] opacity-80" />
          <blockquote className="font-serif text-sm leading-relaxed text-[#241E1A] dark:text-[#EDE6DC]">
            {artifact.raw_content || artifact.title}
          </blockquote>
          {artifact.author && (
            <p className="text-right text-xs font-sans font-medium text-[#6A5F56] dark:text-[#A69B8D]">
              — {artifact.author}
            </p>
          )}
        </div>
      )}

      {/* Code Snippet Layout */}
      {artifact.type === 'code_snippet' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#6A5F56] dark:text-[#A69B8D]">
            <span className="flex items-center gap-1.5 font-mono text-[#241E1A] dark:text-[#EDE6DC]">
              <Code2 className="h-3.5 w-3.5 text-[#C86243] dark:text-[#D4AF37]" />
              {artifact.title || 'Snippet'}
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#E3DACD] bg-[#FAF8F4] p-3 text-[11px] font-mono text-[#241E1A] dark:border-[#2D2621] dark:bg-[#151210] dark:text-[#EDE6DC]">
            <pre className="whitespace-pre-wrap">{artifact.raw_content}</pre>
          </div>
        </div>
      )}

      {/* Tweet Layout */}
      {artifact.type === 'tweet' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#2B5B75] dark:text-[#76A8C8] text-xs font-medium">
            <TwitterIcon className="h-3.5 w-3.5 fill-current" />
            <span>Tweet</span>
          </div>
          <p className="text-xs text-[#241E1A] dark:text-[#EDE6DC] leading-relaxed whitespace-pre-wrap">
            {artifact.raw_content || artifact.description || artifact.title}
          </p>
        </div>
      )}

      {/* Standard URL Layout */}
      {artifact.type === 'url' && (
        <div className="space-y-2.5">
          {artifact.media_url && (
            <div className="relative w-full aspect-video max-h-60 overflow-hidden rounded-xl border border-[#E3DACD] bg-[#FAF8F4] dark:border-[#2D2621] dark:bg-[#151210] group/media">
              <Image
                src={artifact.media_url}
                alt={artifact.title || 'Preview'}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/media:bg-black/35 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#241E1A] shadow-md backdrop-blur-xs group-hover/media:scale-110 transition-transform dark:bg-[#1C1815]/90 dark:text-[#EDE6DC]">
                    <Play className="h-4 w-4 fill-current ml-0.5 text-[#C86243] dark:text-[#D4AF37]" />
                  </div>
                </div>
              )}
            </div>
          )}

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
            ) : (
              <Globe className="h-3.5 w-3.5 text-[#6A5F56] dark:text-[#A69B8D]" />
            )}
            <span className="text-[11px] font-medium text-[#6A5F56] dark:text-[#A69B8D] truncate">
              {artifact.site_name ||
                (artifact.raw_url ? new URL(artifact.raw_url).hostname : 'Web Link')}
            </span>
          </div>

          <h3 className="text-xs font-semibold leading-snug text-[#241E1A] dark:text-[#EDE6DC] line-clamp-2">
            {artifact.title}
          </h3>

          {artifact.description && (
            <p className="text-[11px] text-[#6A5F56] dark:text-[#A69B8D] line-clamp-2 leading-relaxed">
              {artifact.description}
            </p>
          )}
        </div>
      )}

      {/* Footer & Actions */}
      <div className="mt-3.5 flex items-center justify-between border-t border-[#E3DACD]/80 dark:border-[#2D2621]/80 pt-2.5 text-[10px] text-[#6A5F56] dark:text-[#A69B8D]">
        <span>{timeString}</span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Favorite Toggle */}
          <button
            onClick={handleFavoriteClick}
            className={`rounded-lg p-1.5 transition-colors ${
              artifact.is_favorite
                ? 'text-[#C86243] dark:text-[#E07A2B]'
                : 'text-[#6A5F56] hover:text-[#C6A664] dark:text-[#A69B8D] dark:hover:text-[#D4AF37]'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`h-3.5 w-3.5 ${artifact.is_favorite ? 'fill-current' : ''}`} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="rounded-lg p-1.5 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#C6A664] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#D4AF37] transition-colors"
            title="Copy URL / Content"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>

          {/* External Link */}
          {artifact.raw_url && (
            <a
              href={artifact.raw_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#C6A664] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#D4AF37] transition-colors"
              title="Open source"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {/* Delete Button / Inline Confirmation */}
          {confirmDelete ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-lg border border-[#C86243]/30 bg-[#F4EFEA] px-2 py-0.5 text-[11px] font-medium text-[#C86243] dark:border-[#E07A2B]/40 dark:bg-[#26211C] dark:text-[#E07A2B] animate-in fade-in duration-150"
            >
              <span>Remove?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="font-bold underline hover:text-[#B35235] dark:hover:text-[#F39C4E] disabled:opacity-50"
              >
                {isDeleting ? '...' : 'Yes'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(false);
                }}
                className="text-[#6A5F56] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:text-[#EDE6DC]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playDrawerSound();
                setConfirmDelete(true);
              }}
              className="rounded-lg p-1.5 text-[#6A5F56] hover:bg-rose-500/10 hover:text-rose-600 dark:text-[#A69B8D] dark:hover:text-rose-400 transition-colors"
              title="Delete keepsake"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
