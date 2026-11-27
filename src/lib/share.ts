import { fmt, siteUrl } from "./format";

/** Spoiler-free share text: score and a right/wrong grid, never questions or answers. */
export function shareText(o: { quiz_number: number; score: number; correct: boolean[]; streak?: number }) {
  const grid = o.correct.map((c) => (c ? "🟩" : "🟥")).join("");
  const lines = [`Tenfold #${o.quiz_number} · ${fmt(o.score)}/10,000`, grid];
  if (o.streak && o.streak > 1) lines.push(`🔥 ${o.streak}-day streak`);
  return lines.join("\n");
}

export const shareUrl = (attemptId: string) => `${siteUrl()}/r/${attemptId}`;
