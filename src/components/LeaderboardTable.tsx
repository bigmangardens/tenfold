import Link from "next/link";
import { Avatar } from "./Avatar";
import { Flag } from "./Flag";
import { Empty } from "./Stat";
import { fmt } from "@/lib/format";
import type { LeaderboardRow } from "@/lib/types";

const MEDAL = ["#FFD166", "#C9CEDF", "#E59866"];

export function LeaderboardTable({
  rows,
  showGames = false,
  empty = "No scores yet. Be the first!",
  compact = false,
}: {
  rows: LeaderboardRow[];
  showGames?: boolean;
  empty?: string;
  compact?: boolean;
}) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <ol>
      {rows.map((r) => (
        <li
          key={r.user_id}
          className={`list-row ${compact ? "py-2.5" : ""} ${r.is_me ? "bg-brand/[0.08]" : "hover:bg-white/[0.02]"}`}
        >
          <span
            className="w-8 shrink-0 text-center font-display text-sm font-bold tabular-nums"
            style={{ color: r.rank <= 3 ? MEDAL[r.rank - 1] : "#6B7390" }}
          >
            {r.rank}
          </span>
          <Link href={`/u/${r.username}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar config={r.avatar} size={compact ? 32 : 38} />
            <span className="truncate font-medium hover:underline">{r.username}</span>
            {r.is_me && <span className="chip border-brand/40 text-brand-400">You</span>}
            <Flag code={r.country} className="text-base" />
          </Link>
          {showGames && <span className="hidden w-16 text-right text-xs text-ink-400 sm:block">{r.games} played</span>}
          <span className="w-20 text-right font-display font-semibold tabular-nums">{fmt(r.score)}</span>
        </li>
      ))}
    </ol>
  );
}
