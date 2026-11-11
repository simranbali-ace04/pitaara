'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Search,
  Calendar,
  Lock,
  Play,
  Code2,
  Image as ImageIcon,
  Video,
  BookOpen,
  Sparkles,
  Laptop,
  Smartphone,
  ChevronDown,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthModal } from '@/components/AuthModal';
import { playDrawerSound, playDropSound } from '@/lib/sound';

/* -------------------------------------------------------------------------- */
/* SVG CRAFT COMPONENTS: MEDALLION, CORNERS, STAMPS & DIVIDERS                */
/* -------------------------------------------------------------------------- */

/** Octagonal brass medallion brand mark with internal keyhole/latch glyph */
function OctagonMedallion({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer chamfered octagonal boundary */}
      <polygon
        points="8.2,1.5 19.8,1.5 26.5,8.2 26.5,19.8 19.8,26.5 8.2,26.5 1.5,19.8 1.5,8.2"
        className="fill-[#F1E9DC] stroke-[#C5A059] dark:fill-[#1E1714] dark:stroke-[#C5A059]"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inset hairline boundary */}
      <polygon
        points="9,3.8 19,3.8 24.2,9 24.2,19 19,24.2 9,24.2 3.8,19 3.8,9"
        className="stroke-[#C5A059]/40 dark:stroke-[#C5A059]/40"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      {/* Internal heirloom latch / keyhole */}
      <circle
        cx="14"
        cy="11.5"
        r="2.6"
        className="fill-[#A84B2C] dark:fill-[#C5A059]"
      />
      <path
        d="M12.6 12.8 L12.1 18.2 C12.1 18.6 12.4 19 12.8 19 L15.2 19 C15.6 19 15.9 18.6 15.9 18.2 L15.4 12.8 Z"
        className="fill-[#A84B2C] dark:fill-[#C5A059]"
      />
    </svg>
  );
}

