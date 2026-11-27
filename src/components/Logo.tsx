import Link from "next/link";

// 12x12 pixel gem: the Tenfold mark. Each row is a string of palette keys.
const GEM = [
  "....kkkk....",
  "...kyyyyk...",
  "..kywwyyyk..",
  ".kywwyyyoyk.",
  "kkkkkkkkkkkk",
  "kyyoyyyyoyyk",
  ".kyoyyyyoyk.",
  "..kyoyyoyk..",
  "...kyooyk...",
  "....kyyk....",
  ".....kk.....",
  "............",
];
const PAL: Record<string, string> = { k: "#2A1060", y: "#FFC83D", w: "#FFF4C2", o: "#FF8A3D" };

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden>
      {GEM.flatMap((row, y) =>
        row.split("").map((c, x) => (PAL[c] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={PAL[c]} /> : null)),
      )}
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="Tenfold home">
      <LogoMark />
      <span className="arcade-title text-sm [text-shadow:2px_2px_0_#7a3cff]">Tenfold</span>
    </Link>
  );
}
