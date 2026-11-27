import type { Metadata } from "next";
import Link from "next/link";
import { tierOf } from "@/lib/rarity";
import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { Flag } from "@/components/Flag";
import { fmt, formatDate } from "@/lib/format";
import type { ShareCard } from "@/lib/types";

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAnonClient().rpc("get_share_card", { p_attempt: id });
  return (data as ShareCard | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = await load(id);
  if (!c) return { title: "Result not found" };
  const title = `${c.username} scored ${fmt(c.score)} on Tenfold #${c.quiz_number}`;
  return {
    title,
    description: "Can you beat it? Ten questions, fifteen seconds each, one shot a day.",
    openGraph: { title, images: [{ url: `/api/card/${id}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [`/api/card/${id}`] },
  };
}

export default async function SharedResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await load(id);
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-lg animate-fade-up text-center">
      <div className="card p-8">
        <div className="text-sm text-ink-400">
          Tenfold #{c.quiz_number} · {formatDate(c.quiz_date, { month: "long", day: "numeric", year: "numeric" })}
        </div>
        <Link href={`/u/${c.username}`} className="mt-6 inline-flex flex-col items-center gap-3">
          <Avatar config={c.avatar} size={112} rounded="xl" />
          <span className="flex items-center gap-2 font-display text-xl font-semibold hover:underline">
            {c.username} <Flag code={c.country} />
          </span>
        </Link>
        <div className="mt-4 font-arcade text-5xl tabular-nums text-gradient">{fmt(c.score)}</div>
        <div className="mt-1 text-sm text-ink-400">
          {c.correct_count}/10 valid{c.streak > 1 ? ` · 🔥 ${c.streak}-day streak` : ""}
        </div>
        <div className="mt-6 flex gap-1.5">
          {c.grid.map((g, i) => (
            <span key={i} className="h-4 flex-1 border-2 border-black" style={{ background: g.c ? (tierOf(g.r)?.color ?? "#A9A4C8") : "#FF5470" }} />
          ))}
        </div>
      </div>
      <h2 className="mt-10 font-display text-2xl font-bold">Think you can beat that?</h2>
      <p className="mt-2 text-ink-300">Same ten prompts for everyone today. The rarer your answers, the higher you score.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/play" className="btn-primary px-6 py-3">
          Play today&apos;s hunt
        </Link>
        <Link href="/leaderboards" className="btn-ghost px-6 py-3">
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
