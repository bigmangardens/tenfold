"use client";

import { useEffect, useState } from "react";

function msToNextUtcMidnight() {
  const now = new Date();
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

/** Time until the next daily reset (00:00 UTC). */
export function Countdown({ className = "" }: { className?: string }) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    setMs(msToNextUtcMidnight());
    const t = setInterval(() => setMs(msToNextUtcMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  if (ms === null) return <span className={className}>--:--:--</span>;
  const s = Math.floor(ms / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={`tabular-nums ${className}`}>
      {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </span>
  );
}
