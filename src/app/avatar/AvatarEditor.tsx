"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, BACKGROUND, DEFAULT_AVATAR, HAIR_COLOR, OUTFIT_COLOR, SKIN } from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/format";
import type { AvatarConfig, Cosmetic, Slot } from "@/lib/types";

const TABS: { slot: Slot; label: string }[] = [
  { slot: "skin", label: "Skin" },
  { slot: "hair", label: "Hair" },
  { slot: "hairColor", label: "Hair colour" },
  { slot: "eyes", label: "Eyes" },
  { slot: "mouth", label: "Mouth" },
  { slot: "outfit", label: "Outfit" },
  { slot: "outfitColor", label: "Outfit colour" },
  { slot: "hat", label: "Hats" },
  { slot: "accessory", label: "Accessories" },
  { slot: "background", label: "Background" },
];

const SWATCH: Partial<Record<Slot, Record<string, string | string[]>>> = {
  skin: SKIN,
  hairColor: HAIR_COLOR,
  outfitColor: OUTFIT_COLOR,
  background: BACKGROUND,
};

const RARITY: Record<string, string> = {
  common: "",
  rare: "#22D3EE",
  epic: "#B4A2FF",
  legendary: "#FFB547",
};

export function AvatarEditor({ initial, items, username }: { initial: AvatarConfig; items: Cosmetic[]; username: string }) {
  const [config, setConfig] = useState<AvatarConfig>({ ...DEFAULT_AVATAR, ...initial });
  const [saved, setSaved] = useState<AvatarConfig>({ ...DEFAULT_AVATAR, ...initial });
  const [tab, setTab] = useState<Slot>("skin");
  const [status, setStatus] = useState<{ ok?: string; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const bySlot = useMemo(() => {
    const m = new Map<Slot, Cosmetic[]>();
    items.forEach((c) => m.set(c.slot, [...(m.get(c.slot) ?? []), c]));
    return m;
  }, [items]);
  const unlockedCount = items.filter((i) => !i.is_free && i.unlocked).length;
  const lockedTotal = items.filter((i) => !i.is_free).length;
  const dirty = JSON.stringify(config) !== JSON.stringify(saved);

  const randomize = () => {
    const next = { ...config };
    TABS.forEach(({ slot }) => {
      const opts = (bySlot.get(slot) ?? []).filter((c) => c.unlocked);
      if (opts.length) next[slot] = opts[Math.floor(Math.random() * opts.length)].value;
    });
    setConfig(next);
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    const { data, error } = await createClient().rpc("save_avatar", { p_config: config });
    setBusy(false);
    if (error) return setStatus({ error: friendlyError(error) });
    setSaved(data as AvatarConfig);
    setStatus({ ok: "Avatar saved" });
    router.refresh();
  };

  const options = bySlot.get(tab) ?? [];
  const swatch = SWATCH[tab];

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="card flex flex-col items-center p-6">
          <div key={JSON.stringify(config)} className="animate-pop">
            <Avatar config={config} size={240} rounded="xl" className="ring-1 ring-white/10" />
          </div>
          <div className="mt-4 font-display text-xl font-semibold">{username}</div>
          <div className="mt-1 text-xs text-ink-400">
            {unlockedCount}/{lockedTotal} rare cosmetics unlocked
          </div>
          <div className="mt-5 flex w-full gap-2">
            <button className="btn-ghost flex-1" onClick={randomize}>
              🎲 Randomise
            </button>
            <button className="btn-ghost flex-1" disabled={!dirty} onClick={() => setConfig(saved)}>
              Undo
            </button>
          </div>
          <button className="btn-primary mt-2 w-full" disabled={!dirty || busy} onClick={save}>
            {busy ? "Saving…" : dirty ? "Save avatar" : "Saved"}
          </button>
          {status && (
            <p className={`mt-3 text-sm ${status.error ? "text-bad" : "text-good"}`} role="status">
              {status.error ?? status.ok}
            </p>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-3">
          {TABS.map((t) => (
            <button key={t.slot} onClick={() => setTab(t.slot)} className={`tab shrink-0 ${tab === t.slot ? "tab-active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          {options.map((o) => {
            const active = config[tab] === o.value;
            const sw = swatch?.[o.value];
            const colors = Array.isArray(sw) ? sw : sw ? [sw] : null;
            return (
              <button
                key={o.id}
                disabled={!o.unlocked}
                onClick={() => setConfig((c) => ({ ...c, [tab]: o.value }))}
                title={o.unlocked ? o.name : `Locked: ${o.unlock_hint}`}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                  active ? "border-brand bg-brand/10" : "border-ink-700 bg-white/[0.02] hover:border-white/20"
                } ${o.unlocked ? "" : "cursor-not-allowed"}`}
                style={!active && RARITY[o.rarity] ? { borderColor: RARITY[o.rarity] + "55" } : undefined}
              >
                <div className={o.unlocked ? "" : "opacity-40 grayscale"}>
                  {colors ? (
                    <span
                      className="block h-14 w-14 rounded-full ring-1 ring-white/10"
                      style={{ background: colors.length > 1 ? `linear-gradient(135deg, ${colors.join(",")})` : colors[0] }}
                    />
                  ) : (
                    <Avatar config={{ ...config, [tab]: o.value }} size={56} />
                  )}
                </div>
                <span className="line-clamp-1 text-xs font-medium">{o.name}</span>
                {o.rarity !== "common" && (
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: RARITY[o.rarity] }}>
                    {o.rarity}
                  </span>
                )}
                {!o.unlocked && (
                  <span className="absolute inset-x-1 top-1 flex justify-end">
                    <span className="rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[10px]">🔒</span>
                  </span>
                )}
                {!o.unlocked && <span className="text-[10px] leading-tight text-ink-400">{o.unlock_hint}</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-ink-400">
          Rare items unlock through streaks, perfect games, speed and milestones. They&apos;re cosmetic only and can&apos;t
          be bought.
        </p>
      </div>
    </div>
  );
}
