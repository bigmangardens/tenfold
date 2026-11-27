"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/admin", "Overview"],
  ["/admin/questions", "Prompts"],
  ["/admin/quizzes", "Schedule"],
  ["/admin/users", "Users"],
  ["/admin/flags", "Suspicious scores"],
];

export function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-ink-700 bg-ink-900 p-1">
      {TABS.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`tab ${active ? "tab-active" : ""}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
