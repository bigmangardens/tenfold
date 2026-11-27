import { TIERS } from "@/lib/rarity";

export function ScoringRules() {
  const pts: Record<string, string> = {
    legendary: "1,000",
    epic: "760–1,000",
    rare: "610–760",
    uncommon: "460–610",
    common: "100–460",
  };
  const share: Record<string, string> = {
    legendary: "0.5% of players or fewer",
    epic: "up to 2%",
    rare: "up to 5%",
    uncommon: "up to 12%",
    common: "more than 12%",
  };
  return (
    <div className="card overflow-hidden">
      <ul>
        {TIERS.map((t) => (
          <li key={t.id} className="list-row justify-between">
            <span className="flex items-center gap-3">
              <span className="h-4 w-4 border-2 border-black" style={{ background: t.color }} />
              <span>
                <span className="font-bold" style={{ color: t.color }}>
                  {t.label}
                </span>
                <span className="ml-2 text-sm text-ink-400">{share[t.id]}</span>
              </span>
            </span>
            <span className="text-right font-bold text-white">{pts[t.id]}</span>
          </li>
        ))}
        <li className="list-row justify-between">
          <span className="flex items-center gap-3">
            <span className="h-4 w-4 border-2 border-black bg-bad" />
            Not on the list, or time&apos;s up
          </span>
          <span className="font-bold text-white">0</span>
        </li>
      </ul>
      <div className="border-t-2 border-ink-700 bg-ink-900 px-4 py-3 text-sm leading-relaxed text-ink-400">
        Rarity is the share of ranked players who gave the same answer, so it keeps shifting as people play. Small spelling
        mistakes are autocorrected to the closest valid answer. Everything is checked on our servers, and ties are broken by
        total answer time. Max 10,000 per day.
      </div>
    </div>
  );
}
