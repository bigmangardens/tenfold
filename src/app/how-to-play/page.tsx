import Link from "next/link";
import { ScoringRules } from "@/components/ScoringRules";

export const metadata = { title: "How to play" };

export default function HowToPlay() {
  const steps = [
    ["1", "A new quiz at 00:00 UTC", "Ten questions across history, science, geography, sport, entertainment, technology, literature and general knowledge, easy to hard."],
    ["2", "Fifteen seconds per question", "Pick one of four answers. You see right away if you got it, plus the correct answer and a short explanation."],
    ["3", "One official attempt", "Your first run each day is ranked. Want more? Practice mode uses past questions and never touches your ranking."],
    ["4", "Climb and collect", "Daily, weekly, all-time, country and friends leaderboards. Streaks and achievements unlock avatar cosmetics."],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">How Tenfold works</h1>
        <p className="mt-2 text-ink-300">Simple rules, fair competition, the same quiz for everyone.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map(([n, t, b]) => (
          <div key={n} className="card p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 font-display font-bold text-brand-400">
              {n}
            </span>
            <h3 className="mt-3 font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-ink-300">{b}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-4 font-display text-2xl font-bold">Scoring</h2>
        <ScoringRules />
      </div>
      <div className="card p-5 text-sm text-ink-300">
        <h3 className="mb-2 font-semibold text-white">Fair play</h3>
        Answers are checked on our servers and the correct answer is never sent to your browser before you answer.
        Response times are measured server-side, unusual patterns are reviewed, and each account gets one ranked attempt
        per day. Reloading the page doesn&apos;t reset the clock.
      </div>
      <Link href="/play" className="btn-primary">
        Play today&apos;s quiz
      </Link>
    </div>
  );
}
