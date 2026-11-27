export function StreakFlame({ days, size = "md" }: { days: number; size?: "md" | "lg" }) {
  const lit = days > 0;
  const big = size === "lg";
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 24 24" width={big ? 40 : 22} height={big ? 40 : 22} aria-hidden>
        <defs>
          <linearGradient id="tf-flame" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#F97316" />
            <stop offset="1" stopColor="#FFD166" />
          </linearGradient>
        </defs>
        <path
          d="M12 2c1 3.5 5 5.6 5 10.3A5 5 0 017 12.6c0-2 1-3.4 2.2-4.5.2 1.6 1 2.6 2.1 3C11 8.6 11 5.3 12 2z"
          fill={lit ? "url(#tf-flame)" : "#3A4157"}
        />
        <path d="M12 21a3.4 3.4 0 01-3.4-3.4c0-1.6 1.2-2.6 2-3.6.2 1 .8 1.5 1.4 1.7.2-1 .7-1.8 1.4-2.6.8 1.2 2 2.5 2 4.4A3.4 3.4 0 0112 21z" fill={lit ? "#FFF1C1" : "#2A3042"} transform="translate(0 -2)" />
      </svg>
      <span className={`font-display font-bold tabular-nums ${big ? "text-4xl" : "text-lg"} ${lit ? "text-flame" : "text-ink-400"}`}>
        {days}
      </span>
    </div>
  );
}
