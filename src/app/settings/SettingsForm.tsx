"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES } from "@/lib/countries";
import { friendlyError } from "@/lib/format";

export type SettingsProfile = {
  username: string;
  country: string | null;
  bio: string | null;
  show_country: boolean;
  show_stats: boolean;
  show_history: boolean;
  show_achievements: boolean;
};

type Msg = { ok?: string; error?: string } | null;

function Note({ m }: { m: Msg }) {
  if (!m) return null;
  return <p className={`text-sm ${m.error ? "text-bad" : "text-good"}`}>{m.error ?? m.ok}</p>;
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-ink-400">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-brand" : "bg-ink-600"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function SettingsForm({ profile, email }: { profile: SettingsProfile; email: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [p, setP] = useState(profile);
  const [username, setUsername] = useState(profile.username);
  const [pw, setPw] = useState("");
  const [msgs, setMsgs] = useState<Record<string, Msg>>({});
  const note = (k: string, m: Msg) => setMsgs((s) => ({ ...s, [k]: m }));

  const saveProfile = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        country: p.country || null,
        bio: p.bio?.trim() || null,
        show_country: p.show_country,
        show_stats: p.show_stats,
        show_history: p.show_history,
        show_achievements: p.show_achievements,
      })
      .eq("id", (await supabase.auth.getUser()).data.user!.id);
    note("profile", error ? { error: friendlyError(error) } : { ok: "Saved" });
    router.refresh();
  };

  const saveUsername = async () => {
    const { error } = await supabase.rpc("change_username", { p_username: username.trim() });
    note("username", error ? { error: friendlyError(error) } : { ok: "Username updated" });
    if (!error) router.refresh();
  };

  const savePassword = async () => {
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw))
      return note("pw", { error: "At least 8 characters with a letter and a number." });
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPw("");
    note("pw", error ? { error: error.message } : { ok: "Password changed" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Settings</h1>

      <section className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div>
          <label className="label">Username</label>
          <div className="flex gap-2">
            <input className="input" value={username} maxLength={20} onChange={(e) => setUsername(e.target.value)} />
            <button className="btn-ghost shrink-0" disabled={username === profile.username} onClick={saveUsername}>
              Change
            </button>
          </div>
          <div className="mt-1.5">
            <Note m={msgs.username ?? null} />
          </div>
        </div>
        <div>
          <label className="label">Country</label>
          <select className="input" value={p.country ?? ""} onChange={(e) => setP({ ...p, country: e.target.value || null })}>
            <option value="">Prefer not to say</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[80px]"
            maxLength={160}
            value={p.bio ?? ""}
            onChange={(e) => setP({ ...p, bio: e.target.value })}
            placeholder="A line about you (160 characters)"
          />
        </div>

        <div className="divide-y divide-white/[0.05] border-t border-ink-700 pt-2">
          <Toggle label="Show my country" hint="Flag on leaderboards and profile; needed for country boards" checked={p.show_country} onChange={(v) => setP({ ...p, show_country: v })} />
          <Toggle label="Show my stats" hint="Games, scores, streaks and rankings on your profile" checked={p.show_stats} onChange={(v) => setP({ ...p, show_stats: v })} />
          <Toggle label="Show recent results" hint="Your last 10 daily scores" checked={p.show_history} onChange={(v) => setP({ ...p, show_history: v })} />
          <Toggle label="Show achievements" hint="Badges you've earned" checked={p.show_achievements} onChange={(v) => setP({ ...p, show_achievements: v })} />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={saveProfile}>
            Save profile
          </button>
          <Note m={msgs.profile ?? null} />
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <div className="text-sm text-ink-300">
          Signed in as <span className="text-white">{email.endsWith("@noemail.tenfold.invalid") ? "username only (no email)" : email}</span>
        </div>
        <div>
          <label className="label">New password</label>
          <div className="flex gap-2">
            <input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="btn-ghost shrink-0" disabled={!pw} onClick={savePassword}>
              Update
            </button>
          </div>
          <div className="mt-1.5">
            <Note m={msgs.pw ?? null} />
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn-danger">Sign out</button>
        </form>
      </section>
    </div>
  );
}
