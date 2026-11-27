/**
 * Tenfold's night-arcade backdrop: a pixel crescent moon over two ridges of
 * crystal hills, with gems of each loot tier glinting in the rock.
 * Pure SVG with crisp edges, deterministic so server and client agree.
 */
const W = 160;
const H = 70;

function ridge(seed: number, base: number, amp: number, step: number) {
  const pts: number[] = [];
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let h = base;
  for (let x = 0; x < W; x += step) {
    h = Math.max(base - amp, Math.min(base + amp, h + Math.round((rnd() - 0.5) * amp)));
    pts.push(h);
  }
  return pts;
}

const MOON = ["..xxxx..", ".xxxxx..", "xxxx....", "xxx.....", "xxx.....", "xxxx....", ".xxxxx..", "..xxxx.."];
const GEMS: [number, number, string][] = [
  [18, 58, "#FFC83D"],
  [44, 52, "#C26BFF"],
  [71, 60, "#4EA8FF"],
  [97, 55, "#5CE07A"],
  [126, 59, "#C26BFF"],
  [146, 53, "#FFC83D"],
];

export function PixelScene({ className = "" }: { className?: string }) {
  const back = ridge(7, 44, 8, 4);
  const front = ridge(19, 54, 6, 5);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} shapeRendering="crispEdges" preserveAspectRatio="xMidYMax slice" aria-hidden>
      {/* moon */}
      {MOON.flatMap((row, y) =>
        row.split("").map((c, x) => (c === "x" ? <rect key={`m${x}-${y}`} x={124 + x} y={8 + y} width="1" height="1" fill="#FFF4C2" /> : null)),
      )}
      <rect x="121" y="5" width="14" height="14" fill="#FFF4C2" opacity=".06" />
      {/* back ridge */}
      {back.map((h, i) => (
        <rect key={`b${i}`} x={i * 4} y={h} width="4" height={H - h} fill="#2A1A5E" />
      ))}
      {back.map((h, i) => (
        <rect key={`bt${i}`} x={i * 4} y={h} width="4" height="1" fill="#4B37A0" />
      ))}
      {/* front ridge */}
      {front.map((h, i) => (
        <rect key={`f${i}`} x={i * 5} y={h} width="5" height={H - h} fill="#150F36" />
      ))}
      {front.map((h, i) => (
        <rect key={`ft${i}`} x={i * 5} y={h} width="5" height="1" fill="#3A2F7E" />
      ))}
      {/* gems */}
      {GEMS.map(([x, y, c], i) => (
        <g key={`g${i}`} className="animate-twinkle" style={{ animationDelay: `${i * 0.45}s` }}>
          <rect x={x} y={y} width="2" height="2" fill={c} />
          <rect x={x - 1} y={y + 1} width="4" height="1" fill={c} opacity=".7" />
          <rect x={x} y={y} width="1" height="1" fill="#fff" />
        </g>
      ))}
    </svg>
  );
}
