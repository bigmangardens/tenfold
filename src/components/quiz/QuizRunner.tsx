"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_META, fmt, friendlyError, ordinal } from "@/lib/format";
import { fmtPct, tierOf } from "@/lib/rarity";
import type { AnswerResult, AttemptSummary, HistoryCell, QuestionPayload, RetryResult, RevealItem } from "@/lib/types";

type Phase = "intro" | "loading" | "question" | "feedback" | "summary" | "error";
type Mode = "ranked" | "practice";

const AUTO_ADVANCE_MS = 12000;

export function QuizRunner({ mode, resuming = false, quizNumber }: { mode: Mode; resuming?: boolean; quizNumber: number }) {
  const supabase = useRef(createClient()).current;
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [q, setQ] = useState<QuestionPayload | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [text, setText] = useState("");
  const [misses, setMisses] = useState<string[]>([]);
  const [missFlash, setMissFlash] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30000);
  const [history, setHistory] = useState<HistoryCell[]>(Array(10).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const deadline = useRef(0);
  const submittingRef = useRef(false);
  const textRef = useRef("");
  const feedbackAt = useRef(0);

  const fail = (e: unknown) => {
    setError(friendlyError(e));
    setPhase("error");
  };

  const loadNext = useCallback(
    async (id: string) => {
      setPhase("loading");
      setResult(null);
      setText("");
      setMisses([]);
      textRef.current = "";
      const { data, error } = await supabase.rpc("next_question", { p_attempt: id });
      if (error) return fail(error);
      if (data.done) {
        setSummary(data as AttemptSummary);
        setPhase("summary");
        return;
      }
      const payload = data as QuestionPayload;
      deadline.current = performance.now() + payload.remaining_ms;
      setTimeLeft(payload.remaining_ms);
      setScore(payload.score_so_far);
      if (payload.history) setHistory(payload.history);
      setQ(payload);
      setPhase("question");
    },
    [supabase],
  );

  const start = async () => {
    setPhase("loading");
    const { data, error } = await supabase.rpc("start_attempt", { p_mode: mode });
    if (error) return fail(error);
    setAttemptId(data.attempt_id);
    await loadNext(data.attempt_id);
  };

  const submit = useCallback(
    async (answer: string | null, final = false) => {
      if (!attemptId || !q || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      const { data, error } = await supabase.rpc("submit_answer", {
        p_attempt: attemptId,
        p_position: q.position,
        p_text: answer,
        p_final: final,
      });
      submittingRef.current = false;
      setSubmitting(false);
      if (error) {
        // Already answered (e.g. double submit or expired on reload): move on.
        if (/ALREADY_ANSWERED|QUESTION_NOT_SERVED/.test(error.message)) return loadNext(attemptId);
        return fail(error);
      }
      if ((data as RetryResult).retry) {
        // Not on the list and time remains: clear the box and keep guessing.
        const miss = data as RetryResult;
        setMisses((m) => [miss.typed, ...m].slice(0, 6));
        setMissFlash((n) => n + 1);
        setText("");
        textRef.current = "";
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      const r = data as AnswerResult;
      setResult(r);
      setResults((rs) => [...rs, r]);
      setScore(r.score_so_far);
      setHistory((h) => {
        const n = [...h];
        n[r.position - 1] = { ok: r.valid, pct: r.pct, p: r.points };
        return n;
      });
      if (r.summary) setSummary(r.summary);
      feedbackAt.current = performance.now();
      setPhase("feedback");
    },
    [attemptId, q, supabase, loadNext],
  );

  // Countdown: when time runs out, whatever is typed gets submitted.
  useEffect(() => {
    if (phase !== "question") return;
    const t = setInterval(() => {
      const left = Math.max(0, deadline.current - performance.now());
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(t);
        submit(textRef.current.trim() || null, true);
      }
    }, 100);
    return () => clearInterval(t);
  }, [phase, submit]);

  const advance = useCallback(() => {
    if (!attemptId) return;
    if (result?.done) setPhase("summary");
    else loadNext(attemptId);
  }, [attemptId, result, loadNext]);

  const [autoLeft, setAutoLeft] = useState(AUTO_ADVANCE_MS);
  useEffect(() => {
    if (phase !== "feedback") return;
    const end = performance.now() + AUTO_ADVANCE_MS;
    setAutoLeft(AUTO_ADVANCE_MS);
    const t = setInterval(() => {
      const left = end - performance.now();
      setAutoLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(t);
        advance();
      }
    }, 100);
    return () => clearInterval(t);
  }, [phase, advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "feedback" && e.key === "Enter" && performance.now() - feedbackAt.current > 500) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, advance]);

  if (phase === "intro") return <Intro mode={mode} resuming={resuming} quizNumber={quizNumber} onStart={start} />;
  if (phase === "error")
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="font-arcade text-2xl text-bad">GAME OVER?</div>
        <p className="mt-4 text-ink-200">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          {attemptId && (
            <button className="btn-primary" onClick={() => loadNext(attemptId)}>
              Try again
            </button>
          )}
          <Link href="/dashboard" className="btn-ghost">
            Dashboard
          </Link>
        </div>
      </div>
    );
  if (phase === "summary" && summary && attemptId) return <Summary s={summary} attemptId={attemptId} results={results} />;

  const meta = q ? CATEGORY_META[q.category] : null;
  const limit = q?.time_limit_ms ?? 30000;
  const pct = timeLeft / limit;
  const secs = Math.ceil(timeLeft / 1000);
  const urgent = phase === "question" && timeLeft < 8000;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between gap-4">
        <ProgressBlocks history={history} current={q?.position} />
        <div className="text-right">
          <div className="font-arcade text-[9px] uppercase text-ink-400">{mode === "practice" ? "Practice" : "Score"}</div>
          <div className="font-arcade text-lg tabular-nums text-brand">{fmt(score)}</div>
        </div>
      </div>

      {phase === "loading" || !q ? (
        <div className="card mt-6 h-72 animate-pulse" />
      ) : (
        <div key={q.position} className="mt-6 animate-fade-up">
          <div className="flex items-center justify-between gap-3">
            <span className="chip" style={{ borderColor: meta?.color, color: meta?.color }}>
              {meta?.icon} {meta?.label}
            </span>
            <span className="font-arcade text-[10px] text-ink-400">
              {q.position}/{q.total}
            </span>
          </div>

          <div className="card mt-3 p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{q.prompt}</h1>
              {phase === "question" && (
                <div
                  className={`shrink-0 border-[3px] border-black px-2.5 py-2 font-arcade text-lg tabular-nums ${urgent ? "animate-blink bg-bad text-ink-950" : "bg-ink-950 text-brand"}`}
                  role="timer"
                  aria-label={`${secs} seconds left`}
                >
                  {String(secs).padStart(2, "0")}
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-ink-400">
              {q.answer_count} valid answers. The fewer players who think of yours, the more it scores.
            </p>

            {phase === "question" && (
              <>
                <form
                  className="mt-6 flex flex-col gap-3 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (text.trim()) submit(text.trim());
                  }}
                >
                  <input
                    ref={inputRef}
                    autoFocus
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      textRef.current = e.target.value;
                    }}
                    maxLength={80}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="send"
                    placeholder="Type a rare answer…"
                    aria-label="Your answer"
                    key={missFlash}
                    className={`input flex-1 py-3 text-xl ${missFlash ? "animate-shake border-bad" : ""}`}
                    disabled={submitting}
                  />
                  <button className="btn-primary px-6 py-4" disabled={submitting || !text.trim()}>
                    {submitting ? "Checking…" : "Lock in"}
                  </button>
                </form>
                {misses.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
                    <span className="text-sm text-bad">✗ Not on the list, keep guessing:</span>
                    {misses.map((m, i) => (
                      <span key={`${m}-${i}`} className="border-2 border-bad/50 px-1.5 text-sm text-ink-400 line-through">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
                <TimeBar pct={pct} urgent={urgent} />
                <p className="mt-3 text-center text-sm text-ink-400">
                  Guess as many times as you like before the clock runs out. Your first valid answer locks in, and typos are autocorrected.
                </p>
              </>
            )}

            {phase === "feedback" && result && (
              <div className="mt-6 animate-fade-up space-y-5">
                <ResultBanner r={result} />
                <RevealLists top={result.reveal.top} rare={result.reveal.rare} total={result.reveal.total} mine={result.answer} />
                {result.note && <p className="border-l-4 border-ink-600 pl-3 text-ink-300">{result.note}</p>}
                <div className="flex justify-end">
                  <button onClick={advance} className="btn-primary relative overflow-hidden">
                    <span className="absolute inset-y-0 left-0 bg-black/15" style={{ width: `${(1 - autoLeft / AUTO_ADVANCE_MS) * 100}%` }} />
                    <span className="relative">{result.done ? "See results" : "Next prompt"} ▶</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          {phase === "feedback" && <p className="mt-3 hidden text-center text-sm text-ink-500 sm:block">Press Enter to continue</p>}
        </div>
      )}
    </div>
  );
}

export function ProgressBlocks({ history, current }: { history: HistoryCell[]; current?: number }) {
  return (
    <div className="flex gap-1.5" aria-label="Progress">
      {history.map((h, i) => {
        const t = h?.ok ? tierOf(h.pct) : null;
        const bg = h ? (h.ok ? t?.color : "#FF5470") : current === i + 1 ? "#F4F1FF" : "#2A2160";
        return (
          <span
            key={i}
            title={h ? (h.ok ? `${t?.label} · +${h.p}` : "Miss") : undefined}
            className="h-4 w-5 border-2 border-black sm:w-7"
            style={{ background: bg }}
          />
        );
      })}
    </div>
  );
}

function TimeBar({ pct, urgent }: { pct: number; urgent: boolean }) {
  const cells = 30;
  const lit = Math.ceil(Math.max(0, Math.min(1, pct)) * cells);
  return (
    <div className="mt-5 flex gap-[3px]" aria-hidden>
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className="h-3 flex-1" style={{ background: i < lit ? (urgent ? "#FF5470" : "#4EE3FF") : "#2A2160" }} />
      ))}
    </div>
  );
}

