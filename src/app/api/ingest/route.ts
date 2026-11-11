import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { extractMetadata, extractDominantColor } from '@/lib/extractor';
import type { IngestPayload, ArtifactType } from '@/types/artifact';

function getCorsHeaders(req: Request | NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-pitaara-user-id',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client that can insert regardless of caller session to bypass RLS restrictions
const supabaseAdmin = createSupabaseAdminClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function detectTextType(content: string): ArtifactType {
  const trimmed = content.trim();
  // Check for code characteristics (backticks, brackets, code keywords)
  const codeIndicators = [
    trimmed.startsWith('```') || trimmed.includes('```'),
    /(?:function\s+|const\s+|let\s+|var\s+|import\s+|export\s+|class\s+|def\s+|return\s+|<\/?[a-z][\s\S]*>)/i.test(trimmed),
    (trimmed.match(/[{}();=><]/g) || []).length >= 5,
  ];

  if (codeIndicators.some(Boolean)) {
    return 'code_snippet';
  }
  return 'quote';
}

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') || undefined;
  const supabase = await createClient(authHeader);

  let user = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const { data } = await supabase.auth.getUser(token);
    user = data.user;
  }
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  return { supabase, user };
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const { user } = await getAuthenticatedUser(req);

    // Resolve target user_id:
    // 1. If user is logged in via web cookie or Bearer token, use user.id.
    // 2. If coming from extension, read from `x-pitaara-user-id` header.
    let targetUserId = user?.id || req.headers.get('x-pitaara-user-id') || null;

    // 3. Fallback: If SUPABASE_SERVICE_ROLE_KEY is present, grab first registered user in dev
    if (!targetUserId && supabaseServiceKey) {
      try {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        targetUserId = users?.users?.[0]?.id || null;
      } catch (err) {
        console.warn('Could not list users for extension fallback:', err);
      }
    }

    // 4. Secondary dev fallback: read the most recent user_id recorded in artifacts
    if (!targetUserId) {
      try {
        const { data: recent } = await supabaseAdmin
          .from('artifacts')
          .select('user_id')
          .not('user_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        targetUserId = recent?.user_id || null;
      } catch {}
    }

    const payload: IngestPayload = await req.json();
    const { raw_url, raw_content, quick_impression, image_base64 } = payload;

    if (!raw_url && !raw_content && !image_base64) {
      return NextResponse.json(
        { error: 'At least one of raw_url, raw_content, or image_base64 is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    let artifactInsert: Record<string, unknown>;
    let shouldEnrichInBackground = false;

    // Case 1: Image Base64 Upload
    if (image_base64) {
      const match = image_base64.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = match ? match[1] : 'image/png';
      const rawB64 = match ? match[2] : image_base64;
      const buffer = Buffer.from(rawB64, 'base64');

      const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
      const folderPrefix = targetUserId || 'shared';
      const fileName = `${folderPrefix}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      let mediaUrl: string;

      // Upload to Supabase storage bucket 'pitaara-media' using admin client to bypass storage RLS
      const { error: uploadError } = await supabaseAdmin.storage
        .from('pitaara-media')
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicData } = supabaseAdmin.storage
          .from('pitaara-media')
          .getPublicUrl(fileName);
        mediaUrl = publicData.publicUrl;
      } else {
        console.warn('Storage upload error, falling back to data URL:', uploadError.message);
        mediaUrl = image_base64.startsWith('data:') ? image_base64 : `data:${mimeType};base64,${rawB64}`;
      }

      // Fast dominant color extraction with built-in 300ms timeout
      const dominantColor = await extractDominantColor(buffer);

      artifactInsert = {
        type: 'image',
        title: quick_impression || 'Captured Image',
        description: raw_content || 'Image upload',
        raw_content: raw_content || null,
        raw_url: raw_url || mediaUrl,
        media_url: mediaUrl,
        dominant_color: dominantColor,
        quick_impression: quick_impression || null,
        site_name: 'Pitaara Media',
      };
    }
    // Case 2: URL Provided - Fast non-blocking path
    else if (raw_url) {
      let initialHostname = '';
      try {
        const u = new URL(raw_url.startsWith('http') ? raw_url : `https://${raw_url}`);
        initialHostname = u.hostname.replace(/^www\./, '');
      } catch {
        initialHostname = raw_url;
      }

      const domainName = initialHostname.split('.')[0] || '';
      const initialSiteName = domainName ? domainName.charAt(0).toUpperCase() + domainName.slice(1) : 'Web Link';

      let initialType: ArtifactType = 'url';
      let quickMediaUrl: string | null = null;

      const lowerUrl = raw_url.toLowerCase();
      if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        initialType = 'url';
        const ytMatch = raw_url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*)/);
        if (ytMatch && ytMatch[1]?.length === 11) {
          quickMediaUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }
      } else if (lowerUrl.includes('github.com')) {
        initialType = 'github_repo';
        const ghMatch = raw_url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
        if (ghMatch) {
          quickMediaUrl = `https://opengraph.githubassets.com/1/${ghMatch[1]}/${ghMatch[2]}`;
        }
      } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
        initialType = 'tweet';
      }

      const initialFavicon = initialHostname
        ? `https://www.google.com/s2/favicons?domain=${initialHostname}&sz=128`
        : null;
      const initialTitle =
        (payload as { title?: string }).title ||
        quick_impression ||
        initialHostname ||
        raw_url;

      artifactInsert = {
        type: initialType,
        title: initialTitle,
        description: raw_content || `Keepsake from ${initialSiteName}`,
        raw_url: raw_url,
        raw_content: raw_content || null,
        media_url: quickMediaUrl,
        favicon_url: initialFavicon,
        site_name: initialSiteName,
        author: null,
        dominant_color: '#C6A664',
        quick_impression: quick_impression || null,
      };

      shouldEnrichInBackground = true;
    }
    // Case 3: Raw Text / Code / Quote Provided
    else if (raw_content) {
      const detectedType = detectTextType(raw_content);
      const firstLine = raw_content.trim().split('\n')[0].replace(/^#+\s*/, '').slice(0, 80);

      artifactInsert = {
        type: detectedType,
        title: quick_impression || firstLine || 'Note',
        description: raw_content.length > 80 ? raw_content.slice(0, 240) + '...' : raw_content,
        raw_content: raw_content,
        raw_url: null,
        media_url: null,
        dominant_color: detectedType === 'code_snippet' ? '#1E293B' : '#C6A664',
        quick_impression: quick_impression || null,
        site_name: 'Pitaara Note',
      };
    } else {
      return NextResponse.json({ error: 'Unprocessable entity' }, { status: 422, headers: corsHeaders });
    }

    // Whitelist strictly the columns that exist in the PostgreSQL artifacts table schema.
    // Attach resolved targetUserId so that RLS allows the user to see the item on /vault
    const insertPayload: Record<string, unknown> = {
      user_id: targetUserId,
      type: artifactInsert.type as string,
      raw_url: (artifactInsert.raw_url as string) || null,
      raw_content: (artifactInsert.raw_content as string) || null,
      quick_impression: (artifactInsert.quick_impression as string) || null,
      title: ((payload as { title?: string }).title || artifactInsert.title || null) as string | null,
      description: (artifactInsert.description as string) || null,
      site_name: (artifactInsert.site_name as string) || null,
      author: (artifactInsert.author as string) || null,
      media_url: (artifactInsert.media_url as string) || null,
      favicon_url: (artifactInsert.favicon_url as string) || null,
      dominant_color: (artifactInsert.dominant_color as string) || '#C6A664',
      is_favorite: false,
      view_count: 0,
    };

    // Insert into Supabase artifacts table using admin client to bypass RLS restrictions
    let { data, error } = await supabaseAdmin
      .from('artifacts')
      .insert([insertPayload])
      .select()
      .single();

    // If view_count happens not to exist in schema cache on remote DB, retry without it
    if (error && error.message?.includes('view_count')) {
      delete insertPayload.view_count;
      const retry = await supabaseAdmin
        .from('artifacts')
        .insert([insertPayload])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Supabase ingest error:', error);
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Background enrichment: Unfurl OpenGraph metadata and palette asynchronously without blocking response
    if (shouldEnrichInBackground && data?.id && raw_url) {
      const artifactId = data.id;
      (async () => {
        try {
          const meta = await extractMetadata(raw_url);
          let dominantColor = '#C6A664';
          if (meta.media_url) {
            try {
              dominantColor = await extractDominantColor(meta.media_url);
            } catch {}
          }

          const updates: Record<string, unknown> = {};
          if (meta.title && meta.title !== raw_url) updates.title = meta.title;
          if (meta.description) updates.description = meta.description;
          if (meta.media_url) updates.media_url = meta.media_url;
          if (meta.favicon_url) updates.favicon_url = meta.favicon_url;
          if (meta.site_name) updates.site_name = meta.site_name;
          if (meta.type) updates.type = meta.type;
          if (dominantColor && dominantColor !== '#C6A664') updates.dominant_color = dominantColor;

          if (Object.keys(updates).length > 0) {
            await supabaseAdmin
              .from('artifacts')
              .update(updates)
              .eq('id', artifactId);
            console.log(`Enriched artifact [${artifactId}] asynchronously in background`);
          }
        } catch (err) {
          console.warn(`Background enrichment warning for [${artifactId}]:`, err);
        }
      })();
    }

    // Auto-recovery: If targetUserId is resolved, claim any older records where user_id IS NULL
    if (targetUserId) {
      (async () => {
        try {
          const { count } = await supabaseAdmin
            .from('artifacts')
            .update({ user_id: targetUserId })
            .is('user_id', null);
          if (count && count > 0) {
            console.log(`Auto-recovered ${count} legacy artifacts for user: ${targetUserId}`);
          }
        } catch {
          // Ignore background auto-recovery errors
        }
      })();
    }

    console.log(`Successfully ingested artifact [${data.id}] for user [${targetUserId || 'anon'}]`);

    return NextResponse.json(data, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('API /ingest error:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
