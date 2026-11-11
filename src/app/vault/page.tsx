'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Image as ImageIcon,
  Video,
  BookOpen,
  Code2,
  Plus,
  Loader2,
  Search,
  Inbox,
  Puzzle,
  X,
  Heart,
  Download,
  HelpCircle,
  Command,
  Calendar,
  ArrowUpDown,
  LogOut,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { GlobalPasteListener } from '@/components/GlobalPasteListener';
import { ArtifactCard } from '@/components/ArtifactCard';
import { CaptureModal } from '@/components/CaptureModal';
import { ArtifactDetailModal } from '@/components/ArtifactDetailModal';
import { ReachInDrawer } from '@/components/ReachInDrawer';
import { AuthModal } from '@/components/AuthModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { playDrawerSound, playDropSound } from '@/lib/sound';
import { getArtifactCategory } from '@/lib/categorizer';
import type { Artifact } from '@/types/artifact';

type FilterCategory = 'all' | 'visuals' | 'videos' | 'reads' | 'code' | 'favorites';
type SortOption = 'date-desc' | 'date-asc' | 'alpha-asc' | 'alpha-desc';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReachInOpen, setIsReachInOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const ARTIFACT_SELECT_FIELDS =
    'id, created_at, updated_at, user_id, type, title, description, raw_url, raw_content, quick_impression, dominant_color, media_url, favicon_url, site_name, author, is_favorite, view_count, last_rediscovered_at';

  // Fetch artifacts from Supabase scoped to the authenticated user with fast 24-item initial paint
  const fetchArtifacts = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      setArtifacts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fast initial paint: Load latest 24 artifacts first for <400ms time-to-render
      const { data, error } = await supabase
        .from('artifacts')
        .select(ARTIFACT_SELECT_FIELDS)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) {
        console.warn('Error fetching artifacts from Supabase:', error.message);
      } else if (data) {
        setArtifacts(data as Artifact[]);
      }
      setLoading(false);

      // If user has 24 or more items, asynchronously load the remainder in the background
      if (data && data.length >= 24) {
        const { data: fullData } = await supabase
          .from('artifacts')
          .select(ARTIFACT_SELECT_FIELDS)
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (fullData) {
          setArtifacts(fullData as Artifact[]);
        }
      }
    } catch (err) {
      console.warn('Supabase fetch error:', err);
      setLoading(false);
    }
  }, [user?.id]);

  // Verify authentication session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (!user) {
          setIsAuthModalOpen(true);
          setLoading(false);
        } else {
          setUser(user);
          try {
            localStorage.setItem('pitaara_user_id', user.id);
            window.postMessage({ type: 'PITAARA_USER_SYNC', userId: user.id }, '*');
          } catch {}
          setIsAuthModalOpen(false);
          fetchArtifacts(user.id);
        }
      } catch (err) {
        console.warn('Session verification error:', err);
        if (isMounted) {
          setIsAuthModalOpen(true);
          setLoading(false);
        }
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        try {
          localStorage.setItem('pitaara_user_id', session.user.id);
          window.postMessage({ type: 'PITAARA_USER_SYNC', userId: session.user.id }, '*');
        } catch {}
        setIsAuthModalOpen(false);
        fetchArtifacts(session.user.id);
      } else {
        setUser(null);
        try {
          localStorage.removeItem('pitaara_user_id');
        } catch {}
        setArtifacts([]);
        setIsAuthModalOpen(true);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchArtifacts]);

  // Dedicated Supabase Realtime channel subscription for instant auto-updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-artifacts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'artifacts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newArtifact = payload.new as Artifact;
          setArtifacts((prev) => {
            if (prev.some((item) => item.id === newArtifact.id)) {
              return prev;
            }
            return [newArtifact, ...prev];
          });
          try {
            playDropSound();
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'artifacts',
        },
        (payload) => {
          setArtifacts((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'artifacts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setArtifacts((prev) =>
            prev.map((a) => (a.id === payload.new.id ? (payload.new as Artifact) : a))
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime artifacts channel connected for user: ${user.id}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Sign out handler
  const handleSignOut = async () => {
    playDrawerSound();
    try {
      localStorage.removeItem('pitaara_user_id');
    } catch {}
    await supabase.auth.signOut();
    setUser(null);
    setArtifacts([]);
    router.push('/');
    router.refresh();
  };

  // Global hotkeys listener (?, N, /, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        playDrawerSound();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if ((e.key === 'r' || e.key === 'R') && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        playDrawerSound();
        setIsReachInOpen((prev) => !prev);
      } else if ((e.key === 'n' || e.key === 'N') && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        playDrawerSound();
        setIsModalOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsModalOpen(false);
        setIsReachInOpen(false);
        setIsExtensionModalOpen(false);
        setIsShortcutsModalOpen(false);
        setSelectedArtifact(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Direct optimistic dispatch for in-app captures
  const handleArtifactAdded = (newArtifact: Artifact) => {
    setArtifacts((prev) => [newArtifact, ...prev.filter((a) => a.id !== newArtifact.id)]);
  };

  // Reconcile optimistic cards with backend-persisted records
  const handleReconcileOptimistic = (tempId: string, realArtifact: Artifact) => {
    setArtifacts((prev) =>
      prev.map((item) => (item.id === tempId ? realArtifact : item))
    );
  };

  // Rollback optimistic card if save failed
  const handleErrorOptimistic = (tempId: string) => {
    setArtifacts((prev) => prev.filter((item) => item.id !== tempId));
  };

  // Handle updates (e.g. adding quick impression note)
  const handleArtifactUpdated = (updatedArtifact: Artifact) => {
    setArtifacts((prev) =>
      prev.map((item) => (item.id === updatedArtifact.id ? updatedArtifact : item))
    );
    if (selectedArtifact?.id === updatedArtifact.id) {
      setSelectedArtifact(updatedArtifact);
    }
  };

  // Local deletion handler called after backend confirms deletion
  const handleArtifactDeleted = (deletedId: string) => {
    setArtifacts((prev) => prev.filter((item) => item.id !== deletedId));
    if (selectedArtifact?.id === deletedId) {
      setSelectedArtifact(null);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (id: string, nextFav: boolean) => {
    setArtifacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_favorite: nextFav } : a))
    );
    if (selectedArtifact?.id === id) {
      setSelectedArtifact((prev) => (prev ? { ...prev, is_favorite: nextFav } : null));
    }
    try {
      await fetch('/api/artifacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_favorite: nextFav }),
      });
    } catch (err) {
      console.error('Favorite update error:', err);
    }
  };

  const handleCategorySelect = (category: FilterCategory) => {
    playDropSound();
    setActiveCategory(category);
  };

  // Export full vault as JSON backup
  const handleExportVault = () => {
    playDropSound();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(artifacts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pitaara-vault-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const favoriteCount = useMemo(() => {
    return artifacts.filter((a) => a.is_favorite).length;
  }, [artifacts]);

  // Pipeline: Category Filter -> Search Filter -> Month Filter -> Deterministic Sort
  const processedArtifacts = useMemo(() => {
    return artifacts
      // 1. Category Filtering
      .filter((artifact) => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'favorites') return Boolean(artifact.is_favorite);
        return getArtifactCategory(artifact) === activeCategory;
      })
      // 2. Search Query Filtering
      .filter((artifact) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          artifact.title?.toLowerCase().includes(q) ||
          artifact.quick_impression?.toLowerCase().includes(q) ||
          artifact.description?.toLowerCase().includes(q) ||
          artifact.raw_content?.toLowerCase().includes(q) ||
          artifact.site_name?.toLowerCase().includes(q) ||
          artifact.raw_url?.toLowerCase().includes(q)
        );
      })
      // 3. Month/Date Filtering
      .filter((artifact) => {
        if (!selectedMonth) return true; // e.g. "2026-11"
        if (!artifact.created_at) return false;
        if (artifact.created_at.startsWith(selectedMonth)) return true;
        try {
          return new Date(artifact.created_at).toISOString().startsWith(selectedMonth);
        } catch {
          return false;
        }
      })
      // 4. Deterministic Sorting
      .sort((a, b) => {
        if (sortBy === 'alpha-asc') {
          const titleA = (a.title || a.quick_impression || '').toLowerCase();
          const titleB = (b.title || b.quick_impression || '').toLowerCase();
          return titleA.localeCompare(titleB);
        }
        if (sortBy === 'alpha-desc') {
          const titleA = (a.title || a.quick_impression || '').toLowerCase();
          const titleB = (b.title || b.quick_impression || '').toLowerCase();
          return titleB.localeCompare(titleA);
        }
        if (sortBy === 'date-asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        // Default: date-desc (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [artifacts, activeCategory, searchQuery, selectedMonth, sortBy]);

  return (
    <div className="min-h-screen bg-[#F7F3EB] text-[#241E1A] dark:bg-[#131110] dark:text-[#EDE6DC] transition-colors duration-200 selection:bg-[#C86243]/20 selection:text-[#C86243] dark:selection:bg-[#D4AF37]/20 dark:selection:text-[#D4AF37]">
      {/* Global Native Paste Listener & Feedback */}
      <GlobalPasteListener
        onArtifactAdded={handleArtifactAdded}
        onArtifactCreated={handleArtifactAdded}
        onArtifactUpdated={handleArtifactUpdated}
        onReconcileOptimistic={handleReconcileOptimistic}
        onErrorOptimistic={handleErrorOptimistic}
      />

      {/* Main Header */}
      <header className="sticky top-0 z-30 border-b border-[#E3DACD] bg-[#F7F3EB]/90 backdrop-blur-md dark:border-[#2D2621] dark:bg-[#131110]/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {/* Logo & Counter */}
          <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
            {/* Geometric brass latch / chest emblem */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#C6A664] bg-[#FAF8F4] text-[#C86243] shadow-sm dark:border-[#B89352] dark:bg-[#1C1815] dark:text-[#D4AF37]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect x="3" y="8" width="18" height="13" rx="2" />
                <path d="M7 8V5a5 5 0 0 1 10 0v3" />
                <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                <path d="M12 15.5V17" />
              </svg>
              {/* Corner brass studs */}
              <span className="absolute top-1 left-1 h-1 w-1 rounded-full bg-[#C6A664] dark:bg-[#B89352]" />
              <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-[#C6A664] dark:bg-[#B89352]" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-[#241E1A] dark:text-[#EDE6DC]">
                  Pitaara
                </h1>
                <span className="rounded-full border border-[#E3DACD] bg-[#EFE9DF] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#6A5F56] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A69B8D]">
                  {artifacts.length} {artifacts.length === 1 ? 'artifact' : 'artifacts'}
                </span>
              </div>
              <p className="text-xs text-[#6A5F56] dark:text-[#A69B8D]">
                Treasury of keepsakes, code & web discoveries
              </p>
            </div>
          </Link>

          {/* Actions & Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Clipper Helper Button */}
            <button
              onClick={() => {
                playDrawerSound();
                setIsExtensionModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#E3DACD] bg-[#EFE9DF] px-3 py-1.5 text-xs font-medium text-[#6A5F56] hover:border-[#C6A664] hover:text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352] dark:hover:text-[#EDE6DC] transition-all shrink-0"
              title="Browser Clipper Extension (Alt+S)"
            >
              <Puzzle className="h-3.5 w-3.5 text-[#C86243] dark:text-[#D4AF37]" />
              <span className="hidden md:inline">Clipper</span>
            </button>

            {/* Export Vault Button */}
            <button
              onClick={handleExportVault}
              disabled={artifacts.length === 0}
              className="rounded-xl border border-[#E3DACD] bg-[#EFE9DF] p-2 text-[#6A5F56] hover:border-[#C6A664] hover:text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352] dark:hover:text-[#EDE6DC] transition-all disabled:opacity-40"
              title="Export Vault (JSON Backup)"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            {/* Keyboard Shortcuts Dialog Trigger */}
            <button
              onClick={() => {
                playDrawerSound();
                setIsShortcutsModalOpen(true);
              }}
              className="rounded-xl border border-[#E3DACD] bg-[#EFE9DF] p-2 text-[#6A5F56] hover:border-[#C6A664] hover:text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352] dark:hover:text-[#EDE6DC] transition-all"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>

            {/* Reach In (Serendipity Rediscovery Drawer) */}
            <button
              onClick={() => {
                playDrawerSound();
                setIsReachInOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#C6A664] bg-[#FAF8F4] px-3 py-1.5 text-xs font-semibold text-[#241E1A] shadow-xs hover:bg-[#F4EFEA] hover:border-[#B35235] dark:border-[#B89352] dark:bg-[#1C1815] dark:text-[#EDE6DC] dark:hover:bg-[#26211C] transition-all shrink-0"
              title="Reach In - Serendipity Rediscovery (R)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5 text-[#C86243] dark:text-[#D4AF37]"
              >
                <circle cx="7.5" cy="15.5" r="5.5" />
                <path d="m21 2-9.6 9.6" />
                <path d="m15.5 7.5 3 3" />
              </svg>
              <span>Reach In</span>
            </button>

            {/* Add Artifact Button */}
            <button
              onClick={() => {
                playDrawerSound();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#241E1A] px-3.5 py-1.5 text-xs font-semibold text-[#F7F3EB] shadow-sm hover:bg-[#38312B] active:scale-95 transition-all shrink-0 dark:bg-[#D4AF37] dark:text-[#131110] dark:hover:bg-[#E6C35C]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>

            {/* Minimal Tactile Theme Toggle */}
            <ThemeToggle />

            {/* User Keeper Badge & Sign Out */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E3DACD] dark:border-[#2D2621]">
                <div className="hidden xl:flex flex-col text-right leading-none max-w-[140px]">
                  <span className="text-[10px] font-mono text-[#6A5F56] dark:text-[#A89B91] uppercase tracking-wider">Keeper</span>
                  <span className="text-xs font-medium text-[#241E1A] dark:text-[#EDE6DC] truncate" title={user.email || undefined}>
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E3DACD] bg-[#EFE9DF] px-2.5 py-1.5 text-xs font-medium text-[#6A5F56] hover:border-[#A84B2C] hover:text-[#A84B2C] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A89B91] dark:hover:border-[#C5A059] dark:hover:text-[#ECE4D8] transition-all"
                  title="Sign Out of Pitaara"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[#C6A664] bg-[#FAF8F4] px-3 py-1.5 text-xs font-semibold text-[#241E1A] hover:bg-[#F1E9DC] dark:border-[#B89352] dark:bg-[#1C1815] dark:text-[#EDE6DC] transition-all"
              >
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 pb-2.5 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#241E1A] text-[#F7F3EB] shadow-sm font-semibold dark:bg-[#D4AF37] dark:text-[#131110]'
                  : 'border border-transparent bg-[#EFE9DF] text-[#6A5F56] hover:border-[#C6A664]/50 dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352]/50'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>All</span>
            </button>

            <button
              onClick={() => handleCategorySelect('visuals')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeCategory === 'visuals'
                  ? 'bg-[#241E1A] text-[#F7F3EB] shadow-sm font-semibold dark:bg-[#D4AF37] dark:text-[#131110]'
                  : 'border border-transparent bg-[#EFE9DF] text-[#6A5F56] hover:border-[#C6A664]/50 dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352]/50'
              }`}
            >
              <ImageIcon className="h-3 w-3" />
              <span>Visuals</span>
            </button>

            <button
              onClick={() => handleCategorySelect('videos')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeCategory === 'videos'
                  ? 'bg-[#241E1A] text-[#F7F3EB] shadow-sm font-semibold dark:bg-[#D4AF37] dark:text-[#131110]'
                  : 'border border-transparent bg-[#EFE9DF] text-[#6A5F56] hover:border-[#C6A664]/50 dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352]/50'
              }`}
            >
              <Video className="h-3 w-3" />
              <span>Videos</span>
            </button>

            <button
              onClick={() => handleCategorySelect('reads')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeCategory === 'reads'
                  ? 'bg-[#241E1A] text-[#F7F3EB] shadow-sm font-semibold dark:bg-[#D4AF37] dark:text-[#131110]'
                  : 'border border-transparent bg-[#EFE9DF] text-[#6A5F56] hover:border-[#C6A664]/50 dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352]/50'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              <span>Reads</span>
            </button>

            <button
              onClick={() => handleCategorySelect('code')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeCategory === 'code'
                  ? 'bg-[#241E1A] text-[#F7F3EB] shadow-sm font-semibold dark:bg-[#D4AF37] dark:text-[#131110]'
                  : 'border border-transparent bg-[#EFE9DF] text-[#6A5F56] hover:border-[#C6A664]/50 dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#B89352]/50'
              }`}
            >
              <Code2 className="h-3 w-3" />
              <span>Code</span>
            </button>

            {/* Keepsakes (Favorites) Filter Pill */}
            <button
              onClick={() => handleCategorySelect('favorites')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                activeCategory === 'favorites'
                  ? 'bg-[#C86243] text-white shadow-sm font-semibold dark:bg-[#E07A2B]'
                  : 'border border-transparent bg-[#EFE9DF] text-[#6A5F56] hover:border-[#C86243]/40 dark:bg-[#26211C] dark:text-[#A69B8D] dark:hover:border-[#E07A2B]/40'
              }`}
              title="Filter Keepsakes (Favorites)"
            >
              <Heart className={`h-3 w-3 ${activeCategory === 'favorites' ? 'fill-current' : ''}`} />
              <span>Keepsakes</span>
              {favoriteCount > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    activeCategory === 'favorites' ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
                  }`}
                >
                  {favoriteCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dual-Theme Filter & Sort Controls Toolbar */}
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <div className="flex flex-col gap-2.5 rounded-2xl border border-[#E3DACD] bg-[#FAF8F4] p-2.5 text-[#241E1A] shadow-xs dark:border-[#2D2621] dark:bg-[#181412] dark:text-[#EDE6DC] sm:flex-row sm:items-center sm:justify-between">
            {/* 3. Inline Title & Note Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6A5F56] dark:text-[#A69B8D]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Khoj in your Pitaara..."
                className="w-full rounded-xl border border-[#E3DACD] bg-[#FAF8F4] py-1.5 pl-8 pr-8 text-xs text-[#241E1A] placeholder-[#6A5F56]/60 transition-all focus:border-[#C6A664] focus:outline-none focus:ring-1 focus:ring-[#C6A664] dark:border-[#2D2621] dark:bg-[#181412] dark:text-[#EDE6DC] dark:placeholder-[#A69B8D]/60 dark:focus:border-[#B89352] dark:focus:ring-[#B89352]"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    playDropSound();
                    setSearchQuery('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[#6A5F56] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:text-[#EDE6DC]"
                  title="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 2. Temporal Date & Month Filter */}
              <div className="relative flex items-center">
                <Calendar className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#C86243] dark:text-[#D4AF37]" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    playDropSound();
                    setSelectedMonth(e.target.value);
                  }}
                  aria-label="Filter by month"
                  className="h-8 rounded-xl border border-[#E3DACD] bg-[#FAF8F4] pl-8 pr-2 text-xs font-mono text-[#241E1A] transition-all focus:border-[#C6A664] focus:outline-none focus:ring-1 focus:ring-[#C6A664] dark:border-[#2D2621] dark:bg-[#181412] dark:text-[#EDE6DC] dark:focus:border-[#B89352] dark:focus:ring-[#B89352] dark:[color-scheme:dark]"
                />
                {selectedMonth && (
                  <button
                    onClick={() => {
                      playDropSound();
                      setSelectedMonth('');
                    }}
                    className="ml-1.5 flex h-7 items-center gap-1 rounded-lg border border-[#C6A664] bg-[#FAF8F4] px-2 text-[11px] font-medium text-[#C86243] hover:bg-[#F4EFEA] dark:border-[#B89352] dark:bg-[#1C1815] dark:text-[#D4AF37] dark:hover:bg-[#26211C] transition-all"
                    title="Clear date filter"
                  >
                    <span>Clear</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* 1. Sort Order Selector */}
              <div className="relative flex items-center">
                <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#6A5F56] dark:text-[#A69B8D]" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    playDropSound();
                    setSortBy(e.target.value as SortOption);
                  }}
                  aria-label="Sort order"
                  className="h-8 rounded-xl border border-[#E3DACD] bg-[#FAF8F4] pl-8 pr-7 text-xs font-medium text-[#241E1A] transition-all focus:border-[#C6A664] focus:outline-none focus:ring-1 focus:ring-[#C6A664] dark:border-[#2D2621] dark:bg-[#181412] dark:text-[#EDE6DC] dark:focus:border-[#B89352] dark:focus:ring-[#B89352] cursor-pointer appearance-none"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="alpha-asc">Alphabetical A–Z</option>
                  <option value="alpha-desc">Alphabetical Z–A</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 text-[9px] text-[#6A5F56] dark:text-[#A69B8D]">
                  ▼
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Desktop Canvas Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-[#6A5F56] dark:text-[#A69B8D]">
            <Loader2 className="h-6 w-6 animate-spin text-[#C86243] dark:text-[#D4AF37]" />
            <p className="font-serif text-xs">Opening Pitaara vault...</p>
          </div>
        ) : processedArtifacts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
            {processedArtifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                onDelete={handleArtifactDeleted}
                onToggleFavorite={handleToggleFavorite}
                onSelect={(item) => {
                  playDropSound();
                  setSelectedArtifact(item);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3DACD] bg-[#FAF8F4]/50 py-20 px-4 text-center dark:border-[#2D2621] dark:bg-[#1C1815]/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E3DACD] bg-[#EFE9DF] text-[#6A5F56] mb-4 dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#A69B8D]">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-sm font-semibold text-[#241E1A] dark:text-[#EDE6DC]">
              {artifacts.length === 0
                ? 'The vault is empty'
                : searchQuery || selectedMonth
                ? 'No matching keepsakes found'
                : activeCategory === 'favorites'
                ? 'No favorite keepsakes found'
                : `No ${activeCategory} keepsakes found`}
            </h3>
            <p className="text-xs text-[#6A5F56] dark:text-[#A69B8D] mt-1 max-w-sm">
              {artifacts.length === 0
                ? 'Paste any URL, image, or text snippet anywhere on the screen, or click “Add” to store your first keepsake.'
                : searchQuery || selectedMonth
                ? 'Try adjusting your search query, clearing the month filter, or picking another category.'
                : activeCategory === 'favorites'
                ? 'Star any keepsake in your vault to collect it in your favorites.'
                : `Try selecting another category or drop new ${activeCategory} into Pitaara.`}
            </p>
            {(Boolean(searchQuery) || Boolean(selectedMonth) || activeCategory !== 'all') && artifacts.length > 0 && (
              <button
                onClick={() => {
                  playDropSound();
                  setSearchQuery('');
                  setSelectedMonth('');
                  setActiveCategory('all');
                }}
                className="mt-4 rounded-xl border border-[#C6A664] bg-[#FAF8F4] px-3.5 py-1.5 text-xs font-semibold text-[#C86243] hover:bg-[#F4EFEA] dark:border-[#B89352] dark:bg-[#1C1815] dark:text-[#D4AF37] dark:hover:bg-[#26211C] transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* Artifact Detail Modal */}
      <ArtifactDetailModal
        artifact={selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
        onUpdate={handleArtifactUpdated}
        onDelete={handleArtifactDeleted}
      />

      {/* Reach In Serendipity Rediscovery Drawer */}
      <ReachInDrawer
        isOpen={isReachInOpen}
        onClose={() => setIsReachInOpen(false)}
        onSelectArtifact={(artifact) => {
          setSelectedArtifact(artifact);
        }}
      />

      {/* Capture Modal */}
      <CaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleArtifactAdded}
        onArtifactAdded={handleArtifactAdded}
      />

      {/* Keyboard Shortcuts Dialog */}
      {isShortcutsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsShortcutsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#E3DACD] bg-[#FAF8F4] p-6 text-[#241E1A] shadow-2xl dark:border-[#2D2621] dark:bg-[#1C1815] dark:text-[#EDE6DC]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E3DACD] pb-3 dark:border-[#2D2621]">
              <div className="flex items-center gap-2">
                <Command className="h-4 w-4 text-[#C86243] dark:text-[#D4AF37]" />
                <h3 className="font-serif text-base font-bold">Tactile Vault Hotkeys</h3>
              </div>
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="rounded-lg p-1 text-[#6A5F56] hover:bg-[#EFE9DF] dark:text-[#A69B8D] dark:hover:bg-[#26211C]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#E3DACD]/50 dark:border-[#2D2621]/50">
                <span className="text-[#6A5F56] dark:text-[#A69B8D]">Capture anywhere (Clipper)</span>
                <kbd className="rounded-lg border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#EDE6DC]">
                  Alt + S
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E3DACD]/50 dark:border-[#2D2621]/50">
                <span className="text-[#6A5F56] dark:text-[#A69B8D]">Direct canvas paste</span>
                <kbd className="rounded-lg border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#EDE6DC]">
                  Ctrl / Cmd + V
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E3DACD]/50 dark:border-[#2D2621]/50">
                <span className="text-[#6A5F56] dark:text-[#A69B8D]">Reach In (Rediscovery)</span>
                <kbd className="rounded-lg border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#EDE6DC]">
                  R
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E3DACD]/50 dark:border-[#2D2621]/50">
                <span className="text-[#6A5F56] dark:text-[#A69B8D]">New manual drop</span>
                <kbd className="rounded-lg border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#EDE6DC]">
                  N
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E3DACD]/50 dark:border-[#2D2621]/50">
                <span className="text-[#6A5F56] dark:text-[#A69B8D]">Focus quick search</span>
                <kbd className="rounded-lg border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#EDE6DC]">
                  /
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#E3DACD]/50 dark:border-[#2D2621]/50">
                <span className="text-[#6A5F56] dark:text-[#A69B8D]">Toggle hotkeys guide</span>
                <kbd className="rounded-lg border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#EDE6DC]">
                  ?
                </kbd>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#6A5F56] dark:text-[#A69B8D]">Dismiss active view</span>
                <kbd className="rounded-lg border border-[#E3DACD] bg-[#EFE9DF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#241E1A] dark:border-[#2D2621] dark:bg-[#26211C] dark:text-[#EDE6DC]">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extension Installation Guide Modal */}
      {isExtensionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsExtensionModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[#E3DACD] bg-[#FAF8F4] p-6 text-[#241E1A] shadow-2xl dark:border-[#2D2621] dark:bg-[#1C1815] dark:text-[#EDE6DC]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E3DACD] pb-3 dark:border-[#2D2621]">
              <div className="flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-[#C86243] dark:text-[#D4AF37]" />
                <h3 className="font-serif text-base font-bold">Pitaara Web Clipper (Alt+S)</h3>
              </div>
              <button
                onClick={() => setIsExtensionModalOpen(false)}
                className="rounded-lg p-1 text-[#6A5F56] hover:bg-[#EFE9DF] dark:text-[#A69B8D] dark:hover:bg-[#26211C]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-[#453F39] dark:text-[#D8CEBF] leading-relaxed">
              <p>
                Capture any webpage, GitHub repository, or highlighted quote in one keystroke without leaving your tab using our Manifest V3 extension.
              </p>

              <div className="rounded-xl border border-[#E3DACD] bg-[#EFE9DF]/60 p-3.5 dark:border-[#2D2621] dark:bg-[#26211C]/60 space-y-2 font-mono text-[11px]">
                <p className="font-semibold text-[#241E1A] dark:text-[#EDE6DC] font-sans">
                  Quick Install Steps:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[#6A5F56] dark:text-[#A69B8D]">
                  <li>Open <span className="text-[#241E1A] dark:text-[#EDE6DC]">chrome://extensions</span></li>
                  <li>Enable <span className="text-[#241E1A] dark:text-[#EDE6DC]">Developer mode</span> (top right toggle)</li>
                  <li>Click <span className="text-[#241E1A] dark:text-[#EDE6DC]">Load unpacked</span></li>
                  <li>Select the folder: <span className="text-[#C86243] dark:text-[#D4AF37]">pitaara/extension</span></li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-mono text-[11px] text-[#6A5F56] dark:text-[#A69B8D]">
                  Shortcut: <kbd className="rounded bg-[#EFE9DF] px-1.5 py-0.5 border border-[#E3DACD] dark:bg-[#26211C] dark:border-[#2D2621]">Alt + S</kbd>
                </span>
                <button
                  onClick={() => setIsExtensionModalOpen(false)}
                  className="rounded-xl bg-[#241E1A] px-4 py-2 text-xs font-semibold text-[#F7F3EB] dark:bg-[#D4AF37] dark:text-[#131110]"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Email & Password Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          if (!user) {
            router.push('/');
          } else {
            setIsAuthModalOpen(false);
          }
        }}
        canDismiss={Boolean(user)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
