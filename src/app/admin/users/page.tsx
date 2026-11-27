import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/Flag";
import { fmt } from "@/lib/format";
import { resetUsername, setAdmin, setBan } from "./actions";

type U = {
  id: string;
  username: string;
  email: string;
  country: string | null;
  is_admin: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  games_played: number;
  best_score: number;
  flags: number;
  created_at: string;
  last_sign_in_at: string | null;
};

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users", { p_query: sp.q ?? "", p_limit: 50, p_offset: (page - 1) * 50 });
  if (error) throw new Error(error.message);
  const users = (data ?? []) as U[];

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search username or email…" className="input max-w-sm" />
        <button className="btn-ghost">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-400">
            <tr className="border-b border-white/[0.06]">
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Games</th>
              <th className="px-4 py-3">Best</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b border-white/[0.04] align-top ${u.is_banned ? "bg-bad/[0.05]" : ""}`}>
                <td className="px-4 py-3">
                  <Link href={`/u/${u.username}`} className="font-medium hover:underline">
                    {u.username}
                  </Link>{" "}
                  <Flag code={u.country} />
                  <div className="mt-1 flex gap-1">
                    {u.is_admin && <span className="chip text-flame">admin</span>}
                    {u.is_banned && <span className="chip text-bad" title={u.ban_reason ?? ""}>banned</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-300">
                  {u.email}
                  <div className="text-xs text-ink-400">
                    joined {u.created_at.slice(0, 10)}
                    {u.last_sign_in_at && ` · seen ${u.last_sign_in_at.slice(0, 10)}`}
                  </div>
                </td>
                <td className="px-4 py-3">{u.games_played ?? 0}</td>
                <td className="px-4 py-3">{fmt(u.best_score)}</td>
                <td className="px-4 py-3">{u.flags ? <Link href="/admin/flags" className="text-bad">{u.flags}</Link> : "–"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <form action={resetUsername}>
                      <input type="hidden" name="user" value={u.id} />
                      <button className="btn-ghost px-2.5 py-1 text-xs" title="Replace an inappropriate username">
                        Reset name
                      </button>
                    </form>
                    <form action={setBan} className="flex gap-1">
                      <input type="hidden" name="user" value={u.id} />
                      <input type="hidden" name="banned" value={String(!u.is_banned)} />
                      {!u.is_banned && <input name="reason" placeholder="reason" className="input w-24 px-2 py-1 text-xs" />}
                      <button className={`${u.is_banned ? "btn-ghost" : "btn-danger"} px-2.5 py-1 text-xs`}>
                        {u.is_banned ? "Unban" : "Ban"}
                      </button>
                    </form>
                    <form action={setAdmin}>
                      <input type="hidden" name="user" value={u.id} />
                      <input type="hidden" name="admin" value={String(!u.is_admin)} />
                      <button className="btn-ghost px-2.5 py-1 text-xs">{u.is_admin ? "Revoke admin" : "Make admin"}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        {page > 1 && (
          <Link className="btn-ghost" href={`/admin/users?q=${sp.q ?? ""}&page=${page - 1}`}>
            ← Prev
          </Link>
        )}
        {users.length === 50 && (
          <Link className="btn-ghost" href={`/admin/users?q=${sp.q ?? ""}&page=${page + 1}`}>
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
