import { createClient } from "$lib/supabase/server";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createClient(event.cookies);

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range";
    },
  });
};
