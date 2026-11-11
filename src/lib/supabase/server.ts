import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const FORTY_FIVE_DAYS_IN_SECONDS = 60 * 60 * 24 * 45; // 3,888,000s

export async function createClient(authHeader?: string) {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // cookies() may throw outside of request contexts
  }

  const globalHeaders: Record<string, string> = {};
  if (authHeader?.startsWith('Bearer ')) {
    globalHeaders['Authorization'] = authHeader;
  }

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: FORTY_FIVE_DAYS_IN_SECONDS,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            );
          } catch {
            // Invoked from Server Component where cookies cannot be written directly
          }
        },
      },
      global: {
        headers: globalHeaders,
      },
    }
  );
}

// Backwards-compatibility alias for routes expecting createServerClient
export const createServerClient = createClient;
