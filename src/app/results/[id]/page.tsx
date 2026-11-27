import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { ShareButtons } from "@/components/ShareButtons";
import { CATEGORY_META, fmt, formatDate, ordinal } from "@/lib/format";
import { shareText, shareUrl } from "@/lib/share";
import type { AttemptReview } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Results" };

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSessionUser();
  const [{ data, error }, { data: stats }] = await Promise.all([
    supabase.rpc("get_attempt_review", { p_attempt: id }),
    supabase.from("user_stats").select("current_streak").maybeSingle(),
  ]);
  if (error || !data) notFound();
  const r = data as AttemptReview;
  const ranked = r.mode === "ranked";
  const text = shareText({
    quiz_number: r.quiz_number,
    score: r.score,
    correct: r.answers.map((a) => a.is_correct),
    streak: stats?.current_streak,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-aqua/15 blur-3xl" />
        <div className="relative">
          <div className="text-sm text-ink-400">
            {ranked ? `Daily quiz #${r.quiz_number}` : "Practice"} · {formatDate(r.quiz_date, { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="font-display text-6xl font-bold tabular-nums text-gradient">{fmt(r.score)}</div>
              <div className="text-sm text-ink-400">of {fmt(r.max_score)} points</div>
            </div>
            <div className="pb-2 text-ink-200">
              <b className="text-white">{r.correct_count}/10</b> correct · {(r.total_time_ms / 1000).toFixed(1)}s total
              {ranked && r.daily_rank && (
                <>
                  {" "}
                  · <b className="text-white">{ordinal(r.daily_rank)}</b> today
                </>
              )}
            </div>
          </div>
          <div className="mt-5 flex gap-1.5">
            {r.answers.map((a) => (
              <span
                key={a.position}
                className={`h-3 flex-1 rounded-full ${a.is_correct ? "bg-good" : "bg-bad"}`}
                title={`Q${a.position}: ${a.points} pts`}
              />
            ))}
          </div>
          {ranked && (
            <div className="mt-6 space-y-3">
              <pre className="whitespace-pre-wrap rounded-xl bg-ink-900 p-3 font-sans text-sm text-ink-200">{text}</pre>
              <ShareButtons text={text} url={shareUrl(r.attempt_id)} />
              <p className="text-xs text-ink-400">Shared results never reveal the questions or answers.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Question review</h2>
        <ol className="space-y-3">
          {r.answers.map((a) => {
            const meta = CATEGORY_META[a.category];
            return (
              <li key={a.position} className="card p-5">
                <div className="flex items-center justify-between gap-3 text-xs text-ink-400">
                  <span>
                    Q{a.position} · {meta?.icon} {meta?.label}
                  </span>
                  <span className={a.is_correct ? "font-semibold text-good" : "font-semibold text-bad"}>
                    {a.is_correct
                      ? `+${fmt(a.points)} · ${((a.elapsed_ms ?? 0) / 1000).toFixed(1)}s`
                      : a.selected_index === null
                        ? "Timed out"
                        : "Wrong"}
                  </span>
                </div>
                <p className="mt-2 font-medium">{a.prompt}</p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {a.options.map((o, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border px-3 py-2 ${
                        i === a.correct_index
                          ? "border-good/50 bg-good/10 text-white"
                          : i === a.selected_index
                            ? "border-bad/50 bg-bad/10 text-white"
                            : "border-white/[0.05] text-ink-400"
                      }`}
                    >
                      {o}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-ink-300">{a.explanation}</p>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/leaderboards" className="btn-primary">
          Leaderboards
        </Link>
        <Link href="/practice" className="btn-ghost">
          Practice mode
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
