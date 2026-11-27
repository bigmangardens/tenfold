import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { SettingsForm, type SettingsProfile } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/settings");
  const { data } = await supabase
    .from("profiles")
    .select("username,country,bio,show_country,show_stats,show_history,show_achievements")
    .eq("id", user.id)
    .single();
  return <SettingsForm profile={data as SettingsProfile} email={user.email ?? ""} />;
}
