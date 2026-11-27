import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { Countdown } from "@/components/Countdown";
import { Flag } from "@/components/Flag";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { Empty, SectionTitle, Stat } from "@/components/Stat";
import { StreakFlame } from "@/components/StreakFlame";
import { fmt, formatDate, ordinal } from "@/lib/format";
import type { Dashboard, LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login");

  const [{ data, error }, { data: top }] = await Promise.all([
    supabase.rpc("get_dashboard"),
    supabase.rpc("get_leaderboard", { p_period: "daily", p_scope: "global", p_limit: 5 }),
  ]);
  if (error || !data) throw new Error(error?.message ?? "Could not load dashboard");
  const d = data as Dashboard;
  const t = d.today;
  const s = d.stats;

  return (
    <div className="space-y-8">
      {d.profile.is_banned && (
        <div className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          This account is suspended and can&apos;t play ranked quizzes. Contact support if you think this is a mistake.
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card relative overflow-hidden p-6 sm:p-8">
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <Link href="/avatar" className="group relative self-start">
              <Avatar config={d.avatar} size={96} rounded="xl" className="ring-1 ring-white/10" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-ink-700 px-2 py-0.5 text-[10px] font-semibold text-ink-200 opacity-0 transition group-hover:opacity-100">
                Edit
              </span>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <span>Hunt #{t.quiz_number}</span>·<span>{formatDate(t.quiz_date, { weekday: "long", month: "long", day: "numeric" })}</span>
              </div>
              <h1 className="mt-1 flex items-center gap-2 truncate font-display text-3xl font-bold tracking-tight">
                {d.profile.username} <Flag code={d.profile.country} className="text-2xl" />
              </h1>

              {t.status === "finished" ? (
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ink-400">Today&apos;s score</div>
                    <div className="font-display text-3xl font-bold text-gradient">{fmt(t.score)}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-ink-400">Rank</div>
                    <div className="font-display text-3xl font-bold">
                      {t.rank ? ordinal(t.rank) : "–"} <span className="text-base font-medium text-ink-400">of {fmt(t.players)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/results/${t.attempt_id}`} className="btn-ghost">
                      Review & share
                    </Link>
                    <Link href="/practice" className="btn-ghost">
                      Practice
                    </Link>
                  </div>
                  <p className="w-full text-sm text-ink-400">
                    Next hunt in <Countdown className="font-semibold text-white" />
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <p className="text-ink-300">
                    {t.status === "in_progress"
                      ? "You have a hunt in progress. The clock keeps running, so jump back in."
                      : `${fmt(t.players)} players have already played today's hunt.`}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href="/play" className="btn-primary px-7 py-3 text-base">
                      {t.status === "in_progress" ? "Resume hunt" : "Play today's hunt"} →
                    </Link>
                    <span className="text-sm text-ink-400">
                      Closes in <Countdown className="font-semibold text-white" />
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-between p-6">
          <div className="text-xs font-medium uppercase tracking-wider text-ink-400">Current streak</div>
          <div className="my-3">
            <StreakFlame days={s.current_streak} size="lg" />
          </div>
          <p className="text-sm text-ink-300">
            {t.streak_at_risk && t.status !== "finished"
              ? "🔥 Play today to keep your streak alive!"
              : s.current_streak > 0
                ? `Best ever: ${s.best_streak} day${s.best_streak === 1 ? "" : "s"}. Come back tomorrow to make it ${s.current_streak + 1}.`
                : "Play today to start a streak."}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Games played" value={fmt(s.games_played)} hint={`${fmt(s.practice_games)} practice`} />
        <Stat label="Average score" value={fmt(s.average_score)} hint={`${s.accuracy}% valid answers`} />
        <Stat label="Best score" value={fmt(s.best_score)} hint={`${s.perfect_games} perfect`} accent="#B4A2FF" />
        <Stat label="Best streak" value={`${s.best_streak}d`} hint="consecutive days" accent="#FFB547" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle action={<Link href="/leaderboards" className="text-sm text-brand-400 hover:underline">Full leaderboard →</Link>}>
            Today&apos;s top players
          </SectionTitle>
          <div className="card overflow-hidden">
            <LeaderboardTable rows={(top ?? []) as LeaderboardRow[]} compact />
          </div>
        </div>
        <div>
          <SectionTitle
            action={
              <Link href={`/u/${d.profile.username}`} className="text-sm text-brand-400 hover:underline">
                {d.achievement_count}/{d.achievement_total}
              </Link>
            }
          >
            Recent achievements
          </SectionTitle>
          <div className="card divide-y divide-white/[0.05]">
            {d.recent_achievements.length ? (
              d.recent_achievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-xl">{a.icon}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{a.name}</div>
                    <div className="truncate text-xs text-ink-400">{a.description}</div>
                  </div>
                </div>
              ))
            ) : (
              <Empty>Finish your first hunt to earn one.</Empty>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Recent hunts</SectionTitle>
        <div className="card overflow-hidden">
          {d.history.length ? (
            <ul>
              {d.history.map((h) => (
                <li key={h.attempt_id} className="list-row">
                  <span className="w-20 text-sm text-ink-400">#{h.quiz_number}</span>
                  <span className="flex-1 text-sm">{formatDate(h.quiz_date, { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span className="hidden text-sm text-ink-400 sm:block">{h.correct_count}/10 valid</span>
                  <span className="w-20 text-right font-display font-semibold tabular-nums">{fmt(h.score)}</span>
                  <Link href={`/results/${h.attempt_id}`} className="text-sm text-brand-400 hover:underline">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No ranked hunts yet.</Empty>
          )}
        </div>
      </section>
    </div>
  );
}
