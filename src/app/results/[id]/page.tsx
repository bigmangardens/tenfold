import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { ShareButtons } from "@/components/ShareButtons";
import { RevealLists, TierBadge } from "@/components/quiz/QuizRunner";
import { CATEGORY_META, fmt, formatDate, ordinal } from "@/lib/format";
import { fmtPct, tierOf } from "@/lib/rarity";
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
    cells: r.answers.map((a) => ({ ok: a.valid, pct: a.pct })),
    streak: stats?.current_streak,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="card p-6 sm:p-8">
        <div className="text-ink-400">
          {ranked ? `Daily hunt #${r.quiz_number}` : "Practice"} · {formatDate(r.quiz_date, { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <div className="font-arcade text-4xl tabular-nums text-gradient sm:text-5xl">{fmt(r.score)}</div>
            <div className="mt-2 text-ink-400">of {fmt(r.max_score)} points</div>
          </div>
          <div className="pb-2 text-ink-200">
            <b className="text-white">{r.correct_count}/10</b> valid answers
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
              className="h-4 flex-1 border-2 border-black"
              style={{ background: a.valid ? tierOf(a.pct)?.color : "#FF5470" }}
              title={`#${a.position}: ${a.points} pts`}
            />
          ))}
        </div>
        {ranked && (
          <div className="mt-6 space-y-3">
            <pre className="whitespace-pre-wrap border-2 border-ink-700 bg-ink-950 p-3 font-sans text-ink-200">{text}</pre>
            <ShareButtons text={text} url={shareUrl(r.attempt_id)} />
            <p className="text-sm text-ink-400">Shared results never reveal the prompts or answers.</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-arcade text-sm uppercase text-ink-200">Your answers</h2>
        <ol className="space-y-3">
          {r.answers.map((a) => {
            const meta = CATEGORY_META[a.category];
            return (
              <li key={a.position} className="card p-5">
                <div className="flex items-center justify-between gap-3 text-sm text-ink-400">
                  <span>
                    #{a.position} · {meta?.icon} {meta?.label}
                  </span>
                  <span className={`font-arcade text-xs ${a.valid ? "" : "text-bad"}`} style={a.valid ? { color: tierOf(a.pct)?.color } : undefined}>
                    {a.valid ? `+${fmt(a.points)}` : a.typed ? "Miss" : "Time's up"}
                  </span>
                </div>
                <p className="mt-2 text-xl font-bold">{a.prompt}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {a.valid ? (
                    <>
                      <TierBadge pct={a.pct} />
                      <span className="text-lg">{a.answer}</span>
                      <span className="text-ink-400">
                        {fmtPct(a.pct)} of players
                        {a.typed && a.answer && a.typed.toLowerCase() !== a.answer.toLowerCase() ? ` · you typed “${a.typed}”` : ""}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-300">{a.typed ? `“${a.typed}” isn't on the list` : "No answer"}</span>
                  )}
                </div>
                <div className="mt-4">
                  <RevealLists top={a.reveal.top} rare={a.reveal.rare} total={a.reveal.total} mine={a.answer} />
                </div>
                {a.note && <p className="mt-3 border-l-4 border-ink-600 pl-3 text-ink-300">{a.note}</p>}
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
