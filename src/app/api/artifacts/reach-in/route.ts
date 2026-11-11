import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Artifact } from '@/types/artifact';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export interface RediscoveredPick {
  artifact: Artifact;
  badge_type: 'purani_khoj' | 'tarang' | 'anokha_tukda';
  badge_label: string;
  badge_sub: string;
  resonance_note?: string;
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

    // Fetch up to 100 artifacts belonging to this user ordered by created_at desc
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Reach-in query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    const items = (data || []) as Artifact[];
    if (items.length === 0) {
      return NextResponse.json({ picks: [] }, { status: 200, headers: corsHeaders });
    }

    const usedIds = new Set<string>();
    const picks: RediscoveredPick[] = [];

    // 1. "Purani Khoj" (Vintage Pick): Oldest created_at or lowest view_count
    const vintageCandidates = [...items].sort((a, b) => {
      const viewA = a.view_count ?? 0;
      const viewB = b.view_count ?? 0;
      if (viewA !== viewB) return viewA - viewB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const vintagePick = vintageCandidates.find((item) => !usedIds.has(item.id)) || vintageCandidates[0];
    if (vintagePick) {
      usedIds.add(vintagePick.id);
      picks.push({
        artifact: vintagePick,
        badge_type: 'purani_khoj',
        badge_label: 'Purani Khoj',
        badge_sub: 'Vintage Pick',
        resonance_note: 'Drawn from the depths of your vault, quiet and patiently waiting.',
      });
    }

    // 2. "Tarang" (Resonant Echo): Shares type or similar dominant_color with most recently saved item
    const mostRecent = items[0];
    let resonantCandidate = items.find(
      (item) =>
        !usedIds.has(item.id) &&
        (item.type === mostRecent.type ||
          (item.dominant_color && mostRecent.dominant_color && item.dominant_color === mostRecent.dominant_color))
    );

    // Fallback if no exact type/color match
    if (!resonantCandidate) {
      resonantCandidate = items.find((item) => !usedIds.has(item.id));
    }

    if (resonantCandidate) {
      usedIds.add(resonantCandidate.id);
      picks.push({
        artifact: resonantCandidate,
        badge_type: 'tarang',
        badge_label: 'Tarang',
        badge_sub: 'Resonant Echo',
        resonance_note:
          resonantCandidate.type === mostRecent.type
            ? `Echoes the form (${resonantCandidate.type.replace('_', ' ')}) of your latest inspiration.`
            : 'Harmonizes in shade and spirit with your recent collections.',
      });
    }

    // 3. "Anokha Tukda" (Wildcard): Purely random pick drawn from remaining
    const remainingItems = items.filter((item) => !usedIds.has(item.id));
    const wildcardPool = remainingItems.length > 0 ? remainingItems : items;
    const randomIndex = Math.floor(Math.random() * wildcardPool.length);
    const wildcardPick = wildcardPool[randomIndex];

    if (wildcardPick && !usedIds.has(wildcardPick.id)) {
      usedIds.add(wildcardPick.id);
      picks.push({
        artifact: wildcardPick,
        badge_type: 'anokha_tukda',
        badge_label: 'Anokha Tukda',
        badge_sub: 'Wildcard',
        resonance_note: 'A serendipitous fragment pulled by chance from the chest.',
      });
    }

    // Record rediscovery: increment view_count & update last_rediscovered_at
    const nowIso = new Date().toISOString();
    const updatePromises = picks.map((p) => {
      const nextCount = (p.artifact.view_count || 0) + 1;
      return supabase
        .from('artifacts')
        .update({
          view_count: nextCount,
          last_rediscovered_at: nowIso,
        })
        .eq('id', p.artifact.id)
        .eq('user_id', user.id);
    });

    // Fire update without blocking return
    Promise.allSettled(updatePromises).catch((err) => {
      console.warn('Failed to update rediscovery view_counts:', err);
    });

    return NextResponse.json({ picks }, { status: 200, headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
