'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { playDropSound, playDrawerSound } from '@/lib/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
  onSuccess?: () => void;
  canDismiss?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultTab = 'signin',
  onSuccess,
  canDismiss = true,
}: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTabChange = (nextMode: 'signin' | 'signup') => {
    playDropSound();
    setMode(nextMode);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (data.session || data.user) {
          playDrawerSound();
          if (onSuccess) onSuccess();
          onClose();
          router.push('/vault');
          router.refresh();
        }
      } else {
        // Sign Up / Create Vault
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        playDrawerSound();

        // If email confirmation is enabled on Supabase, session may be null
        if (!data.session && data.user && data.user.identities && data.user.identities.length === 0) {
          setErrorMsg('An account with this email already exists. Please sign in instead.');
        } else if (!data.session) {
          setInfoMsg('Vault created! Please check your email inbox to confirm your account, then sign in.');
        } else {
          // Direct login if confirmation is disabled
          if (onSuccess) onSuccess();
          onClose();
          router.push('/vault');
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Authentication failed';
      // Format readable error messages
      if (errMessage.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid email or password. Please verify and try again.');
      } else if (errMessage.toLowerCase().includes('password should be at least')) {
        setErrorMsg('Password should be at least 6 characters long.');
      } else {
        setErrorMsg(errMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (canDismiss) {
          playDropSound();
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#D9CEBC] bg-[#F8F3EA] p-6 sm:p-8 text-[#241C18] shadow-2xl dark:border-[#332722] dark:bg-[#14100E] dark:text-[#ECE4D8] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss Button */}
        {canDismiss && (
          <button
            type="button"
            onClick={() => {
              playDropSound();
              onClose();
            }}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-[#73675C] hover:bg-[#F1E9DC] hover:text-[#241C18] dark:text-[#A89B91] dark:hover:bg-[#1E1714] dark:hover:text-[#ECE4D8] transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Brand Octagonal Medallion Emblem */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-[#C5A059] bg-[#F1E9DC] text-[#A84B2C] shadow-sm dark:bg-[#1E1714] dark:text-[#C5A059]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <path d="M7 8V5a5 5 0 0 1 10 0v3" />
              <circle cx="12" cy="14" r="1.5" fill="currentColor" />
              <path d="M12 15.5V17" />
            </svg>
            <span className="absolute top-1 left-1 h-1 w-1 rounded-full bg-[#C5A059]" />
            <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-[#C5A059]" />
          </div>

          <h2 className="mt-4 font-serif text-2xl font-bold tracking-tight text-[#241C18] dark:text-[#ECE4D8]">
            {mode === 'signin' ? 'Open Your Pitaara' : 'Create Your Vault'}
          </h2>
          <p className="mt-1 text-xs text-[#73675C] dark:text-[#A89B91]">
            A private, authenticated sanctuary for your web keepsakes.
          </p>
        </div>

        {/* Tab Switcher: Sign In / Create Vault */}
        <div className="mt-6 flex rounded-lg border border-[#D9CEBC] bg-[#F1E9DC] p-1 dark:border-[#332722] dark:bg-[#1E1714]">
          <button
            type="button"
            onClick={() => handleTabChange('signin')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              mode === 'signin'
                ? 'bg-[#F8F3EA] text-[#241C18] shadow-xs dark:bg-[#261E1A] dark:text-[#ECE4D8]'
                : 'text-[#73675C] hover:text-[#241C18] dark:text-[#A89B91] dark:hover:text-[#ECE4D8]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('signup')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              mode === 'signup'
                ? 'bg-[#F8F3EA] text-[#241C18] shadow-xs dark:bg-[#261E1A] dark:text-[#ECE4D8]'
                : 'text-[#73675C] hover:text-[#241C18] dark:text-[#A89B91] dark:hover:text-[#ECE4D8]'
            }`}
          >
            Create Vault
          </button>
        </div>

        {/* Notification / Error Messages */}
        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#A84B2C]/30 bg-[#A84B2C]/10 p-3 text-xs text-[#A84B2C] dark:border-[#C5A059]/30 dark:bg-[#C5A059]/10 dark:text-[#C5A059]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#73675C] dark:text-[#A89B91] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#73675C] dark:text-[#A89B91]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="curator@heritage.in"
                className="w-full rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] pl-9 pr-3 py-2 text-xs sm:text-sm text-[#241C18] placeholder-[#73675C]/50 focus:border-[#C5A059] focus:outline-none dark:border-[#3D302A] dark:bg-[#261E1A] dark:text-[#ECE4D8] dark:placeholder-[#A89B91]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#73675C] dark:text-[#A89B91] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#73675C] dark:text-[#A89B91]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#D9CEBC] bg-[#FAF6F0] pl-9 pr-3 py-2 text-xs sm:text-sm text-[#241C18] placeholder-[#73675C]/50 focus:border-[#C5A059] focus:outline-none dark:border-[#3D302A] dark:bg-[#261E1A] dark:text-[#ECE4D8] dark:placeholder-[#A89B91]/40"
              />
            </div>
          </div>

          {/* Solid Brass / Terracotta Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#A84B2C] hover:bg-[#8F3E23] text-[#FAF6F0] dark:bg-[#C5A059] dark:hover:bg-[#B89352] dark:text-[#14100E] font-medium py-2.5 text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === 'signin' ? 'Opening Vault...' : 'Creating Vault...'}</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Sign In to Pitaara' : 'Establish New Vault'}</span>
            )}
          </button>
        </form>

        {/* Footer Hint */}
        <div className="mt-5 text-center text-[11px] text-[#73675C] dark:text-[#A89B91]">
          {mode === 'signin' ? (
            <span>
              New to Pitaara?{' '}
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className="font-semibold text-[#A84B2C] dark:text-[#C5A059] hover:underline"
              >
                Create your vault
              </button>
            </span>
          ) : (
            <span>
              Already have a vault?{' '}
              <button
                type="button"
                onClick={() => handleTabChange('signin')}
                className="font-semibold text-[#A84B2C] dark:text-[#C5A059] hover:underline"
              >
                Sign in here
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

