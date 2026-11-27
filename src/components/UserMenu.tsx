"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function UserMenu({
  username,
  isAdmin,
  children,
}: {
  username: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const item = "block rounded-lg px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.06] hover:text-white";
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border-2 border-ink-600 p-0.5 pr-3 transition hover:border-brand"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {children}
        <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:block">{username}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="card absolute right-0 mt-2 w-52 animate-fade-up p-1.5"
        >
          <Link href={`/u/${username}`} className={item}>
            My profile
          </Link>
          <Link href="/avatar" className={item}>
            Edit avatar
          </Link>
          <Link href="/practice" className={item}>
            Practice mode
          </Link>
          <Link href="/how-to-play" className={item}>
            How scoring works
          </Link>
          <Link href="/settings" className={item}>
            Settings
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`${item} text-flame`}>
              Admin
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className={`${item} w-full text-left text-bad`}>Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}
