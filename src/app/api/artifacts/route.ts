import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ArtifactType } from '@/types/artifact';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
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

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as ArtifactType | 'all' | null;
    const query = searchParams.get('q');
    const favoritesOnly = searchParams.get('favorites') === 'true';
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const SELECT_FIELDS =
      'id, created_at, updated_at, user_id, type, title, description, raw_url, raw_content, quick_impression, dominant_color, media_url, favicon_url, site_name, author, is_favorite, view_count, last_rediscovered_at';

    // Filter items strictly by user_id: user.id
    let queryBuilder = supabase
      .from('artifacts')
      .select(SELECT_FIELDS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && type !== 'all') {
      queryBuilder = queryBuilder.eq('type', type);
    }

    if (favoritesOnly) {
      queryBuilder = queryBuilder.eq('is_favorite', true);
    }

    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,raw_content.ilike.%${query}%,quick_impression.ilike.%${query}%`
      );
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Fetch artifacts error:', error);
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json(data || [], {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing artifact id parameter.' }, { status: 400, headers: corsHeaders });
    }

    // Perform persistent deletion scoped to user_id
    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Delete failed:', message);
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { id, is_favorite, quick_impression } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing artifact id in body.' }, { status: 400, headers: corsHeaders });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_favorite === 'boolean') {
      updates.is_favorite = is_favorite;
    }
    if (typeof quick_impression === 'string') {
      updates.quick_impression = quick_impression;
    }

    const { data, error } = await supabase
      .from('artifacts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
