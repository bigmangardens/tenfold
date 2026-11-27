import type { AvatarConfig } from "@/lib/types";

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: "s3",
  hair: "short",
  hairColor: "brown",
  eyes: "round",
  mouth: "smile",
  outfit: "tee",
  outfitColor: "violet",
  hat: "none",
  accessory: "none",
  background: "midnight",
};

export const SKIN: Record<string, string> = {
  s1: "#FBE3D3",
  s2: "#F3D0B5",
  s3: "#E8B992",
  s4: "#D9A06F",
  s5: "#C1864F",
  s6: "#A26A3E",
  s7: "#7D4E2D",
  s8: "#5A3520",
};

export const HAIR_COLOR: Record<string, string> = {
  black: "#1E1B22",
  brown: "#5B3A26",
  auburn: "#8A3B24",
  blonde: "#E2C27A",
  ginger: "#D9692E",
  grey: "#B9BEC7",
  violet: "#9B6BFF",
  neon: "#2DE2C4",
};

export const OUTFIT_COLOR: Record<string, string> = {
  violet: "#7C5CFF",
  cyan: "#22D3EE",
  coral: "#FF7A6B",
  lime: "#A3E635",
  amber: "#FFB547",
  slate: "#64748B",
  rose: "#F472B6",
  navy: "#1E3A8A",
};

export const BACKGROUND: Record<string, string[]> = {
  midnight: ["#1B1F3B"],
  ocean: ["#0E4D64"],
  forest: ["#14532D"],
  plum: ["#4A1D5F"],
  ember: ["#7C2D12"],
  steel: ["#334155"],
  sunset: ["#F97316", "#DB2777"],
  aurora: ["#7C5CFF", "#22D3EE", "#34D399"],
  gold: ["#B45309", "#F59E0B", "#FDE68A"],
  cosmos: ["#0B1026", "#2E1065"],
};

function Background({ v }: { v: string }) {
  const stops = BACKGROUND[v] ?? BACKGROUND.midnight;
  if (stops.length === 1) return <rect width="120" height="120" fill={stops[0]} />;
  const id = `tf-bg-${v}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {stops.map((c, i) => (
            <stop key={c} offset={i / (stops.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill={`url(#${id})`} />
      {v === "cosmos" && (
        <g fill="#fff">
          {[
            [14, 18, 1.2],
            [30, 40, 0.8],
            [96, 22, 1.4],
            [104, 54, 0.9],
            [20, 70, 1],
            [86, 8, 0.7],
            [50, 12, 0.9],
            [10, 100, 0.8],
            [110, 96, 1.1],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity={0.85} />
          ))}
        </g>
      )}
      {v === "gold" && <circle cx="60" cy="56" r="48" fill="#fff" opacity="0.12" />}
    </>
  );
}

function HairBack({ style, c }: { style: string; c: string }) {
  switch (style) {
    case "long":
      return <path d="M34 50 Q34 26 60 26 Q86 26 86 50 L90 104 Q76 110 60 108 Q44 110 30 104 Z" fill={c} />;
    case "bob":
      return <path d="M33 52 Q32 26 60 26 Q88 26 87 52 L88 82 Q74 86 60 86 Q46 86 32 82 Z" fill={c} />;
    case "curly":
      return (
        <g fill={c}>
          {[
            [36, 44],
            [34, 60],
            [37, 74],
            [84, 44],
            [86, 60],
            [83, 74],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={9} />
          ))}
        </g>
      );
    case "afro":
      return <circle cx="60" cy="46" r="38" fill={c} />;
    case "ponytail":
      return <path d="M80 40 Q100 46 96 76 Q94 90 86 94 Q90 72 78 56 Z" fill={c} />;
    default:
      return null;
  }
}

