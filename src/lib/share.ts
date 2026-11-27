import { fmt, siteUrl } from "./format";
import { tierOf } from "./rarity";

/** Spoiler-free share text: score and a rarity grid, never prompts or answers. */
export function shareText(o: { quiz_number: number; score: number; cells: { ok: boolean; pct: number | null }[]; streak?: number }) {
  const grid = o.cells.map((c) => (c.ok ? (tierOf(c.pct)?.emoji ?? "⬜") : "⬛")).join("");
  const lines = [`Tenfold #${o.quiz_number} · ${fmt(o.score)}/10,000`, grid];
  if (o.streak && o.streak > 1) lines.push(`🔥 ${o.streak}-day streak`);
  return lines.join("\n");
}

export const shareUrl = (attemptId: string) => `${siteUrl()}/r/${attemptId}`;
