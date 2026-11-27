import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { FriendButton } from "@/components/FriendButton";
import { Empty, SectionTitle, Stat } from "@/components/Stat";
import { StreakFlame } from "@/components/StreakFlame";
import { countryName, flagEmoji } from "@/lib/countries";
import { fmt, formatDate, ordinal } from "@/lib/format";
import type { Achievement, PublicProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: decodeURIComponent(username) };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { supabase, user } = await getSessionUser();
  const [{ data }, { data: all }] = await Promise.all([
    supabase.rpc("get_public_profile", { p_username: decodeURIComponent(username) }),
    supabase.from("achievements").select("id,name,description,icon,category").order("sort"),
  ]);
  if (!data) notFound();
  const p = data as PublicProfile;
  const earned = new Map((p.achievements ?? []).map((a) => [a.id, a]));
  const catalogue = (all ?? []) as Achievement[];

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar config={p.avatar} size={128} rounded="xl" className="ring-1 ring-white/10" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-4xl font-bold tracking-tight">{p.username}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-300">
              {p.country && (
                <span className="chip">
                  {flagEmoji(p.country)} {countryName(p.country)}
                </span>
              )}
              <span className="chip">Joined {formatDate(p.joined.slice(0, 10), { month: "short", year: "numeric" })}</span>
            </div>
            {p.bio && <p className="mt-3 max-w-xl text-ink-300">{p.bio}</p>}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            {p.stats && <StreakFlame days={p.stats.current_streak} size="lg" />}
            {p.is_me ? (
              <div className="flex gap-2">
                <Link href="/avatar" className="btn-ghost">
                  Edit avatar
                </Link>
                <Link href="/settings" className="btn-ghost">
                  Settings
                </Link>
              </div>
            ) : (
              <FriendButton username={p.username} initial={p.friendship} loggedIn={!!user} />
            )}
          </div>
        </div>
      </section>

      {p.stats ? (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Games played" value={fmt(p.stats.games_played)} hint={`${p.stats.accuracy}% valid answers`} />
          <Stat label="Average score" value={fmt(p.stats.average_score)} />
          <Stat label="Highest score" value={fmt(p.stats.best_score)} hint={`${p.stats.perfect_games} perfect`} accent="#B4A2FF" />
          <Stat label="Longest streak" value={`${p.stats.best_streak}d`} hint={`current ${p.stats.current_streak}d`} accent="#FFB547" />
          <Stat label="Login streak" value={`${p.stats.login_streak ?? 0}d`} hint={`best ${p.stats.best_login_streak ?? 0}d`} accent="#4EE3FF" />
        </section>
      ) : (
        <div className="card p-6 text-center text-sm text-ink-400">🔒 {p.username} keeps their stats private.</div>
      )}

      {p.ranks && (
        <section>
          <SectionTitle>Current rankings</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["Today", p.ranks.daily, "daily"],
                ["This week", p.ranks.weekly, "weekly"],
                ["All time", p.ranks.alltime, "alltime"],
              ] as const
            ).map(([label, rank, period]) => (
              <Link key={label} href={`/leaderboards?period=${period}`} className="card p-4 transition hover:border-brand/40">
                <div className="text-[11px] uppercase tracking-wider text-ink-400">{label}</div>
                <div className="mt-1 font-display text-2xl font-bold">{rank ? ordinal(rank) : "–"}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionTitle>
            Achievements{" "}
            {p.achievements && (
              <span className="text-sm font-normal text-ink-400">
                {p.achievements.length}/{p.achievement_total}
              </span>
            )}
          </SectionTitle>
          {p.achievements ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {catalogue.map((a) => {
                const got = earned.get(a.id);
                return (
                  <div
                    key={a.id}
                    title={a.description}
                    className={`card flex flex-col items-center p-3 text-center ${got ? "" : "opacity-35 grayscale"}`}
                  >
                    <span className="text-3xl">{a.icon}</span>
                    <span className="mt-2 text-xs font-semibold">{a.name}</span>
                    <span className="mt-0.5 text-[10px] leading-tight text-ink-400">{a.description}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-6 text-center text-sm text-ink-400">🔒 Private</div>
          )}
        </div>
        <div>
          <SectionTitle>Recent results</SectionTitle>
          <div className="card overflow-hidden">
            {p.recent ? (
              p.recent.length ? (
                <ul>
                  {p.recent.map((r) => (
                    <li key={r.quiz_date} className="list-row">
                      <span className="w-12 text-sm text-ink-400">#{r.quiz_number}</span>
                      <span className="flex-1 text-sm">{formatDate(r.quiz_date)}</span>
                      <span className="text-sm text-ink-400">{r.correct_count}/10</span>
                      <span className="w-16 text-right font-display font-semibold tabular-nums">{fmt(r.score)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No ranked games yet.</Empty>
              )
            ) : (
              <Empty>🔒 Private</Empty>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