function HairFront({ style, c }: { style: string; c: string }) {
  switch (style) {
    case "none":
      return null;
    case "buzz":
      return <path d="M36 50 Q36 28 60 28 Q84 28 84 50 Q78 38 60 37 Q42 38 36 50 Z" fill={c} opacity={0.85} />;
    case "short":
      return <path d="M35 52 Q32 26 60 25 Q88 26 85 52 Q82 40 72 36 Q60 42 46 38 Q38 42 35 52 Z" fill={c} />;
    case "side":
      return <path d="M35 54 Q30 24 62 24 Q90 26 85 50 Q78 34 56 36 Q50 46 38 48 Z" fill={c} />;
    case "bob":
      return <path d="M34 54 Q32 26 60 26 Q88 26 86 54 Q84 40 76 40 Q60 44 44 40 Q36 42 34 54 Z" fill={c} />;
    case "long":
      return <path d="M35 56 Q32 26 60 26 Q88 26 85 56 Q82 40 68 36 Q58 44 44 40 Q38 44 35 56 Z" fill={c} />;
    case "curly":
      return (
        <g fill={c}>
          {[
            [40, 36],
            [50, 29],
            [60, 27],
            [70, 29],
            [80, 36],
            [45, 40],
            [75, 40],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={9} />
          ))}
        </g>
      );
    case "afro":
      return <path d="M36 50 Q38 32 60 32 Q82 32 84 50 Q76 40 60 40 Q44 40 36 50 Z" fill={c} />;
    case "bun":
      return (
        <g fill={c}>
          <circle cx="60" cy="20" r="11" />
          <path d="M35 52 Q32 28 60 28 Q88 28 85 52 Q80 38 60 38 Q40 38 35 52 Z" />
        </g>
      );
    case "ponytail":
      return <path d="M35 52 Q32 26 60 26 Q88 26 85 52 Q80 36 60 36 Q42 36 35 52 Z" fill={c} />;
    case "mohawk":
      return (
        <g fill={c}>
          <path d="M52 40 L54 14 L60 22 L64 10 L68 22 L70 40 Q60 36 52 40 Z" />
          <path d="M37 50 Q36 34 52 32 L52 40 Q42 42 37 50 Z M83 50 Q84 34 68 32 L68 40 Q78 42 83 50 Z" opacity={0.35} />
        </g>
      );
    default:
      return null;
  }
}

