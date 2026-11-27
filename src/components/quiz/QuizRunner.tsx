"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_META, DIFFICULTY_LABEL, fmt, friendlyError, ordinal } from "@/lib/format";
import type { AnswerResult, AttemptSummary, QuestionPayload } from "@/lib/types";

type Phase = "intro" | "loading" | "question" | "feedback" | "summary" | "error";
type Mode = "ranked" | "practice";

const AUTO_ADVANCE_MS = 5000;

export function QuizRunner({ mode, resuming = false, quizNumber }: { mode: Mode; resuming?: boolean; quizNumber: number }) {
  const supabase = useRef(createClient()).current;
  const [phase, setPhase] = useState<Phase>("intro");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [q, setQ] = useState<QuestionPayload | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15000);
  const [history, setHistory] = useState<(boolean | null)[]>(Array(10).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const deadline = useRef(0);
  const submittingRef = useRef(false);

  const fail = (e: unknown) => {
    setError(friendlyError(e));
    setPhase("error");
  };

  const loadNext = useCallback(
    async (id: string) => {
      setPhase("loading");
      setSelected(null);
      setResult(null);
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
    async (choice: number | null) => {
      if (!attemptId || !q || submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setSelected(choice);
      const { data, error } = await supabase.rpc("submit_answer", {
        p_attempt: attemptId,
        p_position: q.position,
        p_choice: choice,
      });
      submittingRef.current = false;
      setSubmitting(false);
      if (error) {
        // Already answered (e.g. double tap or expired on reload): move on.
        if (/ALREADY_ANSWERED|QUESTION_NOT_SERVED/.test(error.message)) return loadNext(attemptId);
        return fail(error);
      }
      const r = data as AnswerResult;
      setResult(r);
      setScore(r.score_so_far);
      setHistory((h) => {
        const n = [...h];
        n[r.position - 1] = r.correct;
        return n;
      });
      if (r.summary) setSummary(r.summary);
      setPhase("feedback");
    },
    [attemptId, q, supabase, loadNext],
  );

  // Countdown ticker
  useEffect(() => {
    if (phase !== "question") return;
    const t = setInterval(() => {
      const left = Math.max(0, deadline.current - performance.now());
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(t);
        submit(null);
      }
    }, 50);
    return () => clearInterval(t);
  }, [phase, submit]);

  const advance = useCallback(() => {
    if (!attemptId) return;
    if (result?.done) {
      setPhase("summary");
    } else loadNext(attemptId);
  }, [attemptId, result, loadNext]);

  // Auto-advance after feedback
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
    }, 50);
    return () => clearInterval(t);
  }, [phase, advance]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "question" && !submitting) {
        const idx = ["1", "2", "3", "4"].indexOf(e.key) >= 0 ? Number(e.key) - 1 : "abcd".indexOf(e.key.toLowerCase());
        if (idx >= 0 && idx < 4) submit(idx);
      } else if (phase === "feedback" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, submitting, submit, advance]);

  if (phase === "intro") return <Intro mode={mode} resuming={resuming} quizNumber={quizNumber} onStart={start} />;
  if (phase === "error")
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <div className="text-4xl">😵</div>
        <p className="mt-3 text-ink-200">{error}</p>
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
  if (phase === "summary" && summary && attemptId) return <Summary s={summary} attemptId={attemptId} />;

  const meta = q ? CATEGORY_META[q.category] : null;
  const pct = q ? timeLeft / q.time_limit_ms : 1;
  const secs = Math.ceil(timeLeft / 1000);
  const urgent = phase === "question" && timeLeft < 5000;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1.5" aria-label="Progress">
          {history.map((h, i) => (
            <span
              key={i}
              className={`h-2 w-5 rounded-full transition-colors sm:w-7 ${
                h === true
                  ? "bg-good"
                  : h === false
                    ? "bg-bad"
                    : q && i === q.position - 1
                      ? "bg-white"
                      : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-ink-400">{mode === "practice" ? "Practice" : "Score"}</div>
          <div className="font-display text-xl font-bold tabular-nums">{fmt(score)}</div>
        </div>
      </div>

      {phase === "loading" || !q ? (
        <div className="card mt-6 h-80 animate-pulse" />
      ) : (
        <div key={q.position} className="mt-6 animate-fade-up">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="chip" style={{ borderColor: meta?.color + "55", color: meta?.color }}>
                {meta?.icon} {meta?.label}
              </span>
              <span className="chip">{DIFFICULTY_LABEL[q.difficulty]}</span>
            </div>
            <span className="text-sm text-ink-400">
              {q.position} / {q.total}
            </span>
          </div>

          <div className="card mt-4 p-5 sm:p-8">
            <div className="flex items-start gap-5">
              <h1 className="flex-1 font-display text-xl font-semibold leading-snug sm:text-2xl">{q.prompt}</h1>
              <TimerRing pct={phase === "question" ? pct : (result?.elapsed_ms ?? 0) <= 15000 ? 1 - (result?.elapsed_ms ?? 0) / 15000 : 0} label={phase === "question" ? String(secs) : result?.timed_out ? "0" : result?.correct ? "✓" : "✕"} urgent={urgent || (phase !== "question" && !result?.correct)} done={phase !== "question"} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const isCorrect = result && i === result.correct_index;
                const isWrongPick = result && i === selected && !result.correct;
                const state = result
                  ? isCorrect
                    ? "border-good/60 bg-good/15 text-white"
                    : isWrongPick
                      ? "border-bad/60 bg-bad/15 text-white animate-shake"
                      : "border-white/[0.05] bg-white/[0.01] text-ink-400"
                  : selected === i
                    ? "border-brand bg-brand/15 text-white"
                    : "border-white/[0.08] bg-white/[0.02] text-ink-100 hover:border-brand/50 hover:bg-brand/[0.07]";
                return (
                  <button
                    key={i}
                    disabled={phase !== "question" || submitting}
                    onClick={() => submit(i)}
                    className={`group flex min-h-[3.5rem] items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition ${state} ${isCorrect ? "animate-pop" : ""}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isCorrect ? "bg-good text-ink-950" : isWrongPick ? "bg-bad text-ink-950" : "bg-white/[0.06] text-ink-300"
                      }`}
                    >
                      {isCorrect ? "✓" : isWrongPick ? "✕" : "ABCD"[i]}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Time bar */}
            {phase === "question" && (
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={`h-full rounded-full ${urgent ? "bg-bad" : "bg-gradient-to-r from-brand to-aqua"}`}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            )}

            {phase === "feedback" && result && (
              <div className="mt-6 animate-fade-up rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={`font-display text-lg font-bold ${result.correct ? "text-good" : "text-bad"}`}>
                    {result.correct ? "Correct!" : result.timed_out ? "Out of time" : "Not quite"}
                    {result.correct && (
                      <span className="ml-2 text-white">
                        +{fmt(result.points)}{" "}
                        <span className="text-sm font-medium text-ink-400">in {(result.elapsed_ms / 1000).toFixed(1)}s</span>
                      </span>
                    )}
                  </div>
                  <button onClick={advance} className="btn-primary relative overflow-hidden">
                    <span
                      className="absolute inset-y-0 left-0 bg-white/15"
                      style={{ width: `${(1 - autoLeft / AUTO_ADVANCE_MS) * 100}%` }}
                    />
                    <span className="relative">{result.done ? "See results" : "Next question"} →</span>
                  </button>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{result.explanation}</p>
              </div>
            )}
          </div>
          <p className="mt-3 hidden text-center text-xs text-ink-500 sm:block">
            Tip: press 1–4 to answer, Enter to continue
          </p>
        </div>
      )}
    </div>
  );
}

function TimerRing({ pct, label, urgent, done }: { pct: number; label: string; urgent: boolean; done: boolean }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0" role="timer" aria-label={`${label} seconds left`}>
      <svg viewBox="0 0 52 52" className="-rotate-90">
        <circle cx="26" cy="26" r={r} stroke="rgba(255,255,255,.08)" strokeWidth="4" fill="none" />
        <circle
          cx="26"
          cy="26"
          r={r}
          stroke={urgent ? "#F87171" : done ? "#34D399" : "url(#tf-timer)"}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, pct)))}
        />
        <defs>
          <linearGradient id="tf-timer">
            <stop offset="0" stopColor="#7C5CFF" />
            <stop offset="1" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-display text-lg font-bold tabular-nums ${urgent ? "text-bad" : ""}`}
      >
        {label}
      </span>
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
      <span className="chip border-brand/30 bg-brand/10 text-brand-400">
        {mode === "ranked" ? `Daily quiz #${quizNumber} · ranked` : "Practice mode · unranked"}
      </span>
      <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {mode === "ranked" ? (resuming ? "Pick up where you left off" : "Ready for today's ten?") : "Warm up your brain"}
      </h1>
      <p className="mt-4 text-ink-300">
        {mode === "ranked"
          ? "10 questions, 15 seconds each. Faster correct answers earn more points. You get one official attempt, and the clock runs on our servers."
          : "Questions from past daily quizzes. Same rules, but it won't affect your ranking, stats or streak."}
      </p>
      <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-center">
        {[
          ["10", "questions"],
          ["15s", "per question"],
          ["10,000", "max score"],
        ].map(([v, l]) => (
          <div key={l} className="card p-3">
            <div className="font-display text-xl font-bold">{v}</div>
            <div className="text-xs text-ink-400">{l}</div>
          </div>
        ))}
      </div>
      <button
        className="btn-primary mt-8 px-10 py-3.5 text-base"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          onStart();
        }}
      >
        {busy ? "Loading…" : resuming ? "Resume" : "Start"}
      </button>
      {mode === "ranked" && (
        <p className="mt-4 text-xs text-ink-400">
          Want to warm up first?{" "}
          <Link href="/practice" className="text-brand-400 hover:underline">
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

function Summary({ s, attemptId }: { s: AttemptSummary; attemptId: string }) {
  const shown = useCountUp(s.score);
  const ranked = s.mode === "ranked";
  const verdict =
    s.correct_count === 10 ? "Flawless!" : s.correct_count >= 8 ? "Superb" : s.correct_count >= 6 ? "Nicely done" : s.correct_count >= 4 ? "Not bad" : "Tough one";
  return (
    <div className="mx-auto max-w-xl animate-fade-up text-center">
      <span className="chip">{ranked ? "Daily quiz complete" : "Practice complete"}</span>
      <h1 className="mt-4 font-display text-3xl font-bold">{verdict}</h1>
      <div className="mt-6 font-display text-7xl font-bold tabular-nums text-gradient">{fmt(shown)}</div>
      <div className="mt-1 text-sm text-ink-400">out of {fmt(s.max_score)}</div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <div className="card p-3">
          <div className="font-display text-2xl font-bold">{s.correct_count}/10</div>
          <div className="text-xs text-ink-400">correct</div>
        </div>
        <div className="card p-3">
          <div className="font-display text-2xl font-bold">{ranked && s.daily_rank ? ordinal(s.daily_rank) : "–"}</div>
          <div className="text-xs text-ink-400">{ranked ? "today's rank" : "unranked"}</div>
        </div>
        <div className="card p-3">
          <div className="font-display text-2xl font-bold text-flame">{ranked ? `🔥 ${s.current_streak}` : "–"}</div>
          <div className="text-xs text-ink-400">day streak</div>
        </div>
      </div>

      {s.new_achievements?.length > 0 && (
        <div className="card mt-6 p-4 text-left">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-flame">New achievements</div>
          <ul className="space-y-2">
            {s.new_achievements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 animate-pop">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-flame/10 text-xl">{a.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{a.name}</div>
                  <div className="text-xs text-ink-400">{a.description}</div>
                </div>
                {a.reward && <span className="chip border-flame/30 text-flame">Unlocked: {a.reward.name}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {ranked ? (
          <>
            <Link href={`/results/${attemptId}`} className="btn-primary">
              Review & share
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
