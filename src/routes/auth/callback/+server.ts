import { createClient } from '$lib/supabase/server';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/admin';

  if (code) {
    const supabase = createClient(cookies);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      throw redirect(303, next);
    }
  }

  // En cas d'erreur, rediriger vers la page de login
  throw redirect(303, '/admin/login');
};

