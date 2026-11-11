export type ArtifactType =
  | 'url'
  | 'image'
  | 'quote'
  | 'github_repo'
  | 'tweet'
  | 'code_snippet';

export interface Artifact {
  id: string;
  created_at: string;
  updated_at?: string | null;
  user_id?: string | null;
  type: ArtifactType;
  title?: string | null;
  description?: string | null;
  raw_url?: string | null;
  raw_content?: string | null;
  quick_impression?: string | null;
  dominant_color?: string | null;
  media_url?: string | null;
  favicon_url?: string | null;
  site_name?: string | null;
  author?: string | null;
  is_favorite?: boolean | null;
  category?: 'visuals' | 'videos' | 'reads' | 'code' | string | null;
  view_count?: number | null;
  last_rediscovered_at?: string | null;
  // Aliases for compatibility
  url?: string | null;
  content?: string | null;
  summary?: string | null;
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  tags?: string[] | null;
}

export interface IngestPayload {
  raw_url?: string;
  raw_content?: string;
  quick_impression?: string;
  image_base64?: string;
}