function Eyes({ style }: { style: string }) {
  const ink = "#1A1626";
  switch (style) {
    case "happy":
      return (
        <g stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M45 59 Q50 53 55 59" />
          <path d="M65 59 Q70 53 75 59" />
        </g>
      );
    case "sleepy":
      return (
        <g stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M45 58 Q50 62 55 58" />
          <path d="M65 58 Q70 62 75 58" />
        </g>
      );
    case "wink":
      return (
        <g>
          <ellipse cx="50" cy="58" rx="3.4" ry="4.2" fill={ink} />
          <circle cx="51.2" cy="56.6" r="1.2" fill="#fff" />
          <path d="M65 58 Q70 54 75 58" stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        </g>
      );
    case "focused":
      return (
        <g>
          <ellipse cx="50" cy="59" rx="3.2" ry="3.2" fill={ink} />
          <ellipse cx="70" cy="59" rx="3.2" ry="3.2" fill={ink} />
          <path d="M44 51 L56 54 M76 51 L64 54" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );
    case "star":
      return (
        <g fill="#FFD43B" stroke="#B7791F" strokeWidth="0.8">
          {[50, 70].map((x) => (
            <path
              key={x}
              d={`M${x} 52 L${x + 1.8} 56.4 L${x + 6} 56.8 L${x + 2.8} 59.6 L${x + 3.8} 64 L${x} 61.6 L${x - 3.8} 64 L${x - 2.8} 59.6 L${x - 6} 56.8 L${x - 1.8} 56.4 Z`}
            />
          ))}
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx="50" cy="58" rx="3.4" ry="4.2" fill={ink} />
          <ellipse cx="70" cy="58" rx="3.4" ry="4.2" fill={ink} />
          <circle cx="51.2" cy="56.6" r="1.2" fill="#fff" />
          <circle cx="71.2" cy="56.6" r="1.2" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ style }: { style: string }) {
  const ink = "#3B1F2B";
  switch (style) {
    case "grin":
      return (
        <g>
          <path d="M50 69 Q60 80 70 69 Z" fill={ink} />
          <path d="M52 69.6 L68 69.6 L67 72 L53 72 Z" fill="#fff" />
        </g>
      );
    case "neutral":
      return <path d="M53 71 L67 71" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />;
    case "open":
      return <ellipse cx="60" cy="72" rx="5" ry="6" fill={ink} />;
    case "smirk":
      return <path d="M52 72 Q62 75 69 68" stroke={ink} strokeWidth="2.6" strokeLinecap="round" fill="none" />;
    default:
      return <path d="M51 69 Q60 77 69 69" stroke={ink} strokeWidth="2.8" strokeLinecap="round" fill="none" />;
  }
}

function Outfit({ style, c, skin }: { style: string; c: string; skin: string }) {
  const body = "M16 120 C16 98 36 88 60 88 C84 88 104 98 104 120 Z";
  switch (style) {
    case "hoodie":
      return (
        <g>
          <path d={body} fill={c} />
          <path d="M40 92 Q60 108 80 92 Q72 86 60 86 Q48 86 40 92 Z" fill="#000" opacity="0.18" />
          <path d="M54 98 L53 112 M66 98 L67 112" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    case "collar":
      return (
        <g>
          <path d={body} fill={c} />
          <path d="M50 88 L60 98 L70 88 Z" fill={skin} />
          <path d="M48 87 L58 100 L52 102 L44 90 Z M72 87 L62 100 L68 102 L76 90 Z" fill="#fff" />
          <circle cx="60" cy="106" r="1.4" fill="#fff" />
          <circle cx="60" cy="112" r="1.4" fill="#fff" />
        </g>
      );
    case "sweater":
      return (
        <g>
          <path d={body} fill={c} />
          <path d="M48 89 Q60 100 72 89" stroke="#000" strokeOpacity="0.2" strokeWidth="5" fill="none" />
          <path d="M30 108 L90 108" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="3 3" />
        </g>
      );
    case "jacket":
      return (
        <g>
          <path d={body} fill={c} />
          <path d="M16 120 C16 102 26 93 38 90 L42 120 Z M104 120 C104 102 94 93 82 90 L78 120 Z" fill="#F8FAFC" />
          <path d="M50 88 Q60 98 70 88" stroke="#F8FAFC" strokeWidth="4" fill="none" />
          <text x="52" y="113" fontSize="14" fontWeight="800" fill="#F8FAFC" fontFamily="sans-serif">
            T
          </text>
        </g>
      );
    case "suit":
      return (
        <g>
          <path d={body} fill="#1F2433" />
          <path d="M50 88 L60 120 L70 88 Z" fill="#F8FAFC" />
          <path d="M57 92 L63 92 L62 96 L64 112 L60 116 L56 112 L58 96 Z" fill={c} />
          <path d="M48 88 L58 108 L50 102 L42 92 Z M72 88 L62 108 L70 102 L78 92 Z" fill="#2B3144" />
        </g>
      );
    case "robe":
      return (
        <g>
          <path d={body} fill="#2A1B4A" />
          <path d="M48 88 L60 120 L72 88" stroke="#F5C451" strokeWidth="4" fill="none" />
          <path d="M50 88 Q60 96 70 88" fill={skin} />
          <circle cx="40" cy="108" r="2" fill="#F5C451" />
          <circle cx="80" cy="108" r="2" fill="#F5C451" />
          <path d="M20 118 L100 118" stroke={c} strokeWidth="3" />
        </g>
      );
    default: // tee
      return (
        <g>
          <path d={body} fill={c} />
          <path d="M49 88 Q60 99 71 88 Z" fill={skin} />
        </g>
      );
  }
}

function Accessory({ style }: { style: string }) {
  switch (style) {
    case "glasses":
      return (
        <g stroke="#111827" strokeWidth="2.2" fill="#fff" fillOpacity="0.12">
          <rect x="42" y="52" width="15" height="12" rx="3" />
          <rect x="63" y="52" width="15" height="12" rx="3" />
          <path d="M57 57 L63 57" />
        </g>
      );
    case "round":
      return (
        <g stroke="#B7791F" strokeWidth="2" fill="#fff" fillOpacity="0.1">
          <circle cx="50" cy="58" r="7.5" />
          <circle cx="70" cy="58" r="7.5" />
          <path d="M57.5 57 L62.5 57" />
        </g>
      );
    case "shades":
      return (
        <g>
          <path d="M40 52 L80 52 L78 62 Q72 66 64 62 L60 57 L56 62 Q48 66 42 62 Z" fill="#0B0D12" />
          <path d="M44 54 L52 54" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case "monocle":
      return (
        <g stroke="#F5C451" strokeWidth="2" fill="#fff" fillOpacity="0.15">
          <circle cx="70" cy="58" r="8" />
          <path d="M77 62 Q82 76 78 90" fill="none" strokeWidth="1.2" />
        </g>
      );
    case "earring":
      return <circle cx="36" cy="68" r="2.6" fill="#F5C451" stroke="#B7791F" strokeWidth="0.8" />;
    case "freckles":
      return (
        <g fill="#9A5B3C" opacity="0.6">
          {[
            [44, 66],
            [47, 64],
            [46, 68],
            [74, 66],
            [73, 64],
            [76, 68],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function Hat({ style, c }: { style: string; c: string }) {
  switch (style) {
    case "beanie":
      return (
        <g>
          <path d="M34 46 Q34 18 60 18 Q86 18 86 46 Z" fill={c} />
          <rect x="32" y="40" width="56" height="10" rx="5" fill="#000" fillOpacity="0.25" />
          <rect x="32" y="40" width="56" height="10" rx="5" fill={c} fillOpacity="0.8" />
          <circle cx="60" cy="16" r="5" fill="#F8FAFC" />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M35 44 Q35 20 60 20 Q85 20 85 44 Z" fill={c} />
          <path d="M60 40 Q90 38 100 46 Q86 50 60 46 Z" fill={c} />
          <path d="M60 40 Q90 38 100 46 Q86 50 60 46 Z" fill="#000" fillOpacity="0.2" />
          <circle cx="60" cy="21" r="2.4" fill="#000" fillOpacity="0.25" />
        </g>
      );
    case "headband":
      return <path d="M35 42 Q60 30 85 42 L85 48 Q60 36 35 48 Z" fill={c} />;
    case "party":
      return (
        <g>
          <path d="M46 34 L60 2 L74 34 Z" fill="#F472B6" />
          <path d="M50 26 L70 26 M53 18 L67 18 M56 10 L64 10" stroke="#FDE68A" strokeWidth="3" />
          <circle cx="60" cy="3" r="4" fill="#22D3EE" />
        </g>
      );
    case "laurel":
      return (
        <g fill="#65A30D">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <ellipse cx={38 + i * 3} cy={44 - i * 4} rx="5" ry="2.4" transform={`rotate(${-50 + i * 10} ${38 + i * 3} ${44 - i * 4})`} />
              <ellipse cx={82 - i * 3} cy={44 - i * 4} rx="5" ry="2.4" transform={`rotate(${50 - i * 10} ${82 - i * 3} ${44 - i * 4})`} />
            </g>
          ))}
        </g>
      );
    case "crown":
      return (
        <g>
          <path d="M38 38 L40 14 L50 26 L60 10 L70 26 L80 14 L82 38 Z" fill="#F5C451" stroke="#B7791F" strokeWidth="1.2" />
          <circle cx="60" cy="30" r="3" fill="#F472B6" />
          <circle cx="47" cy="32" r="2.2" fill="#22D3EE" />
          <circle cx="73" cy="32" r="2.2" fill="#22D3EE" />
        </g>
      );
    case "wizard":
      return (
        <g>
          <path d="M30 40 Q60 30 90 40 Q60 48 30 40 Z" fill="#312E81" />
          <path d="M42 38 Q54 20 62 0 Q66 20 78 38 Z" fill="#3730A3" />
          <path d="M57 22 L58.6 25.4 L62 25.8 L59.4 28 L60.2 31.4 L57 29.6 L53.8 31.4 L54.6 28 L52 25.8 L55.4 25.4 Z" fill="#FDE68A" />
        </g>
      );
    default:
      return null;
  }
}

export function Avatar({
  config,
  size = 48,
  className = "",
  rounded = "full",
  title,
}: {
  config?: Partial<AvatarConfig> | null;
  size?: number;
  className?: string;
  rounded?: "full" | "xl";
  title?: string;
}) {
  const c = { ...DEFAULT_AVATAR, ...(config ?? {}) } as AvatarConfig;
  const skin = SKIN[c.skin] ?? SKIN.s3;
  const hair = HAIR_COLOR[c.hairColor] ?? HAIR_COLOR.brown;
  const outfit = OUTFIT_COLOR[c.outfitColor] ?? OUTFIT_COLOR.violet;
  const hidesHair = c.hat === "beanie" || c.hat === "wizard";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? "Player avatar"}
      className={`${rounded === "full" ? "rounded-full" : "rounded-2xl"} shrink-0 ${className}`}
    >
      <Background v={c.background} />
      {!hidesHair && <HairBack style={c.hair} c={hair} />}
      <Outfit style={c.outfit} c={outfit} skin={skin} />
      <rect x="52" y="76" width="16" height="14" rx="4" fill={skin} />
      <rect x="52" y="76" width="16" height="6" fill="#000" opacity="0.1" />
      <circle cx="36" cy="60" r="5.5" fill={skin} />
      <circle cx="84" cy="60" r="5.5" fill={skin} />
      <ellipse cx="60" cy="56" rx="24" ry="27" fill={skin} />
      <ellipse cx="45" cy="66" rx="4" ry="2.4" fill="#F472B6" opacity="0.22" />
      <ellipse cx="75" cy="66" rx="4" ry="2.4" fill="#F472B6" opacity="0.22" />
      {!hidesHair && <HairFront style={c.hair} c={hair} />}
      <Eyes style={c.eyes} />
      <Mouth style={c.mouth} />
      <Accessory style={c.accessory} />
      <Hat style={c.hat} c={outfit} />
    </svg>
  );
}
