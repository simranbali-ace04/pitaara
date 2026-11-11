-- ==============================================================================
-- Pitaara Database Schema & Storage Configuration for Supabase
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create Artifacts Table
create table if not exists public.artifacts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  user_id uuid references auth.users(id) on delete cascade,
  
  -- Core Artifact Attributes
  type text not null check (type in ('url', 'image', 'quote', 'github_repo', 'tweet', 'code_snippet')),
  title text,
  description text,
  
  -- Content & Ingest Links
  raw_url text,
  raw_content text,
  quick_impression text,
  dominant_color text default '#C6A664',
  
  -- Extracted Metadata & Media
  media_url text,
  favicon_url text,
  site_name text,
  author text,
  is_favorite boolean default false,
  view_count integer default 0,
  last_rediscovered_at timestamp with time zone,
  
  -- Extensible JSON metadata
  metadata jsonb default '{}'::jsonb,
  tags text[] default array[]::text[]
);

-- 3. Indexes for fast filtering and search
alter table public.artifacts add column if not exists view_count integer default 0;
alter table public.artifacts add column if not exists last_rediscovered_at timestamp with time zone;

create index if not exists idx_artifacts_user_created on public.artifacts (user_id, created_at desc);
create index if not exists idx_artifacts_type on public.artifacts (type);
create index if not exists idx_artifacts_created_at on public.artifacts (created_at desc);
create index if not exists idx_artifacts_is_favorite on public.artifacts (is_favorite) where is_favorite = true;
create index if not exists idx_artifacts_search on public.artifacts using gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(raw_content, '') || ' ' || coalesce(quick_impression, ''))
);

-- 4. Enable Row-Level Security (RLS)
alter table public.artifacts enable row level security;

-- Scope read access to the authenticated owner
create policy "Allow read artifacts"
  on public.artifacts
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Scope insert access: allow background ingestion and authenticated saves
create policy "Allow insert artifacts"
  on public.artifacts
  for insert
  with check (true);

-- Scope update access: owner only
create policy "Allow update artifacts"
  on public.artifacts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Scope delete access: owner only
create policy "Allow delete artifacts"
  on public.artifacts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 5. Enable Supabase Realtime on artifacts table
alter publication supabase_realtime add table public.artifacts;

-- 6. Storage Bucket Configuration for Media Uploads
insert into storage.buckets (id, name, public)
values ('pitaara-media', 'pitaara-media', true)
on conflict (id) do nothing;

-- Storage RLS Policies for pitaara-media bucket
create policy "Public Access to pitaara-media"
  on storage.objects
  for select
  using (bucket_id = 'pitaara-media');

create policy "Allow public uploads to pitaara-media"
  on storage.objects
  for insert
  with check (bucket_id = 'pitaara-media');

create policy "Allow updates to pitaara-media"
  on storage.objects
  for update
  using (bucket_id = 'pitaara-media');

create policy "Allow deletes from pitaara-media"
  on storage.objects
  for delete
  using (bucket_id = 'pitaara-media');

