import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  const {
    data: { session },
  } = await locals.supabase.auth.getSession();

  // Si pas de session et qu'on n'est pas sur la page de login, rediriger
  if (!session && !url.pathname.includes('/admin/login')) {
    throw redirect(303, '/admin/login');
  }

  return {
    session,
  };
};

