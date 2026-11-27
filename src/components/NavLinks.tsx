"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { href: "/play", label: "Play", icon: "M8 5v14l11-7z" },
  { href: "/leaderboards", label: "Ranks", icon: "M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z" },
  { href: "/friends", label: "Friends", icon: "M16 11a4 4 0 10-4-4 4 4 0 004 4zM8 12a3 3 0 10-3-3 3 3 0 003 3zm8 1c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4zM8 14c-.3 0-.7 0-1.1.1C4.6 14.4 1 15.4 1 17.5V20h5v-3c0-1.2.6-2.2 2-3z" },
  { href: "/avatar", label: "Avatar", icon: "M12 12a5 5 0 10-5-5 5 5 0 005 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(href + "/") || (href === "/play" && path.startsWith("/practice"));
}

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={`tab ${isActive(path, l.href) ? "tab-active" : ""}`}>
          {l.label === "Ranks" ? "Leaderboards" : l.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileTabs() {
  const path = usePathname();
  if (path.startsWith("/play") || path.startsWith("/practice")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-ink-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-md justify-around">
        {LINKS.map((l) => {
          const active = isActive(path, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active ? "text-white" : "text-ink-400"}`}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden className={active ? "text-brand-400" : ""}>
                <path d={l.icon} />
              </svg>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
