import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { AvatarEditor } from "./AvatarEditor";
import type { AvatarConfig, Cosmetic } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avatar" };

export default async function AvatarPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/avatar");
  const [{ data: av }, { data: items }, { data: profile }] = await Promise.all([
    supabase.from("avatars").select("config").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("get_my_cosmetics"),
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
  ]);
  return (
    <AvatarEditor
      initial={(av?.config ?? {}) as AvatarConfig}
      items={(items ?? []) as Cosmetic[]}
      username={profile?.username ?? ""}
    />
  );
}
