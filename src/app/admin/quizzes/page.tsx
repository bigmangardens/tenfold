import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { deleteQuiz, generateQuiz } from "./actions";

function addDays(d: string, n: number) {
  const t = new Date(d + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

export default async function QuizSchedule() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const from = addDays(today, -7);
  const to = addDays(today, 21);
  const [{ data: quizzes }, { data: attempts }] = await Promise.all([
    supabase.from("daily_quizzes").select("id,quiz_date,auto_generated").gte("quiz_date", from).lte("quiz_date", to),
    supabase.from("quiz_attempts").select("quiz_date").eq("mode", "ranked").gte("quiz_date", from).not("finished_at", "is", null),
  ]);
  const byDate = new Map((quizzes ?? []).map((q) => [q.quiz_date, q]));
  const players = new Map<string, number>();
  (attempts ?? []).forEach((a) => players.set(a.quiz_date, (players.get(a.quiz_date) ?? 0) + 1));
  const days = Array.from({ length: 29 }, (_, i) => addDays(from, i));

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-400">
        Quizzes go live at 00:00 UTC and lock once the day starts. Any day without a scheduled quiz gets a balanced one
        generated automatically when the first player arrives.
      </p>
      <div className="card overflow-hidden">
        <ul>
          {days.map((d) => {
            const q = byDate.get(d);
            const future = d > today;
            const isToday = d === today;
            return (
              <li key={d} className={`list-row flex-wrap ${isToday ? "bg-brand/[0.07]" : ""}`}>
                <span className="w-40 text-sm">
                  {formatDate(d, { weekday: "short", month: "short", day: "numeric" })}
                  {isToday && <span className="chip ml-2 border-brand/40 text-brand-400">today</span>}
                </span>
                <span className="flex-1 text-sm">
                  {q ? (
                    <span className={q.auto_generated ? "text-ink-300" : "text-good"}>
                      {q.auto_generated ? "Auto-generated" : "Hand-picked"}
                    </span>
                  ) : (
                    <span className="text-ink-400">{future ? "Not scheduled (will auto-generate)" : "No quiz"}</span>
                  )}
                  {!future && q && <span className="ml-3 text-ink-400">{players.get(d) ?? 0} players</span>}
                </span>
                <div className="flex gap-2">
                  {q && (
                    <Link href={`/admin/quizzes/${d}`} className="btn-ghost px-3 py-1.5">
                      {future ? "Preview / edit" : "Preview"}
                    </Link>
                  )}
                  {future && !q && (
                    <Link href={`/admin/quizzes/${d}`} className="btn-ghost px-3 py-1.5">
                      Pick questions
                    </Link>
                  )}
                  {future && (
                    <form action={generateQuiz}>
                      <input type="hidden" name="date" value={d} />
                      <button className="btn-ghost px-3 py-1.5">{q ? "Regenerate" : "Auto-generate"}</button>
                    </form>
                  )}
                  {future && q && (
                    <form action={deleteQuiz}>
                      <input type="hidden" name="date" value={d} />
                      <button className="btn-danger px-3 py-1.5">Clear</button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