export function TierBadge({ pct, className = "" }: { pct: number | null; className?: string }) {
  const t = tierOf(pct);
  if (!t) return null;
  return (
    <span
      className={`inline-block border-2 border-black px-1.5 py-1 font-arcade text-[9px] uppercase leading-none text-ink-950 ${className}`}
      style={{ background: t.color }}
    >
      {t.label}
    </span>
  );
}

function ResultBanner({ r }: { r: AnswerResult }) {
  if (!r.valid) {
    return (
      <div className="animate-shake border-[3px] border-bad bg-bad/10 p-4">
        <div className="font-arcade text-sm text-bad">Time&apos;s up</div>
        <p className="mt-2 text-ink-300">
          {r.typed ? `“${r.typed}” isn't one of the valid answers. ` : "No valid answer in time. "}0 points.
        </p>
      </div>
    );
  }
  const t = tierOf(r.pct);
  return (
    <div className="animate-pop border-[3px] p-4" style={{ borderColor: t?.color, background: `${t?.color}1A` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <TierBadge pct={r.pct} />
          <span className="text-2xl font-bold">{r.answer}</span>
        </div>
        <span className="font-arcade text-lg" style={{ color: t?.color }}>
          +{fmt(r.points)}
        </span>
      </div>
      <p className="mt-2 text-ink-300">
        {r.corrected && (
          <>
            You typed “{r.typed}”, autocorrected.{" "}
          </>
        )}
        About <b className="text-white">{fmtPct(r.pct)}</b> of players give this answer.
      </p>
    </div>
  );
}

export function RevealLists({ top, rare, total, mine }: { top: RevealItem[]; rare: RevealItem[]; total: number; mine?: string | null }) {
  const max = Math.max(...top.map((x) => x.pct), 1);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <div className="label">Most common</div>
        <ul className="space-y-1.5">
          {top.map((x) => (
            <li key={x.answer} className="relative border-2 border-ink-700 bg-ink-900 px-2.5 py-1.5">
              <span className="absolute inset-y-0 left-0 bg-tier-common/20" style={{ width: `${(x.pct / max) * 100}%` }} />
              <span className="relative flex justify-between gap-2">
                <span className={x.answer === mine ? "font-bold text-brand" : ""}>{x.answer}</span>
                <span className="text-ink-300">{fmtPct(x.pct)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="label">Rare finds</div>
        <ul className="space-y-1.5">
          {rare.map((x) => (
            <li key={x.answer} className="flex justify-between gap-2 border-2 border-ink-700 bg-ink-900 px-2.5 py-1.5">
              <span className={x.answer === mine ? "font-bold text-brand" : "text-tier-legendary"}>✦ {x.answer}</span>
              <span className="text-ink-300">{fmtPct(x.pct)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-ink-400">{total} valid answers in all.</p>
      </div>
    </div>
  );
}

function Intro({
  mode,
  resuming,
  quizNumber,
  onStart,
}: {
  mode: Mode;
  resuming: boolean;
  quizNumber: number;
  onStart: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-xl animate-fade-up text-center">
      <span className="chip border-brand text-brand">
        {mode === "ranked" ? `Daily hunt #${quizNumber} · ranked` : "Practice · unranked"}
      </span>
      <h1 className="arcade-title mt-6 text-2xl leading-relaxed sm:text-3xl">
        {mode === "ranked" ? (resuming ? "Continue?" : "Ready, player 1?") : "Warm-up round"}
      </h1>
      <p className="mt-5 text-lg text-ink-300">
        {mode === "ranked"
          ? "10 open prompts, 30 seconds each. Keep guessing until you hit a valid answer. Obvious answers score a little, rare ones score big. One official run a day, timed on our servers."
          : "Prompts from the practice pool. Same rules, but it won't touch your ranking, stats or streak."}
      </p>
      <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
        {[
          ["10", "prompts"],
          ["30s", "each"],
          ["1,000", "per rare find"],
        ].map(([v, l]) => (
          <div key={l} className="card p-3">
            <div className="font-arcade text-base text-brand">{v}</div>
            <div className="mt-1.5 text-sm text-ink-400">{l}</div>
          </div>
        ))}
      </div>
      <button
        className="btn-primary mt-10 px-10 py-4 text-sm"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          onStart();
        }}
      >
        {busy ? "Loading…" : resuming ? "Resume" : "Press start"}
      </button>
      {mode === "ranked" && (
        <p className="mt-5 text-sm text-ink-400">
          Want to warm up first?{" "}
          <Link href="/practice" className="text-brand hover:underline">
            Try practice mode
          </Link>
        </p>
      )}
    </div>
  );
}

function useCountUp(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Summary({ s, attemptId, results }: { s: AttemptSummary; attemptId: string; results: AnswerResult[] }) {
  const shown = useCountUp(s.score);
  const ranked = s.mode === "ranked";
  const best = results.filter((r) => r.valid).sort((a, b) => (a.pct ?? 100) - (b.pct ?? 100))[0];
  const verdict = s.score >= 8000 ? "Legendary run!" : s.score >= 6000 ? "Epic haul" : s.score >= 4000 ? "Nice loot" : s.score >= 2000 ? "Not bad" : "Tough day";
  return (
    <div className="mx-auto max-w-xl animate-fade-up text-center">
      <span className="chip">{ranked ? "Daily hunt complete" : "Practice complete"}</span>
      <h1 className="arcade-title mt-6 text-xl sm:text-2xl">{verdict}</h1>
      <div className="mt-8 font-arcade text-5xl tabular-nums text-brand sm:text-6xl">{fmt(shown)}</div>
      <div className="mt-3 text-ink-400">out of {fmt(s.max_score)}</div>

      {best && (
        <div className="card mx-auto mt-6 max-w-sm p-4">
          <div className="label">Best find</div>
          <div className="flex items-center justify-center gap-3">
            <TierBadge pct={best.pct} />
            <span className="text-xl font-bold">{best.answer}</span>
            <span className="text-ink-400">{fmtPct(best.pct)}</span>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="card p-3">
          <div className="font-arcade text-lg">{s.correct_count}/10</div>
          <div className="mt-1.5 text-sm text-ink-400">valid</div>
        </div>
        <div className="card p-3">
          <div className="font-arcade text-lg">{ranked && s.daily_rank ? ordinal(s.daily_rank) : "–"}</div>
          <div className="mt-1.5 text-sm text-ink-400">{ranked ? "today's rank" : "unranked"}</div>
        </div>
        <div className="card p-3">
          <div className="font-arcade text-lg text-flame">{ranked ? s.current_streak : "–"}</div>
          <div className="mt-1.5 text-sm text-ink-400">day streak</div>
        </div>
      </div>

      {s.new_achievements?.length > 0 && (
        <div className="card mt-6 p-4 text-left">
          <div className="label text-flame">New achievements</div>
          <ul className="space-y-2">
            {s.new_achievements.map((a) => (
              <li key={a.id} className="flex animate-pop items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center border-2 border-flame/50 bg-flame/10 text-xl">{a.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-sm text-ink-400">{a.description}</div>
                </div>
                {a.reward && <span className="chip border-flame text-flame">Unlocked: {a.reward.name}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {ranked ? (
          <>
            <Link href={`/results/${attemptId}`} className="btn-primary">
              Review &amp; share
            </Link>
            <Link href="/leaderboards" className="btn-ghost">
              Leaderboard
            </Link>
          </>
        ) : (
          <>
            <a href="/practice" className="btn-primary">
              Practice again
            </a>
            <Link href={`/results/${attemptId}`} className="btn-ghost">
              Review answers
            </Link>
          </>
        )}
        <Link href="/dashboard" className="btn-ghost">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
