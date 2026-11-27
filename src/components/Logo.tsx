import Link from "next/link";

/** Tenfold mark: ten points stacked 4-3-2-1, one for each daily question. */
export function LogoMark({ size = 32 }: { size?: number }) {
  const dots: [number, number][] = [];
  const rows = [4, 3, 2, 1];
  rows.forEach((n, r) => {
    for (let i = 0; i < n; i++) dots.push([9 + i * 5 + r * 2.5, 23.6 - r * 4.4]);
  });
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
      <defs>
        <linearGradient id="tf-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9B83FF" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#tf-logo)" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x + 1.5} cy={y + 1.2} r={i === 9 ? 2.3 : 1.9} fill="#fff" opacity={i === 9 ? 1 : 0.92} />
      ))}
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Tenfold home">
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight">Tenfold</span>
    </Link>
  );
}
