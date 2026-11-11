'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Link as LinkIcon,
  FileText,
  Code,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import type { IngestPayload, Artifact } from '@/types/artifact';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (artifact: Artifact) => void;
  onArtifactAdded?: (artifact: Artifact) => void;
}

type TabType = 'url' | 'text' | 'code' | 'image';

export function CaptureModal({ isOpen, onClose, onCreated, onArtifactAdded }: CaptureModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('url');
  const [rawUrl, setRawUrl] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [quickImpression, setQuickImpression] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageBase64(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setActiveTab('image');
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const payload: IngestPayload = {
      quick_impression: quickImpression.trim() || undefined,
    };

    if (activeTab === 'url') {
      if (!rawUrl.trim()) {
        setErrorMsg('Please enter a valid URL.');
        setIsLoading(false);
        return;
      }
      payload.raw_url = rawUrl.trim();
      if (rawContent.trim()) payload.raw_content = rawContent.trim();
    } else if (activeTab === 'image') {
      if (!imageBase64) {
        setErrorMsg('Please select or paste an image.');
        setIsLoading(false);
        return;
      }
      payload.image_base64 = imageBase64;
      if (rawContent.trim()) payload.raw_content = rawContent.trim();
    } else {
      if (!rawContent.trim()) {
        setErrorMsg('Please provide content for this artifact.');
        setIsLoading(false);
        return;
      }
      payload.raw_content = rawContent.trim();
      if (rawUrl.trim()) payload.raw_url = rawUrl.trim();
    }

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to capture artifact.');
      }

      if (onArtifactAdded) {
        onArtifactAdded(data);
      } else if (onCreated) {
        onCreated(data);
      }
      // Reset form
      setRawUrl('');
      setRawContent('');
      setQuickImpression('');
      setImageBase64(null);
      setImagePreview(null);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during ingestion.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-[#E3DACD] bg-[#FAF8F4] text-[#241E1A] shadow-2xl overflow-hidden dark:border-[#2D2621] dark:bg-[#1C1815] dark:text-[#EDE6DC]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E3DACD] px-6 py-4 dark:border-[#2D2621]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C86243]/15 text-[#C86243] dark:bg-[#E07A2B]/15 dark:text-[#E07A2B]">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-base font-serif font-bold text-[#241E1A] dark:text-[#EDE6DC]">
              Drop into Pitaara
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#241E1A] transition-all dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#EDE6DC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 border-b border-[#E3DACD] bg-[#EFE9DF]/60 p-1 dark:border-[#2D2621] dark:bg-[#131110]/60">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'url'
                ? 'bg-white text-[#241E1A] shadow-sm dark:bg-[#26211C] dark:text-[#EDE6DC]'
                : 'text-[#6A5F56] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:text-[#EDE6DC]'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>URL / Repo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'image'
                ? 'bg-white text-[#241E1A] shadow-sm dark:bg-[#26211C] dark:text-[#EDE6DC]'
                : 'text-[#6A5F56] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:text-[#EDE6DC]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'text'
                ? 'bg-white text-[#241E1A] shadow-sm dark:bg-[#26211C] dark:text-[#EDE6DC]'
                : 'text-[#6A5F56] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:text-[#EDE6DC]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Quote / Note</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'code'
                ? 'bg-white text-[#241E1A] shadow-sm dark:bg-[#26211C] dark:text-[#EDE6DC]'
                : 'text-[#6A5F56] hover:text-[#241E1A] dark:text-[#A69B8D] dark:hover:text-[#EDE6DC]'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Code</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {activeTab === 'url' && (
            <div>
              <label className="block text-xs font-medium text-[#241E1A] dark:text-[#EDE6DC] mb-1.5">
                Target URL (Web page, GitHub repo, or Tweet)
              </label>
              <input
                type="url"
                required
                value={rawUrl}
                onChange={(e) => setRawUrl(e.target.value)}
                placeholder="https://github.com/facebook/react or https://..."
                className="w-full rounded-xl border border-[#E3DACD] bg-white px-3.5 py-2.5 text-sm text-[#241E1A] placeholder-[#6A5F56]/60 focus:border-[#C6A664] focus:outline-none focus:ring-1 focus:ring-[#C6A664] dark:border-[#2D2621] dark:bg-[#131110] dark:text-[#EDE6DC] dark:placeholder-[#A69B8D]/60 dark:focus:border-[#B89352] dark:focus:ring-[#B89352]"
              />
            </div>
          )}

          {activeTab === 'image' && (
            <div>
              <label className="block text-xs font-medium text-[#241E1A] dark:text-[#EDE6DC] mb-1.5">
                Upload or Drop Image
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />

              {imagePreview ? (
                <div className="relative rounded-xl border border-[#E3DACD] bg-white overflow-hidden max-h-52 flex items-center justify-center dark:border-[#2D2621] dark:bg-[#131110]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="max-h-52 object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageBase64(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E3DACD] bg-white/60 p-6 text-center cursor-pointer hover:border-[#C6A664] hover:bg-white transition-all dark:border-[#2D2621] dark:bg-[#131110]/60 dark:hover:border-[#B89352] dark:hover:bg-[#131110]"
                >
                  <UploadCloud className="h-8 w-8 text-[#6A5F56] dark:text-[#A69B8D] mb-2" />
                  <p className="text-sm font-medium text-[#241E1A] dark:text-[#EDE6DC]">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-[#6A5F56] dark:text-[#A69B8D] mt-1">PNG, JPG, WebP, GIF or SVG</p>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'text' || activeTab === 'code') && (
            <div>
              <label className="block text-xs font-medium text-[#241E1A] dark:text-[#EDE6DC] mb-1.5">
                {activeTab === 'code' ? 'Code Snippet' : 'Quote or Note Content'}
              </label>
              <textarea
                rows={4}
                required
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder={
                  activeTab === 'code'
                    ? 'const example = () => {\n  console.log("Pitaara code snippet");\n};'
                    : 'The only way to do great work is to love what you do. — Steve Jobs'
                }
                className="w-full font-mono text-xs rounded-xl border border-[#E3DACD] bg-white p-3 text-[#241E1A] placeholder-[#6A5F56]/60 focus:border-[#C6A664] focus:outline-none focus:ring-1 focus:ring-[#C6A664] dark:border-[#2D2621] dark:bg-[#131110] dark:text-[#EDE6DC] dark:placeholder-[#A69B8D]/60 dark:focus:border-[#B89352] dark:focus:ring-[#B89352]"
              />
            </div>
          )}

          {/* Quick Impression */}
          <div>
            <label className="block text-xs font-medium text-[#241E1A] dark:text-[#EDE6DC] mb-1.5">
              Quick Impression / Note <span className="text-[#6A5F56] dark:text-[#A69B8D]">(Optional)</span>
            </label>
            <input
              type="text"
              value={quickImpression}
              onChange={(e) => setQuickImpression(e.target.value)}
              placeholder="Why this matters, key takeaway, or project tags..."
              className="w-full rounded-xl border border-[#E3DACD] bg-white px-3.5 py-2.5 text-sm text-[#241E1A] placeholder-[#6A5F56]/60 focus:border-[#C6A664] focus:outline-none focus:ring-1 focus:ring-[#C6A664] dark:border-[#2D2621] dark:bg-[#131110] dark:text-[#EDE6DC] dark:placeholder-[#A69B8D]/60 dark:focus:border-[#B89352] dark:focus:ring-[#B89352]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-[#E3DACD] px-4 py-2.5 text-xs font-medium text-[#6A5F56] hover:bg-[#EFE9DF] hover:text-[#241E1A] transition-all disabled:opacity-50 dark:border-[#2D2621] dark:text-[#A69B8D] dark:hover:bg-[#26211C] dark:hover:text-[#EDE6DC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-[#241E1A] text-[#F7F3EB] px-5 py-2.5 text-xs font-semibold shadow-md hover:bg-[#38312B] active:scale-95 transition-all disabled:opacity-50 dark:bg-[#D4AF37] dark:text-[#131110] dark:hover:bg-[#E6C35C]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting & Ingesting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Store in Pitaara</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
