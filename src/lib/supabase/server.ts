import { createServerClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Server client bound to the signed-in user's session (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component; middleware refreshes the session.
          }
        },
      },
    },
  );
}

/** Anonymous client with no session, for public data (share cards, OG images). */
export function createAnonClient() {
  return createPlainClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
