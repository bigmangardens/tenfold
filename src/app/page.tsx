import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { Countdown } from "@/components/Countdown";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { ScoringRules } from "@/components/ScoringRules";
import { Avatar } from "@/components/Avatar";
import { PixelScene } from "@/components/PixelScene";
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
      <section className="card relative -mx-4 overflow-hidden border-x-0 px-4 pb-0 pt-10 sm:mx-0 sm:border-x-[3px] sm:pt-14">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <span className="chip border-brand text-brand">
            Hunt #{info?.quiz_number ?? "…"} is live · resets in <Countdown className="font-bold text-white" />
          </span>
          <h1 className="arcade-title mt-8 text-4xl leading-tight sm:text-6xl">Tenfold</h1>
          <p className="mt-6 font-arcade text-[10px] uppercase leading-relaxed tracking-widest text-aqua sm:text-xs">
            The daily rare-answer hunt
          </p>
          <p className="mx-auto mt-6 max-w-lg text-lg text-ink-200">
            Ten open prompts. Thirty seconds each. Type any valid answer, and the fewer players who think of it, the more loot
            it&apos;s worth.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="btn-primary px-7 py-4 text-xs">
              ▶ Press start
            </Link>
            <Link href="/how-to-play" className="btn-ghost px-7 py-4 text-xs">
              How to play
            </Link>
          </div>
          <div className="mt-6 flex justify-center gap-6 text-ink-400">
            <span>
              <b className="text-white">{fmt(info?.players_today)}</b> played today
            </span>
            <span>
              <b className="text-white">{fmt(info?.total_players)}</b> players
            </span>
          </div>
        </div>
        <PixelScene className="pointer-events-none relative -mx-4 mt-6 block h-44 w-[calc(100%+2rem)] sm:h-56" />
      </section>

      <section className="grid items-center gap-8 md:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="font-arcade text-sm uppercase leading-relaxed text-brand">Obvious is cheap. Rare is gold.</h2>
          <p className="mt-4 text-lg text-ink-300">
            Everyone says France. Almost nobody says Liechtenstein. Every valid answer scores, but the rarer it is among today&apos;s
            players, the higher its loot tier. Typos are autocorrected, so you only need to know it, not spell it perfectly.
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between text-sm text-ink-400">
            <span className="chip">🧭 Geography</span>
            <span className="font-arcade text-[10px]">4/10</span>
          </div>
          <p className="mt-4 text-2xl font-bold">Name a country in Europe</p>
          <div className="mt-4 space-y-2">
            {(
              [
                ["France", 18, "#A9A4C8", 390],
                ["Portugal", 4.1, "#4EA8FF", 640],
                ["Liechtenstein", 0.3, "#FFC83D", 1000],
              ] as [string, number, string, number][]
            ).map(([a, pct, c, pts]) => (
              <div key={a} className="flex items-center gap-3 border-2 border-ink-700 bg-ink-900 px-3 py-2">
                <span className="h-3 w-3 border-2 border-black" style={{ background: c }} />
                <span className="flex-1 text-lg">{a}</span>
                <span className="text-sm text-ink-400">{pct}% of players</span>
                <span className="w-16 text-right font-arcade text-xs" style={{ color: c }}>
                  +{pts}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["🌍", "Same ten for everyone", "One set of prompts for the whole world, resetting at midnight UTC."],
          ["💎", "Rarity is the score", "Answers are scored by how few players gave them. The board shifts as people play."],
          ["🔥", "Keep the streak alive", "Play daily to build streaks and unlock rare avatar cosmetics."],
        ].map(([icon, title, body]) => (
          <div key={title} className="card p-6">
            <div className="text-3xl">{icon}</div>
            <h3 className="mt-3 text-xl font-bold">{title}</h3>
            <p className="mt-1.5 text-ink-300">{body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-arcade text-sm uppercase">Today&apos;s top five</h2>
          <p className="mt-2 text-ink-400">Live global ranking for hunt #{info?.quiz_number}.</p>
          <div className="card mt-5 overflow-hidden">
            <LeaderboardTable rows={rows} compact />
          </div>
        </div>
        <div>
          <h2 className="font-arcade text-sm uppercase">Loot tiers</h2>
          <p className="mt-2 text-ink-400">Scored by rarity, checked on our servers.</p>
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
            <Avatar key={i} config={c} size={64} className="border-[3px] border-black" />
          ))}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">Make it yours</h3>
          <p className="mt-1 text-sm text-ink-300">
            Dozens of free styles, plus rare cosmetics you can only earn by playing: crowns, wizard hats and cosmic
            backdrops. Nothing to buy, ever.
          </p>
        </div>
        <Link href="/signup" className="btn-primary">
          Create your player
        </Link>
      </section>

      <footer className="flex flex-col items-center justify-between gap-3 border-t-[3px] border-ink-700 pt-6 text-sm text-ink-400 sm:flex-row">
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
