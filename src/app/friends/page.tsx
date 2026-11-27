import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { FriendsClient, type FriendsData } from "./FriendsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Friends" };

export default async function FriendsPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/friends");
  const { data } = await supabase.rpc("get_friends");
  return <FriendsClient initial={(data ?? { friends: [], incoming: [], outgoing: [] }) as FriendsData} />;
}
