import Link from "next/link";
import { getSessionUser } from "@/lib/supabase/server";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { NavLinks, MobileTabs } from "./NavLinks";
import { UserMenu } from "./UserMenu";
import type { AvatarConfig } from "@/lib/types";

export async function Nav() {
  const { supabase, user } = await getSessionUser();
  let username: string | null = null;
  let isAdmin = false;
  let avatar: AvatarConfig | null = null;
  if (user) {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("profiles").select("username,is_admin").eq("id", user.id).maybeSingle(),
      supabase.from("avatars").select("config").eq("user_id", user.id).maybeSingle(),
    ]);
    username = p?.username ?? null;
    isAdmin = !!p?.is_admin;
    avatar = (a?.config as AvatarConfig) ?? null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo href={user ? "/dashboard" : "/"} />
          {user && <NavLinks />}
          <div className="flex items-center gap-2">
            {user && username ? (
              <UserMenu username={username} isAdmin={isAdmin}>
                <Avatar config={avatar} size={36} />
              </UserMenu>
            ) : (
              <>
                <Link href="/leaderboards" className="btn-ghost hidden sm:inline-flex">
                  Leaderboards
                </Link>
                <Link href="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary">
                  Play free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {user && <MobileTabs />}
    </>
  );
}
