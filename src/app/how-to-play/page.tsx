import Link from "next/link";
import { ScoringRules } from "@/components/ScoringRules";

export const metadata = { title: "How to play" };

export default function HowToPlay() {
  const steps = [
    ["1", "Ten prompts at 00:00 UTC", "Open prompts like “Name a country in Europe” or “Name a Beatles song”, across geography, science, history, sport, film, books, tech and more."],
    ["2", "Guess until you hit", "You get 30 seconds per prompt and unlimited guesses. Your first valid answer locks in, and small typos are autocorrected."],
    ["3", "Go rare, score big", "The fewer players who give your answer, the more it's worth. “France” scores a little. “Liechtenstein” scores big."],
    ["4", "One official run a day", "Your first run each day is ranked. Practice mode never touches your ranking. Keep a streak, unlock cosmetics, climb the boards."],
  ];
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="arcade-title text-xl leading-relaxed sm:text-2xl">How to play</h1>
        <p className="mt-4 text-lg text-ink-300">Everyone thinks of the obvious answer. Can you think of the one nobody else will?</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map(([n, t, b]) => (
          <div key={n} className="card p-5">
            <span className="flex h-9 w-9 items-center justify-center border-[3px] border-black bg-brand font-arcade text-sm text-ink-950">
              {n}
            </span>
            <h3 className="mt-3 text-lg font-bold">{t}</h3>
            <p className="mt-1 text-ink-300">{b}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-4 font-arcade text-sm uppercase">Loot tiers</h2>
        <ScoringRules />
      </div>
      <div className="card p-5 text-ink-300">
        <h3 className="mb-2 font-bold text-white">Fair play</h3>
        The list of valid answers never reaches your browser before you answer. Timing is measured on our servers, unusual
        patterns are reviewed, and each account gets one ranked run per day. Reloading the page doesn&apos;t reset the clock.
      </div>
      <Link href="/play" className="btn-primary">
        Play today&apos;s hunt
      </Link>
    </div>
  );
}
