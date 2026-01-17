import { createServerClient } from '@supabase/ssr';
import type { Cookies } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './types';

export function createClient(cookies: Cookies) {
  return createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (options) {
                cookies.set(name, value, { ...options, path: options.path || '/' });
              } else {
                cookies.set(name, value, { path: '/' });
              }
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

