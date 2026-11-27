import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/format";
import { reviewFlag } from "../users/actions";

type FlagRow = {
  id: number;
  reason: string;
  details: Record<string, unknown>;
  status: string;
  created_at: string;
  attempt_id: string;
  user_id: string;
  username: string;
  score: number;
  quiz_date: string;
  timings: { pos: number; ms: number; ok: boolean }[];
  user_history: { games: number; avg: number; flags: number };
};

const REASONS: Record<string, string> = {
  implausibly_fast: "8+ correct with an average under 1.2s",
  sub_human_reaction: "A correct answer in under 0.35s",
};

export default async function FlagsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "open" } = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_flags", { p_status: status });
  if (error) throw new Error(error.message);
  const flags = (data ?? []) as FlagRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {["open", "cleared", "voided", "all"].map((s) => (
          <Link key={s} href={`/admin/flags?status=${s}`} className={`tab capitalize ${status === s ? "tab-active" : ""}`}>
            {s}
          </Link>
        ))}
      </div>
      {flags.length === 0 && <div className="card p-8 text-center text-sm text-ink-400">Nothing to review. 🎉</div>}
      {flags.map((f) => (
        <div key={f.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/u/${f.username}`} className="font-semibold hover:underline">
                  {f.username}
                </Link>
                <span className="chip text-bad">{f.reason.replace(/_/g, " ")}</span>
                <span className="chip capitalize">{f.status}</span>
              </div>
              <p className="mt-1 text-sm text-ink-400">
                {REASONS[f.reason] ?? f.reason} · quiz {f.quiz_date} · score {fmt(f.score)} · history: {f.user_history.games} games,
                avg {fmt(f.user_history.avg)}, {f.user_history.flags} flags total
              </p>
            </div>
            {f.status === "open" && (
              <div className="flex gap-2">
                <form action={reviewFlag}>
                  <input type="hidden" name="flag" value={f.id} />
                  <input type="hidden" name="action" value="cleared" />
                  <button className="btn-ghost">Looks fine</button>
                </form>
                <form action={reviewFlag}>
                  <input type="hidden" name="flag" value={f.id} />
                  <input type="hidden" name="action" value="voided" />
                  <button className="btn-danger">Void score</button>
                </form>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-end gap-1.5">
            {f.timings.map((t) => (
              <div key={t.pos} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t ${t.ok ? "bg-good/70" : "bg-bad/70"}`}
                  style={{ height: `${Math.max(4, (Math.min(t.ms ?? 15000, 15000) / 15000) * 80)}px` }}
                />
                <span className="text-[10px] tabular-nums text-ink-400">{((t.ms ?? 0) / 1000).toFixed(1)}s</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
