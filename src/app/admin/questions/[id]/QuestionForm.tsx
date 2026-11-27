"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteQuestion, saveQuestion } from "../actions";
import { CATEGORY_META, DIFFICULTY_LABEL } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";

export type QuestionRow = {
  id: number;
  category: string;
  difficulty: number;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string;
  pool: "daily" | "practice";
  is_active: boolean;
  times_used: number;
  last_used_on: string | null;
};

export function QuestionForm({ q, stats }: { q?: QuestionRow; stats?: { answered: number; accuracy: number | null } }) {
  const [state, action, pending] = useActionState(saveQuestion, undefined);
  const [delState, del, deleting] = useActionState(deleteQuestion, undefined);
  const [correct, setCorrect] = useState(q?.correct_index ?? 0);
  const [prompt, setPrompt] = useState(q?.prompt ?? "");
  const [opts, setOpts] = useState<string[]>(q?.options ?? ["", "", "", ""]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form action={action} className="card space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{q ? `Edit question #${q.id}` : "New question"}</h2>
          <Link href="/admin/questions" className="text-sm text-ink-400 hover:text-white">
            ← All questions
          </Link>
        </div>
        {q && <input type="hidden" name="id" value={q.id} />}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Category</label>
            <select name="category" defaultValue={q?.category ?? "general"} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select name="difficulty" defaultValue={q?.difficulty ?? 2} className="input">
              {[1, 2, 3].map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Pool</label>
            <select name="pool" defaultValue={q?.pool ?? "daily"} className="input">
              <option value="daily">Daily (ranked)</option>
              <option value="practice">Practice only</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Question</label>
          <textarea name="prompt" required maxLength={300} className="input min-h-[80px]" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <fieldset>
          <legend className="label">Answers (select the correct one)</legend>
          <input type="hidden" name="correct_index" value={correct} />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  aria-label={`Mark answer ${"ABCD"[i]} correct`}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${
                    correct === i ? "border-good bg-good/20 text-good" : "border-white/10 text-ink-400"
                  }`}
                >
                  {correct === i ? "✓" : "ABCD"[i]}
                </button>
                <input
                  name={`option${i}`}
                  required
                  maxLength={120}
                  className="input"
                  value={opts[i]}
                  onChange={(e) => setOpts((o) => o.map((v, j) => (j === i ? e.target.value : v)))}
                />
              </div>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label">Explanation (shown after answering)</label>
          <textarea name="explanation" required maxLength={500} defaultValue={q?.explanation} className="input min-h-[70px]" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={q?.is_active ?? true} className="h-4 w-4 accent-brand" />
          Active (eligible for quizzes)
        </label>
        {state?.error && <p className="rounded-xl bg-bad/10 px-3.5 py-2.5 text-sm text-bad">{state.error}</p>}
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save question"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="card p-5">
          <div className="label">Player preview</div>
          <p className="mt-2 font-display font-semibold">{prompt || "Your question…"}</p>
          <div className="mt-3 grid gap-2">
            {opts.map((o, i) => (
              <div
                key={i}
                className={`rounded-lg border px-3 py-2 text-sm ${i === correct ? "border-good/50 bg-good/10" : "border-white/[0.06]"}`}
              >
                <span className="mr-2 text-xs text-ink-400">{"ABCD"[i]}</span>
                {o || "…"}
              </div>
            ))}
          </div>
        </div>
        {q && (
          <div className="card space-y-3 p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-400">Times scheduled</span>
              <span>{q.times_used}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Last used</span>
              <span>{q.last_used_on ?? "never"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-400">Answered</span>
              <span>
                {stats?.answered ?? 0} {stats?.accuracy !== null && stats?.accuracy !== undefined && `· ${stats.accuracy}% correct`}
              </span>
            </div>
            <form
              action={del}
              onSubmit={(e) => {
                if (!confirm("Delete this question permanently?")) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={q.id} />
              <button className="btn-danger w-full" disabled={deleting}>
                Delete question
              </button>
            </form>
            {delState?.error && <p className="text-bad">{delState.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
