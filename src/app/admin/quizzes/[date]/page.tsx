import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_META, DIFFICULTY_LABEL, formatDate } from "@/lib/format";
import { QuizEditor, type BankQuestion } from "./QuizEditor";

export default async function QuizDetail({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const editable = date > today;

  const { data: quiz } = await supabase
    .from("daily_quizzes")
    .select("id,auto_generated,daily_quiz_questions(position,question_id,questions(id,category,difficulty,prompt,explanation))")
    .eq("quiz_date", date)
    .maybeSingle();

  type Row = { position: number; question_id: number; questions: BankQuestion & { explanation: string | null } };
  const rows = ((quiz?.daily_quiz_questions ?? []) as unknown as Row[]).sort((a, b) => a.position - b.position);

  let bank: BankQuestion[] = [];
  if (editable) {
    const { data } = await supabase
      .from("questions")
      .select("id,category,difficulty,prompt,times_used,last_used_on")
      .eq("pool", "daily")
      .eq("is_active", true)
      .order("times_used")
      .limit(2000);
    bank = (data ?? []) as BankQuestion[];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/quizzes" className="text-sm text-ink-400 hover:text-white">
            ← Schedule
          </Link>
          <h2 className="mt-1 font-display text-2xl font-bold">
            {formatDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </h2>
        </div>
        <span className="chip">{editable ? "Scheduled · editable" : date === today ? "Live · locked" : "Past · locked"}</span>
      </div>

      {editable ? (
        <QuizEditor date={date} bank={bank} initial={rows.map((r) => r.question_id)} />
      ) : null}

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">Preview {rows.length ? "" : "(no quiz yet)"}</h3>
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.position} className="card p-4">
              <div className="flex justify-between text-xs text-ink-400">
                <span>
                  Q{r.position} · {CATEGORY_META[r.questions.category]?.icon} {CATEGORY_META[r.questions.category]?.label} ·{" "}
                  {DIFFICULTY_LABEL[r.questions.difficulty]}
                </span>
                <Link href={`/admin/questions/${r.question_id}`} className="hover:text-white">
                  Edit #{r.question_id}
                </Link>
              </div>
              <p className="mt-1.5 font-medium">{r.questions.prompt}</p>
              <p className="mt-2 text-xs text-ink-400">{r.questions.explanation}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
