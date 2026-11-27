/** Loot tiers for answers, from the share of players who gave the same answer. */
export type Tier = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const TIERS: { id: Tier; label: string; color: string; emoji: string; max: number }[] = [
  { id: "legendary", label: "Legendary", color: "#FFC83D", emoji: "🟨", max: 0.5 },
  { id: "epic", label: "Epic", color: "#C26BFF", emoji: "🟪", max: 2 },
  { id: "rare", label: "Rare", color: "#4EA8FF", emoji: "🟦", max: 5 },
  { id: "uncommon", label: "Uncommon", color: "#5CE07A", emoji: "🟩", max: 12 },
  { id: "common", label: "Common", color: "#A9A4C8", emoji: "⬜", max: 101 },
];

export function tierOf(pct: number | null | undefined) {
  if (pct === null || pct === undefined) return null;
  return TIERS.find((t) => pct <= t.max) ?? TIERS[TIERS.length - 1];
}

export const fmtPct = (pct: number | null | undefined) => {
  if (pct === null || pct === undefined) return "–";
  const n = Number(pct);
  return n < 10 ? `${n.toFixed(1)}%` : `${Math.round(n)}%`;
};
