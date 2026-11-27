"use client";

import { useMemo, useState, useTransition } from "react";
import { setQuiz } from "../actions";
import { CATEGORY_META, DIFFICULTY_LABEL } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";

export type BankQuestion = {
  id: number;
  category: string;
  difficulty: number;
  prompt: string;
  times_used?: number;
  last_used_on?: string | null;
};

export function QuizEditor({ date, bank, initial }: { date: string; bank: BankQuestion[]; initial: number[] }) {
  const [ids, setIds] = useState<number[]>(initial);
  const [filter, setFilter] = useState("");
  const [cat, setCat] = useState("");
  const [msg, setMsg] = useState<{ ok?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const picked = ids.map((id) => byId.get(id)).filter(Boolean) as BankQuestion[];

  const catCount = new Map<string, number>();
  picked.forEach((q) => catCount.set(q.category, (catCount.get(q.category) ?? 0) + 1));
  const diffCount = [1, 2, 3].map((d) => picked.filter((q) => q.difficulty === d).length);

  const list = bank
    .filter((q) => !ids.includes(q.id))
    .filter((q) => !cat || q.category === cat)
    .filter((q) => !filter || q.prompt.toLowerCase().includes(filter.toLowerCase()))
    .slice(0, 60);

  const move = (i: number, d: number) =>
    setIds((a) => {
      const n = [...a];
      const j = i + d;
      if (j < 0 || j >= n.length) return a;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Quiz ({ids.length}/10)</h3>
          <button
            className="btn-primary"
            disabled={ids.length !== 10 || pending}
            onClick={() =>
              start(async () => {
                const r = await setQuiz(date, ids);
                setMsg(r.error ? { error: r.error } : { ok: "Quiz saved" });
              })
            }
          >
            {pending ? "Saving…" : "Save quiz"}
          </button>
        </div>
        {msg && <p className={`mt-2 text-sm ${msg.error ? "text-bad" : "text-good"}`}>{msg.error ?? msg.ok}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {CATEGORIES.map((c) => (
            <span key={c} className={`chip ${catCount.get(c) ? "" : "border-flame/40 text-flame"}`}>
              {CATEGORY_META[c].icon} {catCount.get(c) ?? 0}
            </span>
          ))}
          <span className="chip">
            E{diffCount[0]} · M{diffCount[1]} · H{diffCount[2]}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-400">Aim for every category and roughly 3 easy, 4 medium, 3 hard, ordered easy to hard.</p>
        <ol className="mt-4 space-y-2">
          {picked.map((q, i) => (
            <li key={q.id} className="flex items-center gap-2 rounded-lg border border-ink-700 p-2 text-sm">
              <span className="w-6 text-center text-ink-400">{i + 1}</span>
              <span title={CATEGORY_META[q.category]?.label}>{CATEGORY_META[q.category]?.icon}</span>
              <span className="flex-1 truncate">{q.prompt}</span>
              <span className="text-xs text-ink-400">{DIFFICULTY_LABEL[q.difficulty][0]}</span>
              <button className="px-1 text-ink-400 hover:text-white" onClick={() => move(i, -1)} aria-label="Move up">
                ↑
              </button>
              <button className="px-1 text-ink-400 hover:text-white" onClick={() => move(i, 1)} aria-label="Move down">
                ↓
              </button>
              <button className="px-1 text-bad" onClick={() => setIds((a) => a.filter((x) => x !== q.id))} aria-label="Remove">
                ✕
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5">
        <h3 className="font-display font-semibold">Question bank</h3>
        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </div>
        <ul className="mt-3 max-h-[480px] space-y-1.5 overflow-y-auto pr-1">
          {list.map((q) => (
            <li key={q.id}>
              <button
                disabled={ids.length >= 10}
                onClick={() => setIds((a) => [...a, q.id])}
                className="flex w-full items-center gap-2 rounded-lg border border-ink-700 p-2 text-left text-sm hover:border-brand/40 disabled:opacity-40"
              >
                <span>{CATEGORY_META[q.category]?.icon}</span>
                <span className="flex-1 truncate">{q.prompt}</span>
                <span className="text-xs text-ink-400">
                  {DIFFICULTY_LABEL[q.difficulty][0]} · {q.times_used ?? 0}×
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
