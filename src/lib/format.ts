export const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  history: { label: "History", icon: "🏺", color: "#F59E0B" },
  science: { label: "Science", icon: "🔬", color: "#22D3EE" },
  geography: { label: "Geography", icon: "🧭", color: "#34D399" },
  sport: { label: "Sport", icon: "🏅", color: "#F87171" },
  entertainment: { label: "Entertainment", icon: "🎬", color: "#F472B6" },
  technology: { label: "Technology", icon: "💾", color: "#818CF8" },
  literature: { label: "Literature", icon: "📖", color: "#FBBF24" },
  general: { label: "General", icon: "✨", color: "#A78BFA" },
};

export const DIFFICULTY_LABEL: Record<number, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };

export const fmt = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-US");

export function formatDate(d: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(d + (d.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Turns database error messages like "ALREADY_PLAYED: ..." into friendly text. */
export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  const [code, ...rest] = msg.split(":");
  const detail = rest.join(":").trim();
  const map: Record<string, string> = {
    ALREADY_PLAYED: "You've already played today's quiz. Come back tomorrow!",
    RATE_LIMITED: "You're going a little fast. Please wait a moment and try again.",
    BANNED: "This account has been suspended.",
    NOT_AUTHENTICATED: "Please sign in first.",
    FORBIDDEN: "You don't have access to that.",
    NOT_ENOUGH_QUESTIONS: "There aren't enough questions available right now.",
    ATTEMPT_FINISHED: "This quiz is already finished.",
    ALREADY_ANSWERED: "That question was already answered.",
  };
  if (map[code]) return map[code];
  if (detail && /^[A-Z_]+$/.test(code)) return detail.charAt(0).toUpperCase() + detail.slice(1);
  return msg;
}

export function safeNext(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
