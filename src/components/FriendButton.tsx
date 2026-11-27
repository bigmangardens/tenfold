"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/format";

type Status = "none" | "friends" | "outgoing" | "incoming";

export function FriendButton({ username, initial, loggedIn }: { username: string; initial: Status; loggedIn: boolean }) {
  const [status, setStatus] = useState<Status>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  if (!loggedIn)
    return (
      <a href={`/login?next=/u/${username}`} className="btn-ghost">
        Log in to add friend
      </a>
    );

  const send = async () => {
    setBusy(true);
    setErr(null);
    const { data, error } = await createClient().rpc("send_friend_request", { p_username: username });
    setBusy(false);
    if (error) return setErr(friendlyError(error));
    setStatus(data as Status);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-start gap-1">
      {status === "friends" ? (
        <span className="chip border-good/30 text-good">✓ Friends</span>
      ) : status === "outgoing" ? (
        <span className="chip">Request sent</span>
      ) : (
        <button onClick={send} disabled={busy} className="btn-primary">
          {status === "incoming" ? "Accept friend request" : "Add friend"}
        </button>
      )}
      {err && <span className="text-xs text-bad">{err}</span>}
    </div>
  );
}
