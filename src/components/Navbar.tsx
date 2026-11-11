'use client';

import React from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Globe,
  Image as ImageIcon,
  Quote,
  Code2,
  Heart,
  Layers,
} from 'lucide-react';
import { GithubIcon, TwitterIcon } from '@/components/Icons';
import type { ArtifactType } from '@/types/artifact';

interface NavbarProps {
  activeType: ArtifactType | 'all';
  onSelectType: (type: ArtifactType | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  onOpenCaptureModal: () => void;
  counts: Record<string, number>;
}

const typeFilters: { type: ArtifactType | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'all', label: 'All Artifacts', icon: Layers },
  { type: 'url', label: 'Links', icon: Globe },
  { type: 'github_repo', label: 'GitHub', icon: GithubIcon },
  { type: 'image', label: 'Images', icon: ImageIcon },
  { type: 'quote', label: 'Quotes', icon: Quote },
  { type: 'code_snippet', label: 'Code', icon: Code2 },
  { type: 'tweet', label: 'Tweets', icon: TwitterIcon },
];

export function Navbar({
  activeType,
  onSelectType,
  searchQuery,
  onSearchChange,
  showFavoritesOnly,
  onToggleFavorites,
  onOpenCaptureModal,
  counts,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6A664] text-[#201A16] dark:bg-[#D4AF37] dark:text-[#13100E]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#201A16] dark:text-[#ECE4D8]">Pitaara</span>
              <span className="rounded-full bg-[#EFE9DF] px-2 py-0.5 text-[10px] font-semibold text-[#6A5F56] border border-[#DDD4C5] dark:bg-[#26211C] dark:text-[#A69B8D] dark:border-[#2A221C]">
                Treasury
              </span>
            </div>
            <p className="hidden text-xs text-[#6A5F56] dark:text-[#A69B8D] sm:block">Digital Artifact Vault</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search artifacts, impressions, tags..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorites}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
              showFavoritesOnly
                ? 'border-rose-500 bg-rose-500/10 text-rose-400 shadow-sm shadow-rose-500/10'
                : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
            title="Filter Favorites"
          >
            <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
          </button>

          <button
            onClick={onOpenCaptureModal}
            className="flex items-center gap-2 rounded-xl bg-[#201A16] text-[#F9F6F0] px-4 py-2 text-sm font-semibold transition-all hover:bg-[#38302A] active:scale-95 dark:bg-[#D4AF37] dark:text-[#13100E] dark:hover:bg-[#E5C252]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Artifact</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 pb-3 sm:px-6 scrollbar-none">
        {typeFilters.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.type;
          const count = counts[tab.type] ?? 0;

          return (
            <button
              key={tab.type}
              onClick={() => onSelectType(tab.type)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-zinc-300 text-zinc-900' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}

