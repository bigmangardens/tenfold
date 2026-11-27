"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Flag } from "@/components/Flag";
import { Empty, SectionTitle } from "@/components/Stat";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/format";
import type { AvatarConfig } from "@/lib/types";

type Person = { id: number; user_id: string; username: string; avatar: AvatarConfig; country?: string | null };
export type FriendsData = {
  friends: (Person & { streak: number; played_today: boolean })[];
  incoming: Person[];
  outgoing: Person[];
};
type SearchRow = { user_id: string; username: string; avatar: AvatarConfig; country: string | null; friendship: string };

export function FriendsClient({ initial }: { initial: FriendsData }) {
  const supabase = createClient();
  const [data, setData] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc("get_friends");
    if (data) setData(data as FriendsData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return setResults([]);
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_users", { p_query: query.trim() });
      if (error) setError(friendlyError(error));
      else setResults((data ?? []) as SearchRow[]);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const act = async (fn: () => PromiseLike<{ error: unknown }>) => {
    setError(null);
    const { error } = await fn();
    if (error) setError(friendlyError(error));
    await refresh();
    if (query.trim().length >= 2) {
      const { data } = await supabase.rpc("search_users", { p_query: query.trim() });
      setResults((data ?? []) as SearchRow[]);
    }
  };

  const add = (username: string) => act(() => supabase.rpc("send_friend_request", { p_username: username }));
  const respond = (id: number, accept: boolean) =>
    act(() => supabase.rpc("respond_friend_request", { p_request: id, p_accept: accept }));
  const remove = (id: number) => act(() => supabase.from("friendships").delete().eq("id", id));

  const Row = ({ p, children, sub }: { p: { username: string; avatar: AvatarConfig; country?: string | null }; children?: React.ReactNode; sub?: React.ReactNode }) => (
    <li className="list-row">
      <Link href={`/u/${p.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar config={p.avatar} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate font-medium hover:underline">
            {p.username} <Flag code={p.country} />
          </div>
          {sub && <div className="text-xs text-ink-400">{sub}</div>}
        </div>
      </Link>
      <div className="flex shrink-0 gap-2">{children}</div>
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Friends</h1>
        <p className="mt-1 text-sm text-ink-400">Add players to compare scores on your friends leaderboard.</p>
      </div>

      <section>
        <input
          className="input py-3 text-base"
          placeholder="Search players by username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search players"
        />
        {error && <p className="mt-2 text-sm text-bad">{error}</p>}
        {results.length > 0 && (
          <ul className="card mt-3 overflow-hidden">
            {results.map((r) => (
              <Row key={r.user_id} p={r}>
                {r.friendship === "friends" ? (
                  <span className="chip text-good">Friends</span>
                ) : r.friendship === "outgoing" ? (
                  <span className="chip">Requested</span>
                ) : (
                  <button className="btn-primary px-3 py-1.5" onClick={() => add(r.username)}>
                    {r.friendship === "incoming" ? "Accept" : "Add"}
                  </button>
                )}
              </Row>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && results.length === 0 && <p className="mt-3 text-sm text-ink-400">No players found.</p>}
      </section>

      {data.incoming.length > 0 && (
        <section>
          <SectionTitle>Requests</SectionTitle>
          <ul className="card overflow-hidden">
            {data.incoming.map((p) => (
              <Row key={p.id} p={p} sub="wants to be friends">
                <button className="btn-primary px-3 py-1.5" onClick={() => respond(p.id, true)}>
                  Accept
                </button>
                <button className="btn-ghost px-3 py-1.5" onClick={() => respond(p.id, false)}>
                  Decline
                </button>
              </Row>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle
          action={
            <Link href="/leaderboards?scope=friends" className="text-sm text-brand-400 hover:underline">
              Friends leaderboard →
            </Link>
          }
        >
          Your friends ({data.friends.length})
        </SectionTitle>
        <ul className="card overflow-hidden">
          {data.friends.length ? (
            data.friends.map((p) => (
              <Row
                key={p.id}
                p={p}
                sub={
                  <>
                    {p.played_today ? <span className="text-good">Played today</span> : "Not played today"}
                    {p.streak > 0 && <span className="text-flame"> · 🔥 {p.streak}</span>}
                  </>
                }
              >
                <button className="btn-ghost px-3 py-1.5 text-ink-300" onClick={() => remove(p.id)}>
                  Remove
                </button>
              </Row>
            ))
          ) : (
            <Empty>No friends yet. Search above to add some.</Empty>
          )}
        </ul>
      </section>

      {data.outgoing.length > 0 && (
        <section>
          <SectionTitle>Sent requests</SectionTitle>
          <ul className="card overflow-hidden">
            {data.outgoing.map((p) => (
              <Row key={p.id} p={p} sub="pending">
                <button className="btn-ghost px-3 py-1.5" onClick={() => remove(p.id)}>
                  Cancel
                </button>
              </Row>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
