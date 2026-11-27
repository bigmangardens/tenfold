/** Public Supabase settings. Use the publishable key (sb_publishable_...); the legacy anon key also works. */

// Tolerate common copy-paste slips in the env var: spaces, trailing slashes or a trailing dot
// ("https://x.supabase.co." works on the server but fails in browsers with "Load failed").
function cleanUrl(raw: string | undefined) {
  const v = (raw ?? "").trim();
  try {
    const u = new URL(v);
    u.hostname = u.hostname.replace(/\.+$/, "");
    return u.origin;
  } catch {
    return v.replace(/[./]+$/, "");
  }
}

export const SUPABASE_URL = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_KEY = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""
).trim();
