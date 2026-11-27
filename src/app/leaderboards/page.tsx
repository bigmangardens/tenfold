import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Countdown } from "@/components/Countdown";
import { CountryPicker } from "./CountryPicker";
import { countryName, flagEmoji } from "@/lib/countries";
import { fmt, ordinal } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboards" };

const PERIODS = [
  ["daily", "Today"],
  ["weekly", "This week"],
  ["alltime", "All time"],
] as const;
const SCOPES = [
  ["global", "Global"],
  ["country", "Country"],
  ["friends", "Friends"],
] as const;

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; scope?: string; country?: string }>;
}) {
  const sp = await searchParams;
  const period = PERIODS.some(([p]) => p === sp.period) ? sp.period! : "daily";
  const scope = SCOPES.some(([s]) => s === sp.scope) ? sp.scope! : "global";
  const { supabase, user } = await getSessionUser();

  let myCountry: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();
    myCountry = data?.country ?? null;
  }
  const country = (sp.country || myCountry || "US").toUpperCase();

  const needsLogin = scope === "friends" && !user;
  const [{ data: rows }, { data: me }] = await Promise.all([
    needsLogin
      ? Promise.resolve({ data: [] })
      : supabase.rpc("get_leaderboard", {
          p_period: period,
          p_scope: scope,
          p_country: scope === "country" ? country : null,
          p_limit: 100,
        }),
    user
      ? supabase.rpc("get_my_rank", { p_period: period, p_scope: scope, p_country: scope === "country" ? country : null })
      : Promise.resolve({ data: null }),
  ]);

  const href = (o: Record<string, string>) => {
    const p = new URLSearchParams({ period, scope, ...(scope === "country" ? { country } : {}), ...o });
    return `/leaderboards?${p.toString()}`;
  };
  const list = (rows ?? []) as LeaderboardRow[];
  const mine = me as { rank: number; score: number; of: number } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Leaderboards</h1>
          <p className="mt-1 text-sm text-ink-400">
            Daily boards reset in <Countdown className="font-semibold text-white" /> (00:00 UTC)
          </p>
        </div>
        {mine && (
          <div className="card px-4 py-3 text-right">
            <div className="text-[11px] uppercase tracking-wider text-ink-400">Your rank</div>
            <div className="font-display text-xl font-bold">
              {ordinal(mine.rank)} <span className="text-sm font-medium text-ink-400">of {fmt(mine.of)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-ink-700 bg-ink-900 p-1">
          {PERIODS.map(([p, label]) => (
            <Link key={p} href={href({ period: p })} className={`tab ${period === p ? "tab-active" : ""}`}>
              {label}
            </Link>
          ))}
        </div>
        <div className="flex rounded-xl border border-ink-700 bg-ink-900 p-1">
          {SCOPES.map(([s, label]) => (
            <Link key={s} href={href({ scope: s })} className={`tab ${scope === s ? "tab-active" : ""}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {scope === "country" && (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{flagEmoji(country)}</span>
          <CountryPicker value={country} />
          <span className="text-sm text-ink-400">Best players in {countryName(country)}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        {needsLogin ? (
          <div className="px-4 py-10 text-center text-sm text-ink-300">
            <Link href="/login?next=/leaderboards?scope=friends" className="text-brand-400 hover:underline">
              Log in
            </Link>{" "}
            to see how you stack up against friends.
          </div>
        ) : (
          <LeaderboardTable
            rows={list}
            showGames={period !== "daily"}
            empty={
              scope === "friends"
                ? "No friend scores yet. Add friends from the Friends page."
                : "No scores yet for this board."
            }
          />
        )}
      </div>
      <p className="text-center text-xs text-ink-400">
        Weekly and all-time boards add up official daily scores. Ties go to the faster total answer time.
      </p>
    </div>
  );
}