/** Chamfered octagonal numbering seal for feature rows: { 01 }, { 02 }, { 03 } */
function SectionStamp({ number }: { number: string }) {
  return (
    <div className="inline-flex items-center font-mono text-xs uppercase tracking-wider text-[#A84B2C] dark:text-[#C5A059] mb-3">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm border border-[#D9CEBC] bg-[#F1E9DC] dark:border-[#332722] dark:bg-[#1E1714] shadow-xs">
        <span className="text-[#C5A059] text-[10px]">✦</span>
        <span className="font-semibold tracking-widest">{`{ ${number} }`}</span>
      </span>
    </div>
  );
}

/** Double-rule hairline divider with centered rotated brass diamond: ───◇─── */
function HeritageDivider({ className = 'my-14 sm:my-20' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
      <div className="h-[3px] border-t border-b border-[#D9CEBC] dark:border-[#332722] flex-1 max-w-[140px] sm:max-w-xs" />
      <div className="mx-4 flex items-center gap-2 text-[#A84B2C] dark:text-[#C5A059] select-none text-xs">
        <span className="text-[#D9CEBC] dark:text-[#332722]">─</span>
        <span className="font-serif text-sm">◇</span>
        <span className="text-[#D9CEBC] dark:text-[#332722]">─</span>
      </div>
      <div className="h-[3px] border-t border-b border-[#D9CEBC] dark:border-[#332722] flex-1 max-w-[140px] sm:max-w-xs" />
    </div>
  );
}

/** Jaali / Jharokha stepped geometric corner ornament */
function JaaliCorner({
  position,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const transform = {
    'top-left': '',
    'top-right': 'scale-x-[-1]',
    'bottom-left': 'scale-y-[-1]',
    'bottom-right': 'scale-x-[-1] scale-y-[-1]',
  }[position];

  return (
    <svg
      viewBox="0 0 48 48"
      className={`w-10 h-10 sm:w-14 sm:h-14 text-[#C5A059]/45 dark:text-[#C5A059]/40 ${transform}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0 1.5 H40 M1.5 0 V40" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 6.5 H30 M6.5 5 V30" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 2" />
      <path d="M12 1.5 V12 H1.5" stroke="currentColor" strokeWidth="0.8" />
      <path d="M22 1.5 V22 H1.5" stroke="currentColor" strokeWidth="0.8" />
      <polygon points="12,12 15,9 18,12 15,15" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN MARKETING PAGE COMPONENT                                              */
/* -------------------------------------------------------------------------- */

export default function MarketingLandingPage() {
  const [heroSettled, setHeroSettled] = useState(false);
  const [reachInActive, setReachInActive] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Hero cards settling animation (300ms–450ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroSettled(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleReachIn = () => {
    playDrawerSound();
    setReachInActive((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#F8F3EA] text-[#241C18] dark:bg-[#14100E] dark:text-[#ECE4D8] transition-colors duration-200 selection:bg-[#C5A059]/25">
      {/* -------------------------------------------------------------------- */}
      {/* 1. COMPACT HERITAGE HEADER                                           */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-[#D9CEBC] bg-[#F8F3EA]/90 backdrop-blur-md dark:border-[#332722] dark:bg-[#14100E]/90 transition-colors">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Octagonal Brass Medallion + Serif Wordmark */}
          <Link
            href="/"
            onClick={() => playDropSound()}
            className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            <OctagonMedallion className="h-7 w-7 transition-transform duration-300 group-hover:rotate-45" />
            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#241C18] dark:text-[#ECE4D8]">
                Pitaara
              </span>
            </div>
          </Link>

          {/* Right: Anchors, Theme Toggle & Vault Button */}
          <nav className="flex items-center gap-3 sm:gap-6 text-sm">
            <a
              href="#features"
              className="hidden md:inline-block text-[#73675C] hover:text-[#241C18] dark:text-[#A89B91] dark:hover:text-[#ECE4D8] transition-colors"
            >
              Features
            </a>
            <a
              href="#shortcuts"
              className="hidden md:inline-block text-[#73675C] hover:text-[#241C18] dark:text-[#A89B91] dark:hover:text-[#ECE4D8] transition-colors"
            >
              Shortcuts
            </a>

            <div className="h-4 w-[1px] bg-[#D9CEBC] dark:bg-[#332722] hidden sm:block" />

            {/* Sign In Button */}
            <button
              type="button"
              onClick={() => {
                playDrawerSound();
                setIsAuthModalOpen(true);
              }}
              className="text-xs sm:text-sm font-medium text-[#73675C] hover:text-[#241C18] dark:text-[#A89B91] dark:hover:text-[#ECE4D8] transition-colors"
            >
              Sign In
            </button>

            {/* Accessible Theme Toggle */}
            <ThemeToggle />

            {/* Pill CTA button: Open Pitaara */}
            <Link
              href="/vault"
              onClick={() => playDropSound()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D9CEBC] bg-[#F1E9DC] px-4 py-1.5 text-xs sm:text-sm font-medium text-[#241C18] transition-all duration-150 hover:border-[#C5A059] hover:bg-[#FAF6F0] dark:border-[#332722] dark:bg-[#1E1714] dark:text-[#ECE4D8] dark:hover:border-[#C5A059] dark:hover:bg-[#261E1A] active:scale-95 shadow-xs"
            >
              <span>Open Pitaara</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#A84B2C] dark:text-[#C5A059]" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ------------------------------------------------------------------ */}
        {/* 2. HERO SECTION (SPLIT ASYMMETRICAL & PHYSICAL HEIRLOOM TRAY)       */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
          {/* Delicate Jaali Architectural Corners */}
          <div className="absolute top-2 left-0 pointer-events-none">
            <JaaliCorner position="top-left" />
          </div>
          <div className="absolute top-2 right-0 pointer-events-none">
            <JaaliCorner position="top-right" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Literary Headline, Copy, Terracotta CTA */}
            <div className="lg:col-span-6 flex flex-col items-start z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-[#D9CEBC] bg-[#F1E9DC] dark:border-[#332722] dark:bg-[#1E1714] text-[11px] font-mono tracking-wider text-[#A84B2C] dark:text-[#C5A059] mb-6">
                <span>✦</span>
                <span className="uppercase">Private Digital Keepsake Vault</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#241C18] dark:text-[#ECE4D8] leading-[1.12]">
                A place for<br />
                <span className="italic font-normal text-[#A84B2C] dark:text-[#C5A059]">what you find.</span>
              </h1>

              <p className="mt-5 max-w-lg text-base sm:text-lg text-[#73675C] dark:text-[#A89B91] leading-[1.65]">
                Your private digital keepsake vault to save interesting things from across the web, and find them again when they matter.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/vault"
                  onClick={() => playDropSound()}
                  className="inline-flex items-center gap-2.5 rounded-lg bg-[#A84B2C] hover:bg-[#8F3E23] text-[#FAF6F0] dark:bg-[#C5A059] dark:hover:bg-[#B89352] dark:text-[#14100E] font-medium px-6 py-3 text-sm sm:text-base transition-all duration-200 active:translate-y-[1px] shadow-sm group"
                >
                  <span>Open Pitaara</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg border border-transparent hover:border-[#D9CEBC] dark:hover:border-[#332722] text-sm text-[#73675C] dark:text-[#A89B91] hover:text-[#241C18] dark:hover:text-[#ECE4D8] transition-all"
                >
                  <span>Explore the craft</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </a>
              </div>
            </div>

            {/* Right Column: Physical Heirloom Tray with Jaali Front & 4 Keepsake Cards */}
            <div className="lg:col-span-6 relative mt-6 lg:mt-0">
              <div className="relative mx-auto max-w-lg">
                {/* 4 Keepsake Cards with staggered vertical settling */}
                <div className="relative h-[340px] sm:h-[380px] w-full flex items-end justify-center">
                  {/* Card 1: Visual (Polaroid Landscape) */}
                  <div
                    className={`absolute bottom-14 left-2 sm:left-4 w-40 sm:w-48 rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-2.5 shadow-sm transition-all duration-500 dark:border-[#332722] dark:bg-[#261E1A] ${
                      heroSettled
                        ? 'translate-y-0 rotate-[-4deg] opacity-100'
                        : 'translate-y-8 rotate-0 opacity-0'
                    }`}
                    style={{ transitionDelay: '80ms' }}
                  >
                    <div className="aspect-4/3 w-full rounded border border-[#D9CEBC]/60 bg-[#F1E9DC] dark:border-[#332722] dark:bg-[#1E1714] flex items-center justify-center relative overflow-hidden">
                      <svg viewBox="0 0 100 75" className="w-full h-full text-[#A84B2C]/40 dark:text-[#C5A059]/40" fill="none">
                        <circle cx="50" cy="28" r="14" fill="#C5A059" opacity="0.35" />
                        <path d="M10 65 L45 30 L65 52 L80 40 L95 65 Z" fill="currentColor" />
                      </svg>
                      <span className="absolute bottom-1 right-1 font-mono text-[8px] text-[#73675C] dark:text-[#A89B91]">
                        2400×1600
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="font-serif italic font-medium text-[#241C18] dark:text-[#ECE4D8]">
                        Jodhpur Sunrise
                      </span>
                      <span className="font-mono text-[#A84B2C] dark:text-[#C5A059] flex items-center gap-0.5">
                        <ImageIcon className="h-2.5 w-2.5" />
                        <span>Visual</span>
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Video (Warm Media Card with Sun Rays) */}
                  <div
                    className={`absolute bottom-14 right-2 sm:right-4 w-40 sm:w-48 rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-2.5 shadow-sm transition-all duration-500 dark:border-[#332722] dark:bg-[#261E1A] ${
                      heroSettled
                        ? 'translate-y-0 rotate-[4deg] opacity-100'
                        : 'translate-y-8 rotate-0 opacity-0'
                    }`}
                    style={{ transitionDelay: '180ms' }}
                  >
                    <div className="aspect-4/3 w-full rounded border border-[#D9CEBC]/60 bg-[#F1E9DC] dark:border-[#332722] dark:bg-[#1E1714] flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Sun ray backdrop */}
                      <svg viewBox="0 0 80 60" className="absolute inset-0 w-full h-full text-[#C5A059]/20" fill="none" stroke="currentColor">
                        <line x1="40" y1="30" x2="10" y2="10" strokeWidth="1" />
                        <line x1="40" y1="30" x2="70" y2="10" strokeWidth="1" />
                        <line x1="40" y1="30" x2="40" y2="2" strokeWidth="1" />
                        <line x1="40" y1="30" x2="15" y2="45" strokeWidth="1" />
                        <line x1="40" y1="30" x2="65" y2="45" strokeWidth="1" />
                      </svg>
                      <div className="h-8 w-8 rounded-full border border-[#C5A059] bg-[#FAF6F0] dark:bg-[#261E1A] flex items-center justify-center shadow-xs z-10">
                        <Play className="h-3.5 w-3.5 text-[#A84B2C] dark:text-[#C5A059] translate-x-[1px]" fill="currentColor" />
                      </div>
                      <span className="mt-1 font-mono text-[9px] text-[#73675C] dark:text-[#A89B91] z-10">
                        14:20
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="font-serif italic font-medium text-[#241C18] dark:text-[#ECE4D8]">
                        Sitar & Tarang
                      </span>
                      <span className="font-mono text-[#A84B2C] dark:text-[#C5A059] flex items-center gap-0.5">
                        <Video className="h-2.5 w-2.5" />
                        <span>Video</span>
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Read (Lined Editorial Parchment) */}
                  <div
                    className={`absolute bottom-20 left-12 sm:left-16 w-44 sm:w-52 rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3 shadow-md transition-all duration-500 dark:border-[#332722] dark:bg-[#1E1714] ${
                      heroSettled
                        ? 'translate-y-0 rotate-[-1deg] opacity-100 z-10'
                        : 'translate-y-8 rotate-0 opacity-0'
                    }`}
                    style={{ transitionDelay: '260ms' }}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-[#73675C] dark:text-[#A89B91] mb-1.5">
                      <span className="font-serif text-[#A84B2C] dark:text-[#C5A059] font-medium flex items-center gap-1">
                        <BookOpen className="h-2.5 w-2.5" />
                        <span>Read</span>
                      </span>
                      <span>Oct 24</span>
                    </div>
                    <h3 className="font-serif text-xs font-bold leading-snug text-[#241C18] dark:text-[#ECE4D8]">
                      The Architecture of Haveli Courtyards
                    </h3>
                    {/* Subtle lined parchment body rules */}
                    <div className="mt-2 space-y-1.5">
                      <div className="h-[2px] w-full bg-[#D9CEBC]/60 dark:bg-[#332722]" />
                      <div className="h-[2px] w-5/6 bg-[#D9CEBC]/60 dark:bg-[#332722]" />
                      <div className="h-[2px] w-4/6 bg-[#D9CEBC]/60 dark:bg-[#332722]" />
                    </div>
                  </div>

                  {/* Card 4: Code (Dark Contrast Slate Card) */}
                  <div
                    className={`absolute bottom-24 right-10 sm:right-14 w-44 sm:w-52 rounded-lg border border-[#332722] bg-[#1E1714] p-3 shadow-lg transition-all duration-500 text-[#FAF6F0] ${
                      heroSettled
                        ? 'translate-y-0 rotate-[2deg] opacity-100 z-20'
                        : 'translate-y-8 rotate-0 opacity-0'
                    }`}
                    style={{ transitionDelay: '340ms' }}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-[#A89B91] mb-1">
                      <span className="text-[#C5A059] font-semibold flex items-center gap-1">
                        <Code2 className="h-2.5 w-2.5" />
                        <span>Code</span>
                      </span>
                      <span>synthesizer.ts</span>
                    </div>
                    <div className="rounded border border-[#3D302A] bg-[#14100E] p-2 font-mono text-[9px] text-[#ECE4D8] space-y-0.5">
                      <div className="text-[#A89B91]">{`// Web Audio thud`}</div>
                      <div>
                        <span className="text-[#C5A059]">const</span> osc = ctx.osc();
                      </div>
                      <div>osc.freq.ramp(45, 0.06);</div>
                    </div>
                  </div>
                </div>

                {/* The Heirloom Archival Wooden/Brass Tray Container */}
                <div className="relative -mt-6 rounded-xl border-2 border-[#D9CEBC] bg-[#F1E9DC] p-3.5 shadow-md dark:border-[#332722] dark:bg-[#1E1714]">
                  {/* Jaali geometric embossing lattice across lower tray rim */}
                  <div className="flex items-center justify-between px-2 py-1 border-b border-[#D9CEBC]/80 dark:border-[#332722]">
                    <div className="flex items-center gap-1.5 opacity-60">
                      <span className="text-[10px] font-mono text-[#C5A059]">❖ ❖ ❖ ❖ ❖</span>
                    </div>
                    {/* Small center brass latch plate with rivets */}
                    <div className="flex items-center gap-1 rounded-sm border border-[#C5A059] bg-[#FAF6F0] px-2 py-0.5 shadow-xs dark:bg-[#261E1A]">
                      <span className="h-1 w-1 rounded-full bg-[#A84B2C] dark:bg-[#C5A059]" />
                      <span className="font-mono text-[9px] font-semibold tracking-wider text-[#A84B2C] dark:text-[#C5A059]">
                        VAULT 01
                      </span>
                      <span className="h-1 w-1 rounded-full bg-[#A84B2C] dark:bg-[#C5A059]" />
                    </div>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <span className="text-[10px] font-mono text-[#C5A059]">❖ ❖ ❖ ❖ ❖</span>
                    </div>
                  </div>

                  {/* Tray base edge */}
                  <div className="mt-2 flex items-center justify-between text-[11px] font-serif italic text-[#73675C] dark:text-[#A89B91] px-1">
                    <span>Curated Keepsakes</span>
                    <span className="font-mono text-[10px] not-italic text-[#A84B2C] dark:text-[#C5A059]">
                      4 of 128 items
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 pointer-events-none">
            <JaaliCorner position="bottom-left" />
          </div>
          <div className="absolute bottom-0 right-0 pointer-events-none">
            <JaaliCorner position="bottom-right" />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* HAIRLINE SECTION BREAK                                             */}
        {/* ------------------------------------------------------------------ */}
        <HeritageDivider />

        {/* ------------------------------------------------------------------ */}
        {/* 3. FEATURE 01 — CAPTURE IN SECONDS                                 */}
        {/* ------------------------------------------------------------------ */}
        <section id="features" className="py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Stamp { 01 }, Heading, Copy */}
            <div className="lg:col-span-5">
              <SectionStamp number="01" />
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#241C18] dark:text-[#ECE4D8]">
                Capture in seconds.
              </h2>
              <p className="mt-4 text-base text-[#73675C] dark:text-[#A89B91] leading-[1.65]">
                Save anything from the web with the Pitaara clipper (<span className="font-mono text-xs font-semibold text-[#241C18] dark:text-[#ECE4D8]">Alt + S</span>), or simply paste (<span className="font-mono text-xs font-semibold text-[#241C18] dark:text-[#ECE4D8]">Ctrl / ⌘ + V</span>) what you find.
              </p>
            </div>

            {/* Right Column: Abstract Minimalist Browser Wireframe + Keycaps */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-[#D9CEBC] bg-[#F1E9DC] p-4 sm:p-6 shadow-sm dark:border-[#332722] dark:bg-[#1E1714]">
                {/* Browser window wireframe */}
                <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] dark:border-[#332722] dark:bg-[#14100E] overflow-hidden">
                  {/* Browser top chrome */}
                  <div className="flex items-center justify-between border-b border-[#D9CEBC] bg-[#F1E9DC] px-3 py-2 dark:border-[#332722] dark:bg-[#1E1714]">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#A84B2C]/70" />
                      <span className="h-2 w-2 rounded-full bg-[#C5A059]" />
                      <span className="h-2 w-2 rounded-full bg-[#73675C]/50" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded border border-[#D9CEBC] bg-[#FAF6F0] px-3 py-0.5 font-mono text-[10px] text-[#73675C] dark:border-[#332722] dark:bg-[#14100E] dark:text-[#A89B91]">
                      <span>https://heritage-press.in/haveli</span>
                    </div>
                    {/* Pitaara clipper icon indicator */}
                    <div className="flex items-center gap-1 text-[#A84B2C] dark:text-[#C5A059]">
                      <OctagonMedallion className="h-4 w-4" />
                      <span className="font-mono text-[9px] font-semibold">SAVED</span>
                    </div>
                  </div>

                  {/* Browser simulated content */}
                  <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                    <div className="sm:col-span-5 aspect-4/3 rounded border border-[#D9CEBC] bg-[#F1E9DC] dark:border-[#332722] dark:bg-[#261E1A] flex items-center justify-center p-2">
                      <svg viewBox="0 0 100 70" className="w-full h-full text-[#A84B2C]/40 dark:text-[#C5A059]/40" fill="none">
                        <rect x="20" y="10" width="60" height="50" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M20 35 Q50 15 80 35" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="50" cy="30" r="4" fill="#C5A059" />
                      </svg>
                    </div>
                    <div className="sm:col-span-7 space-y-2">
                      <div className="font-serif text-sm sm:text-base font-bold text-[#241C18] dark:text-[#ECE4D8]">
                        The Jharokha Window: Air & Light in Rajasthani Haveli
                      </div>
                      <p className="text-xs text-[#73675C] dark:text-[#A89B91] line-clamp-2 leading-relaxed">
                        Projecting stone balconies carved with fine tracery provided natural ventilation and shaded viewing...
                      </p>
                      <div className="inline-flex items-center gap-1 text-[10px] font-mono text-[#A84B2C] dark:text-[#C5A059]">
                        <span>✓ Clipped directly into Pitaara</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tactile Keycaps Beside/Below */}
                <div className="mt-4 pt-4 border-t border-[#D9CEBC] dark:border-[#332722] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Shortcut 1: Alt + S */}
                  <div className="flex items-center justify-between rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3 dark:border-[#332722] dark:bg-[#14100E] transition-all hover:border-[#C5A059]">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-[#241C18] dark:text-[#ECE4D8]">
                        Save from the web
                      </span>
                      <span className="text-[11px] text-[#73675C] dark:text-[#A89B91]">
                        Browser extension shortcut
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-block px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8] shadow-[0_2px_0_0_#D9CEBC] dark:shadow-[0_2px_0_0_#332722] transition-all hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#D9CEBC] dark:hover:shadow-[0_1px_0_0_#332722] active:translate-y-[2px] active:shadow-none">
                        Alt
                      </kbd>
                      <span className="text-[#73675C] text-xs">+</span>
                      <kbd className="inline-block px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8] shadow-[0_2px_0_0_#D9CEBC] dark:shadow-[0_2px_0_0_#332722] transition-all hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#D9CEBC] dark:hover:shadow-[0_1px_0_0_#332722] active:translate-y-[2px] active:shadow-none">
                        S
                      </kbd>
                    </div>
                  </div>

                  {/* Shortcut 2: Ctrl / Cmd + V */}
                  <div className="flex items-center justify-between rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3 dark:border-[#332722] dark:bg-[#14100E] transition-all hover:border-[#C5A059]">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-[#241C18] dark:text-[#ECE4D8]">
                        Paste into Pitaara
                      </span>
                      <span className="text-[11px] text-[#73675C] dark:text-[#A89B91]">
                        Global window clipboard listener
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="inline-block px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8] shadow-[0_2px_0_0_#D9CEBC] dark:shadow-[0_2px_0_0_#332722] transition-all hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#D9CEBC] dark:hover:shadow-[0_1px_0_0_#332722] active:translate-y-[2px] active:shadow-none">
                        Ctrl / ⌘
                      </kbd>
                      <span className="text-[#73675C] text-xs">+</span>
                      <kbd className="inline-block px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8] shadow-[0_2px_0_0_#D9CEBC] dark:shadow-[0_2px_0_0_#332722] transition-all hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#D9CEBC] dark:hover:shadow-[0_1px_0_0_#332722] active:translate-y-[2px] active:shadow-none">
                        V
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* HAIRLINE SECTION BREAK                                             */}
        {/* ------------------------------------------------------------------ */}
        <HeritageDivider />

        {/* ------------------------------------------------------------------ */}
        {/* 4. FEATURE 02 — EVERYTHING FINDS ITS PLACE                         */}
        {/* ------------------------------------------------------------------ */}
        <section className="py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Stamp { 02 }, Heading, Copy */}
            <div className="lg:col-span-5">
              <SectionStamp number="02" />
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#241C18] dark:text-[#ECE4D8]">
                Everything finds its place.
              </h2>
              <p className="mt-4 text-base text-[#73675C] dark:text-[#A89B91] leading-[1.65]">
                Your saves are neatly organized by type, quick to search with Khoj, and gently archived by month.
              </p>
            </div>

            {/* Right Column: 4 Category Tiles + Khoj Search + Monthly Archive */}
            <div className="lg:col-span-7">
              <div className="rounded-xl border border-[#D9CEBC] bg-[#F1E9DC] p-4 sm:p-6 shadow-sm dark:border-[#332722] dark:bg-[#1E1714] space-y-4">
                {/* 4 Tactile Category Tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Category 1: Visuals */}
                  <div className="group rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3 transition-all duration-200 hover:border-[#C5A059] hover:-translate-y-0.5 dark:border-[#332722] dark:bg-[#14100E]">
                    <div className="flex items-center justify-between text-[#A84B2C] dark:text-[#C5A059] mb-2">
                      <ImageIcon className="h-4 w-4" />
                      <span className="font-mono text-[9px] opacity-70">32</span>
                    </div>
                    <div className="font-serif font-semibold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                      Visuals
                    </div>
                    <div className="text-[10px] text-[#73675C] dark:text-[#A89B91]">
                      Photos, posters, art
                    </div>
                  </div>

                  {/* Category 2: Videos */}
                  <div className="group rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3 transition-all duration-200 hover:border-[#C5A059] hover:-translate-y-0.5 dark:border-[#332722] dark:bg-[#14100E]">
                    <div className="flex items-center justify-between text-[#A84B2C] dark:text-[#C5A059] mb-2">
                      <Video className="h-4 w-4" />
                      <span className="font-mono text-[9px] opacity-70">18</span>
                    </div>
                    <div className="font-serif font-semibold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                      Videos
                    </div>
                    <div className="text-[10px] text-[#73675C] dark:text-[#A89B91]">
                      Performances, talks
                    </div>
                  </div>

                  {/* Category 3: Reads */}
                  <div className="group rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3 transition-all duration-200 hover:border-[#C5A059] hover:-translate-y-0.5 dark:border-[#332722] dark:bg-[#14100E]">
                    <div className="flex items-center justify-between text-[#A84B2C] dark:text-[#C5A059] mb-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-mono text-[9px] opacity-70">54</span>
                    </div>
                    <div className="font-serif font-semibold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                      Reads
                    </div>
                    <div className="text-[10px] text-[#73675C] dark:text-[#A89B91]">
                      Essays, threads, notes
                    </div>
                  </div>

                  {/* Category 4: Code */}
                  <div className="group rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3 transition-all duration-200 hover:border-[#C5A059] hover:-translate-y-0.5 dark:border-[#332722] dark:bg-[#14100E]">
                    <div className="flex items-center justify-between text-[#A84B2C] dark:text-[#C5A059] mb-2">
                      <Code2 className="h-4 w-4" />
                      <span className="font-mono text-[9px] opacity-70">24</span>
                    </div>
                    <div className="font-serif font-semibold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                      Code
                    </div>
                    <div className="text-[10px] text-[#73675C] dark:text-[#A89B91]">
                      Gists, scripts, math
                    </div>
                  </div>
                </div>

                {/* Sub-controls: Khoj Search + Monthly Archive Selector */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Khoj Search Input */}
                  <div className="sm:col-span-7 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#A84B2C] dark:text-[#C5A059]">
                      <Search className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      readOnly
                      value="khoj: architecture or audio"
                      className="w-full rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] pl-9 pr-3 py-2 text-xs sm:text-sm font-mono text-[#241C18] dark:border-[#3D302A] dark:bg-[#261E1A] dark:text-[#ECE4D8] focus:outline-none"
                    />
                  </div>

                  {/* Monthly Archive Selector */}
                  <div className="sm:col-span-5 relative">
                    <div className="flex items-center justify-between w-full rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] px-3 py-2 text-xs sm:text-sm text-[#241C18] dark:border-[#3D302A] dark:bg-[#261E1A] dark:text-[#ECE4D8]">
                      <div className="flex items-center gap-1.5 text-[#73675C] dark:text-[#A89B91]">
                        <Calendar className="h-3.5 w-3.5 text-[#A84B2C] dark:text-[#C5A059]" />
                        <span className="font-mono text-xs">Kartik · Nov 2026</span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* HAIRLINE SECTION BREAK                                             */}
        {/* ------------------------------------------------------------------ */}
        <HeritageDivider />

        {/* ------------------------------------------------------------------ */}
        {/* 5. FEATURE 03 — REACH IN                                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Stamp { 03 }, Heading, Copy */}
            <div className="lg:col-span-5">
              <SectionStamp number="03" />
              <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#241C18] dark:text-[#ECE4D8]">
                Reach In.
              </h2>
              <p className="mt-4 text-base text-[#73675C] dark:text-[#A89B91] leading-[1.65]">
                Find things fast, or rediscover them serendipitously with the{' '}
                <kbd className="inline-block px-1.5 py-0.5 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#1E1714] dark:text-[#ECE4D8]">
                  R
                </kbd>{' '}
                shortcut from anywhere in Pitaara.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleToggleReachIn}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D9CEBC] bg-[#F1E9DC] px-4 py-2 text-xs sm:text-sm font-medium text-[#241C18] hover:border-[#C5A059] hover:bg-[#FAF6F0] dark:border-[#332722] dark:bg-[#1E1714] dark:text-[#ECE4D8] dark:hover:border-[#C5A059] dark:hover:bg-[#261E1A] transition-all active:scale-95 shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#A84B2C] dark:text-[#C5A059]" />
                  <span>{reachInActive ? 'Close Preview' : 'Try Reach In (R)'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: 3 Stacked Archival Keepsake Slips */}
            <div className="lg:col-span-7">
              <div className="relative rounded-xl border border-[#D9CEBC] bg-[#F1E9DC] p-4 sm:p-6 shadow-sm dark:border-[#332722] dark:bg-[#1E1714]">
                {/* 3 Stacked Slips */}
                <div className="space-y-3">
                  {/* Slip 1: Purani Khoj */}
                  <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3.5 dark:border-[#332722] dark:bg-[#14100E] transition-all duration-200 hover:border-[#C5A059]">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A84B2C] dark:text-[#C5A059] mb-1">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <span>✦</span>
                        <span>Purani Khoj</span>
                      </span>
                      <span className="text-[#73675C] dark:text-[#A89B91] text-[10px]">
                        Saved 8 months ago
                      </span>
                    </div>
                    <div className="font-serif font-bold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                      A save from your past, for a fresh look.
                    </div>
                    <p className="mt-1 text-xs text-[#73675C] dark:text-[#A89B91]">
                      &quot;Geometric Tessellations in Mughal Inlay Work&quot; · Architectural Study
                    </p>
                  </div>

                  {/* Slip 2: Tarang */}
                  <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3.5 dark:border-[#332722] dark:bg-[#14100E] transition-all duration-200 hover:border-[#C5A059]">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A84B2C] dark:text-[#C5A059] mb-1">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <span>✦</span>
                        <span>Tarang</span>
                      </span>
                      <span className="text-[#73675C] dark:text-[#A89B91] text-[10px]">
                        Resonance match
                      </span>
                    </div>
                    <div className="font-serif font-bold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                      A related find, from your own trail.
                    </div>
                    <p className="mt-1 text-xs text-[#73675C] dark:text-[#A89B91]">
                      &quot;Acoustic Resonance of Sitar Soundboards&quot; · Physics & Craft
                    </p>
                  </div>

                  {/* Slip 3: Anokha Tukda */}
                  <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3.5 dark:border-[#332722] dark:bg-[#14100E] transition-all duration-200 hover:border-[#C5A059]">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A84B2C] dark:text-[#C5A059] mb-1">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <span>✦</span>
                        <span>Anokha Tukda</span>
                      </span>
                      <span className="text-[#73675C] dark:text-[#A89B91] text-[10px]">
                        Wildcard
                      </span>
                    </div>
                    <div className="font-serif font-bold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                      A wildcard from your collection.
                    </div>
                    <p className="mt-1 text-xs text-[#73675C] dark:text-[#A89B91]">
                      &quot;Quick Shell Script for Sorting Markdown Keepsakes&quot; · 12 lines
                    </p>
                  </div>
                </div>

                {/* Interactive Mini Reach In Drawer Overlay when activated */}
                {reachInActive && (
                  <div className="absolute inset-x-2 sm:inset-x-4 bottom-2 sm:bottom-4 rounded-xl border-2 border-[#C5A059] bg-[#F1E9DC] p-4 shadow-xl dark:bg-[#261E1A] z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-[#D9CEBC] dark:border-[#332722]">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#A84B2C] dark:text-[#C5A059]" />
                        <span className="font-serif font-bold text-sm text-[#241C18] dark:text-[#ECE4D8]">
                          Serendipity Rediscovery
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleReachIn}
                        className="rounded p-1 text-[#73675C] hover:text-[#241C18] dark:text-[#A89B91] dark:hover:text-[#ECE4D8]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 p-3 rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] dark:border-[#3D302A] dark:bg-[#14100E]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#A84B2C] dark:text-[#C5A059]">
                        <span>TUKDA #047</span>
                        <span>SAVED IN 2025</span>
                      </div>
                      <div className="mt-1 font-serif text-sm font-semibold text-[#241C18] dark:text-[#ECE4D8]">
                        &quot;How Indian Stepwells Solved Ancient Hydrology&quot;
                      </div>
                      <p className="mt-1 text-xs text-[#73675C] dark:text-[#A89B91]">
                        Re-surfaced automatically because it connects with your recent haveli notes.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* HAIRLINE SECTION BREAK                                             */}
        {/* ------------------------------------------------------------------ */}
        <HeritageDivider />

        {/* ------------------------------------------------------------------ */}
        {/* 6. TRUST & DEVICE SYNC BAND                                        */}
        {/* ------------------------------------------------------------------ */}
        <section className="py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Note 1: Private by design */}
            <div className="rounded-xl border border-[#D9CEBC] bg-[#F1E9DC] p-6 sm:p-8 dark:border-[#332722] dark:bg-[#1E1714] transition-all hover:border-[#C5A059]">
              <div className="h-10 w-10 rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] dark:border-[#332722] dark:bg-[#14100E] flex items-center justify-center text-[#A84B2C] dark:text-[#C5A059] mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241C18] dark:text-[#ECE4D8]">
                Private by design.
              </h3>
              <p className="mt-2 text-sm text-[#73675C] dark:text-[#A89B91] leading-[1.65]">
                Your Pitaara is just yours — no tracking, no public feeds, no surprises. Your artifacts remain sealed in your own personal vault.
              </p>
            </div>

            {/* Note 2: In sync across devices */}
            <div className="rounded-xl border border-[#D9CEBC] bg-[#F1E9DC] p-6 sm:p-8 dark:border-[#332722] dark:bg-[#1E1714] transition-all hover:border-[#C5A059]">
              <div className="h-10 w-10 rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] dark:border-[#332722] dark:bg-[#14100E] flex items-center justify-center text-[#A84B2C] dark:text-[#C5A059] mb-4">
                <div className="flex items-center gap-1">
                  <Laptop className="h-4 w-4" />
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241C18] dark:text-[#ECE4D8]">
                In sync across devices.
              </h3>
              <p className="mt-2 text-sm text-[#73675C] dark:text-[#A89B91] leading-[1.65]">
                Open your Pitaara on your laptop, phone, or tablet, and pick up right where you left off through real-time sync.
              </p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SHORTCUTS REFERENCE SECTION                                       */}
        {/* ------------------------------------------------------------------ */}
        <section id="shortcuts" className="py-12 sm:py-16">
          <div className="rounded-xl border border-[#D9CEBC] bg-[#F1E9DC] p-6 sm:p-8 dark:border-[#332722] dark:bg-[#1E1714]">
            <div className="flex items-center justify-between pb-4 border-b border-[#D9CEBC] dark:border-[#332722]">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#241C18] dark:text-[#ECE4D8]">
                  Keycap Shortcuts
                </h3>
                <p className="text-xs text-[#73675C] dark:text-[#A89B91] mt-0.5">
                  Designed for muscle memory and frictionless rediscovery
                </p>
              </div>
              <span className="font-mono text-xs text-[#A84B2C] dark:text-[#C5A059]">✦ PITAARA</span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3.5 dark:border-[#332722] dark:bg-[#14100E]">
                <div className="flex items-center gap-1.5 mb-2">
                  <kbd className="px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8]">
                    Alt
                  </kbd>
                  <span className="text-xs text-[#73675C]">+</span>
                  <kbd className="px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8]">
                    S
                  </kbd>
                </div>
                <div className="text-xs font-medium text-[#241C18] dark:text-[#ECE4D8]">Clip from web</div>
                <div className="text-[11px] text-[#73675C] dark:text-[#A89B91]">Browser extension clipper</div>
              </div>

              <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3.5 dark:border-[#332722] dark:bg-[#14100E]">
                <div className="flex items-center gap-1.5 mb-2">
                  <kbd className="px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8]">
                    Ctrl / ⌘
                  </kbd>
                  <span className="text-xs text-[#73675C]">+</span>
                  <kbd className="px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8]">
                    V
                  </kbd>
                </div>
                <div className="text-xs font-medium text-[#241C18] dark:text-[#ECE4D8]">Instant Paste</div>
                <div className="text-[11px] text-[#73675C] dark:text-[#A89B91]">Direct clipboard ingest</div>
              </div>

              <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3.5 dark:border-[#332722] dark:bg-[#14100E]">
                <div className="flex items-center gap-1.5 mb-2">
                  <kbd className="px-2.5 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8]">
                    R
                  </kbd>
                </div>
                <div className="text-xs font-medium text-[#241C18] dark:text-[#ECE4D8]">Reach In</div>
                <div className="text-[11px] text-[#73675C] dark:text-[#A89B91]">Rediscovery keepsake drawer</div>
              </div>

              <div className="rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] p-3.5 dark:border-[#332722] dark:bg-[#14100E]">
                <div className="flex items-center gap-1.5 mb-2">
                  <kbd className="px-2 py-1 rounded border border-[#D9CEBC] bg-[#F1E9DC] font-mono text-xs font-semibold text-[#241C18] dark:border-[#332722] dark:bg-[#261E1A] dark:text-[#ECE4D8]">
                    Esc
                  </kbd>
                </div>
                <div className="text-xs font-medium text-[#241C18] dark:text-[#ECE4D8]">Dismiss</div>
                <div className="text-[11px] text-[#73675C] dark:text-[#A89B91]">Close drawers & modals</div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 7. CLOSING CALL TO ACTION                                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="py-20 sm:py-28 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <OctagonMedallion className="h-8 w-8" />
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#241C18] dark:text-[#ECE4D8]">
            Start your Pitaara.
          </h2>

          <p className="mt-4 max-w-md mx-auto text-base text-[#73675C] dark:text-[#A89B91]">
            A quiet, personal vault for the things you find and choose to keep.
          </p>

          <HeritageDivider className="my-8 max-w-xs mx-auto" />

          <div className="mt-4">
            <Link
              href="/vault"
              onClick={() => playDropSound()}
              className="inline-flex items-center gap-2.5 rounded-lg bg-[#A84B2C] hover:bg-[#8F3E23] text-[#FAF6F0] dark:bg-[#C5A059] dark:hover:bg-[#B89352] dark:text-[#14100E] font-medium px-8 py-3.5 text-base transition-all duration-200 active:translate-y-[1px] shadow-sm group"
            >
              <span>Open Pitaara</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* 8. MINIMAL HERITAGE FOOTER                                           */}
      {/* -------------------------------------------------------------------- */}
      <footer className="border-t border-[#D9CEBC] bg-[#F1E9DC]/60 py-8 dark:border-[#332722] dark:bg-[#1E1714]/60">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 text-xs text-[#73675C] dark:text-[#A89B91]">
          <div className="flex items-center gap-2">
            <OctagonMedallion className="h-5 w-5" />
            <span className="font-serif font-bold text-sm text-[#241C18] dark:text-[#ECE4D8]">
              Pitaara
            </span>
            <span>—</span>
            <span>A private curiosity vault</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-[#241C18] dark:hover:text-[#ECE4D8] transition-colors">
              Features
            </a>
            <a href="#shortcuts" className="hover:text-[#241C18] dark:hover:text-[#ECE4D8] transition-colors">
              Shortcuts
            </a>
            <Link href="/vault" className="hover:text-[#241C18] dark:hover:text-[#ECE4D8] transition-colors">
              Vault
            </Link>
            <div className="h-3 w-[1px] bg-[#D9CEBC] dark:bg-[#332722]" />
            <ThemeToggle />
          </div>
        </div>
      </footer>

      {/* Themed Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
