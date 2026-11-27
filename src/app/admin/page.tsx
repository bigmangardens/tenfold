import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { SectionTitle, Stat } from "@/components/Stat";
import { CATEGORY_META, fmt, formatDate } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

type Analytics = {
  total_users: number;
  new_users_7d: number;
  players_today: number;
  practice_today: number;
  open_flags: number;
  active_questions: number;
  unused_daily_questions: number;
  scheduled_ahead: number;
  daily: { date: string; players: number; avg_score: number }[];
  categories: { category: string; answered: number; accuracy: number }[];
  hardest: { id: number; prompt: string; answered: number; accuracy: number }[];
};

export default async function AdminOverview() {
  const supabase = await createClient();
  const [{ data, error }, { data: top }, { data: log }] = await Promise.all([
    supabase.rpc("admin_analytics"),
    supabase.rpc("get_leaderboard", { p_period: "daily", p_scope: "global", p_limit: 10 }),
    supabase.from("admin_audit_log").select("id,action,target,created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  if (error) throw new Error(error.message);
  const a = data as Analytics;
  const max = Math.max(1, ...a.daily.map((d) => d.players));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Players" value={fmt(a.total_users)} hint={`+${a.new_users_7d} this week`} />
        <Stat label="Ranked today" value={fmt(a.players_today)} hint={`${fmt(a.practice_today)} practice runs`} />
        <Stat
          label="Open flags"
          value={<Link href="/admin/flags">{a.open_flags}</Link>}
          accent={a.open_flags ? "#F87171" : undefined}
          hint="suspicious scores"
        />
        <Stat
          label="Question bank"
          value={fmt(a.active_questions)}
          hint={`${a.unused_daily_questions} unused · ${a.scheduled_ahead} days scheduled`}
          accent={a.unused_daily_questions < 20 ? "#FFB547" : undefined}
        />
      </div>
      {a.unused_daily_questions < 20 && (
        <p className="rounded-xl border border-flame/30 bg-flame/10 px-4 py-3 text-sm text-flame">
          Fewer than 20 unused daily questions remain. Add more to avoid repeats.{" "}
          <Link className="underline" href="/admin/questions/new">
            Add a question
          </Link>
        </p>
      )}

      <section className="card p-5">
        <SectionTitle>Daily players, last 14 days</SectionTitle>
        <div className="flex h-40 items-end gap-2">
          {a.daily.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.players} players · avg ${d.avg_score}`}>
              <span className="text-[10px] text-ink-400">{d.players || ""}</span>
              <div className="w-full rounded-t-md bg-gradient-to-t from-brand to-aqua" style={{ height: `${(d.players / max) * 100}%`, minHeight: 2 }} />
              <span className="text-[10px] text-ink-400">{formatDate(d.date, { day: "numeric" })}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle action={<Link href="/leaderboards" className="text-sm text-brand-400">Public view →</Link>}>
            Leaderboard monitor (today)
          </SectionTitle>
          <div className="card overflow-hidden">
            <LeaderboardTable rows={(top ?? []) as LeaderboardRow[]} compact />
          </div>
        </section>
        <section className="space-y-6">
          <div>
            <SectionTitle>Accuracy by category</SectionTitle>
            <div className="card space-y-2.5 p-4">
              {a.categories.map((c) => (
                <div key={c.category} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0">
                    {CATEGORY_META[c.category]?.icon} {CATEGORY_META[c.category]?.label}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${c.accuracy}%`, background: CATEGORY_META[c.category]?.color }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-ink-300">{c.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle>Hardest questions</SectionTitle>
            <ul className="card overflow-hidden">
              {a.hardest.map((q) => (
                <li key={q.id} className="list-row text-sm">
                  <Link href={`/admin/questions/${q.id}`} className="flex-1 truncate hover:underline">
                    {q.prompt}
                  </Link>
                  <span className="text-bad">{q.accuracy}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section>
        <SectionTitle>Recent admin activity</SectionTitle>
        <ul className="card overflow-hidden text-sm">
          {(log ?? []).length ? (
            (log ?? []).map((l) => (
              <li key={l.id} className="list-row">
                <span className="chip">{l.action}</span>
                <span className="flex-1 truncate text-ink-300">{l.target}</span>
                <span className="text-xs text-ink-400">{new Date(l.created_at).toLocaleString("en-GB", { timeZone: "UTC" })} UTC</span>
              </li>
            ))
          ) : (
            <li className="px-4 py-6 text-center text-ink-400">No activity yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
