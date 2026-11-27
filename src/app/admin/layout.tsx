import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { AdminTabs } from "./AdminTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: { default: "Admin", template: "%s · Admin · Tenfold" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getSessionUser();
  if (!user) notFound();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!data?.is_admin) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">
          Admin <span className="chip ml-2 border-flame/30 text-flame">restricted</span>
        </h1>
        <AdminTabs />
      </div>
      {children}
    </div>
  );
}
