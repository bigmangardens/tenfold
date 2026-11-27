"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/format";

async function run(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) throw new Error(friendlyError(error));
  revalidatePath("/admin/users");
  revalidatePath("/admin/flags");
}

export async function setBan(form: FormData) {
  await run("admin_set_ban", {
    p_user: String(form.get("user")),
    p_banned: form.get("banned") === "true",
    p_reason: String(form.get("reason") ?? "") || null,
  });
}

export async function resetUsername(form: FormData) {
  await run("admin_reset_username", { p_user: String(form.get("user")) });
}

export async function setAdmin(form: FormData) {
  await run("admin_set_admin", { p_user: String(form.get("user")), p_admin: form.get("admin") === "true" });
}

export async function reviewFlag(form: FormData) {
  await run("admin_review_flag", { p_flag: Number(form.get("flag")), p_action: String(form.get("action")) });
}
