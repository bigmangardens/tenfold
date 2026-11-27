import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { Countdown } from "@/components/Countdown";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { ScoringRules } from "@/components/ScoringRules";
import { Avatar } from "@/components/Avatar";
import { CATEGORY_META, fmt } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const { supabase, user } = await getSessionUser();
  if (user) redirect("/dashboard");

  const [{ data: info }, { data: top }] = await Promise.all([
    supabase.rpc("get_today_info"),
    supabase.rpc("get_leaderboard", { p_period: "daily", p_scope: "global", p_limit: 5 }),
  ]);
  const rows = (top ?? []) as LeaderboardRow[];

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-4 md:grid-cols-[1.15fr_1fr] md:pt-10">
        <div className="animate-fade-up">
          <span className="chip border-brand/30 bg-brand/10 text-brand-400">
            Quiz #{info?.quiz_number ?? "…"} is live · resets in <Countdown className="font-semibold text-white" />
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            Ten questions.
            <br />
            <span className="text-gradient">One shot a day.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-300">
            Every day the whole world gets the same ten general-knowledge questions. Fifteen seconds each. Fast and right
            wins. Build your streak, dress up your avatar and climb the global board.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary px-6 py-3 text-base">
              Play today&apos;s quiz
            </Link>
            <Link href="/leaderboards" className="btn-ghost px-6 py-3 text-base">
              See the leaderboard
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-ink-400">
            <span>
              <b className="text-white">{fmt(info?.players_today)}</b> played today
            </span>
            <span>
              <b className="text-white">{fmt(info?.total_players)}</b> players
            </span>
          </div>
        </div>

        <div className="card relative animate-fade-up overflow-hidden p-6 [animation-delay:120ms]">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
          <div className="flex items-center justify-between text-xs text-ink-400">
            <span className="chip">🧭 Geography</span>
            <span>Question 4 of 10</span>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-brand to-aqua" />
          </div>
          <p className="mt-6 font-display text-xl font-semibold">Which of these countries has the most natural lakes?</p>
          <div className="mt-5 grid gap-2.5">
            {["Russia", "Canada", "United States", "Finland"].map((o, i) => (
              <div
                key={o}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  i === 1 ? "border-good/50 bg-good/10 text-white" : "border-white/[0.07] bg-white/[0.02] text-ink-200"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-xs font-bold">
                  {"ABCD"[i]}
                </span>
                {o}
                {i === 1 && <span className="ml-auto font-semibold text-good">+912</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["🌍", "One quiz, whole world", "Same ten questions for every player, resetting at midnight UTC."],
          ["⚡", "Speed counts", "Correct answers score 500 plus a speed bonus of up to 500 more."],
          ["🔥", "Keep the streak alive", "Play daily to build streaks and unlock rare avatar cosmetics."],
        ].map(([icon, title, body]) => (
          <div key={title} className="card p-6">
            <div className="text-3xl">{icon}</div>
            <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-ink-300">{body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-bold">Today&apos;s top five</h2>
          <p className="mt-1 text-sm text-ink-400">Live global ranking for quiz #{info?.quiz_number}.</p>
          <div className="card mt-5 overflow-hidden">
            <LeaderboardTable rows={rows} compact />
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">How scoring works</h2>
          <p className="mt-1 text-sm text-ink-400">Transparent, and validated on the server.</p>
          <div className="mt-5">
            <ScoringRules />
          </div>
        </div>
      </section>

      <section className="card flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-left">
        <div className="flex -space-x-3">
          {[
            { skin: "s2", hair: "bob", hairColor: "auburn", outfitColor: "cyan", background: "ocean", hat: "none" },
            { skin: "s6", hair: "afro", hairColor: "black", outfitColor: "amber", background: "plum", accessory: "round" },
            { skin: "s4", hair: "mohawk", hairColor: "neon", outfit: "jacket", outfitColor: "coral", background: "aurora", accessory: "shades" },
            { skin: "s8", hair: "none", outfit: "robe", hat: "wizard", background: "cosmos", eyes: "star" },
          ].map((c, i) => (
            <Avatar key={i} config={c} size={64} className="ring-4 ring-ink-850" />
          ))}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold">Make it yours</h3>
          <p className="mt-1 text-sm text-ink-300">
            Dozens of free styles, plus rare cosmetics you can only earn by playing: crowns, wizard hats and cosmic
            backdrops. Nothing to buy, ever.
          </p>
        </div>
        <Link href="/signup" className="btn-primary">
          Create your player
        </Link>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-ink-400 sm:flex-row">
        <span>© {new Date().getUTCFullYear()} Tenfold</span>
        <div className="flex gap-4">
          {Object.values(CATEGORY_META).map((c) => (
            <span key={c.label} title={c.label}>
              {c.icon}
            </span>
          ))}
        </div>
        <Link href="/how-to-play" className="hover:text-white">
          How to play
        </Link>
      </footer>
    </div>
  );
}
