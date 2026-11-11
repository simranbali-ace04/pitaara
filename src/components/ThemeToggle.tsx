'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { playDropSound } from '@/lib/sound';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    playDropSound();
    const current = resolvedTheme || theme;
    setTheme(current === 'dark' ? 'light' : 'dark');
  };

  // Prevent hydration mismatch by rendering a matching sized placeholder
  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-xl border border-[#D9CEBC] bg-[#F1E9DC]/80 dark:border-[#332722] dark:bg-[#1E1714]" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to Kora & Pital (Light)' : 'Switch to Sheesham & Raat (Dark)'}
      className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9CEBC] bg-[#F1E9DC] text-[#73675C] transition-all duration-200 hover:border-[#C5A059] hover:text-[#241C18] dark:border-[#332722] dark:bg-[#1E1714] dark:text-[#A89B91] dark:hover:border-[#C5A059] dark:hover:text-[#ECE4D8] active:scale-95"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-[#C5A059] transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-[#A84B2C] transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}

