export function ScoringRules() {
  const rows = [
    ["Correct answer", "500 points"],
    ["Speed bonus", "up to +500, shrinking every millisecond over 15 seconds"],
    ["Wrong answer or time out", "0 points"],
    ["Maximum per question", "1,000"],
    ["Maximum per quiz", "10,000"],
  ];
  return (
    <div className="card overflow-hidden">
      <ul>
        {rows.map(([k, v]) => (
          <li key={k} className="list-row justify-between text-sm">
            <span className="text-ink-200">{k}</span>
            <span className="text-right font-semibold text-white">{v}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-white/[0.05] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-ink-400">
        Points = 500 + 500 × (time left ÷ 15s). Timing is measured on our servers, not your device, and ties are
        broken by total answer time. Everyone gets the same 10 questions each UTC day.
      </div>
    </div>
  );
}
