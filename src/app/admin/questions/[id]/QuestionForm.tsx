"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { deleteQuestion, saveQuestion } from "../actions";
import { CATEGORY_META, DIFFICULTY_LABEL } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";

export type QuestionRow = {
  id: number;
  category: string;
  difficulty: number;
  prompt: string;
  explanation: string | null;
  pool: "daily" | "practice";
  is_active: boolean;
  times_used: number;
  last_used_on: string | null;
};

export type AnswerRow = { id: number; answer: string; aliases: string[]; seed_weight: number; times_given: number };

export function QuestionForm({
  q,
  answers = [],
  stats,
}: {
  q?: QuestionRow;
  answers?: AnswerRow[];
  stats?: { answered: number; accuracy: number | null };
}) {
  const [state, action, pending] = useActionState(saveQuestion, undefined);
  const [delState, del, deleting] = useActionState(deleteQuestion, undefined);
  const [prompt, setPrompt] = useState(q?.prompt ?? "");
  const [raw, setRaw] = useState(answers.map((a) => [a.answer, ...a.aliases].join(" | ")).join("\n"));
  const lines = useMemo(() => raw.split("\n").map((l) => l.trim()).filter(Boolean), [raw]);
  const given = useMemo(() => {
    const total = answers.reduce((n, a) => n + a.times_given, 0);
    return { total, top: [...answers].sort((a, b) => b.times_given - a.times_given).slice(0, 8) };
  }, [answers]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form action={action} className="card space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{q ? `Edit prompt #${q.id}` : "New prompt"}</h2>
          <Link href="/admin/questions" className="text-ink-400 hover:text-white">
            ← All prompts
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
          <label className="label">Prompt</label>
          <input
            name="prompt"
            required
            maxLength={300}
            className="input"
            placeholder="Name a country in Europe"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Valid answers ({lines.length})</label>
          <textarea
            name="answers"
            required
            className="input min-h-[280px] font-mono text-sm"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={"France\nUnited Kingdom | UK | Britain\nLiechtenstein"}
          />
          <p className="mt-1.5 text-sm text-ink-400">
            One answer per line, most common first: the order sets the starting rarity until real players take over. Add other
            accepted spellings after a “|”. Small typos are autocorrected automatically.
          </p>
        </div>
        <div>
          <label className="label">Fun fact (optional, shown after answering)</label>
          <textarea name="explanation" maxLength={500} defaultValue={q?.explanation ?? ""} className="input min-h-[60px]" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={q?.is_active ?? true} className="h-4 w-4 accent-brand" />
          Active (eligible for quizzes)
        </label>
        {state?.error && <p className="border-2 border-bad bg-bad/10 px-3.5 py-2.5 text-bad">{state.error}</p>}
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save prompt"}
        </button>
      </form>

      <div className="space-y-4">
        <div className="card p-5">
          <div className="label">Player preview</div>
          <p className="mt-2 text-xl font-bold">{prompt || "Your prompt…"}</p>
          <p className="mt-1 text-sm text-ink-400">{lines.length} valid answers</p>
          <div className="input mt-3 text-ink-400">Type a rare answer…</div>
        </div>
        {q && (
          <div className="card space-y-3 p-5">
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
                {stats?.answered ?? 0} {stats?.accuracy !== null && stats?.accuracy !== undefined && `· ${stats.accuracy}% valid`}
              </span>
            </div>
            {given.total > 0 && (
              <div>
                <div className="label mt-2">Real ranked answers</div>
                <ul className="space-y-1 text-sm">
                  {given.top.map((a) => (
                    <li key={a.id} className="flex justify-between">
                      <span>{a.answer}</span>
                      <span className="text-ink-400">{a.times_given}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form
              action={del}
              onSubmit={(e) => {
                if (!confirm("Delete this prompt permanently?")) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={q.id} />
              <button className="btn-danger w-full" disabled={deleting}>
                Delete prompt
              </button>
            </form>
            {delState?.error && <p className="text-bad">{delState.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
