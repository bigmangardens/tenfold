"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";

const schema = z.object({
  category: z.enum(CATEGORIES),
  difficulty: z.coerce.number().int().min(1).max(3),
  prompt: z.string().trim().min(8, "Question is too short").max(300),
  options: z.array(z.string().trim().min(1, "All four answers are required").max(120)).length(4),
  correct_index: z.coerce.number().int().min(0).max(3),
  explanation: z.string().trim().min(1, "Add a short explanation").max(500),
  pool: z.enum(["daily", "practice"]),
  is_active: z.boolean(),
});

export type QState = { error?: string } | undefined;

export async function saveQuestion(_: QState, form: FormData): Promise<QState> {
  const id = String(form.get("id") ?? "");
  const parsed = schema.safeParse({
    category: form.get("category"),
    difficulty: form.get("difficulty"),
    prompt: form.get("prompt"),
    options: [0, 1, 2, 3].map((i) => String(form.get(`option${i}`) ?? "")),
    correct_index: form.get("correct_index"),
    explanation: form.get("explanation"),
    pool: form.get("pool"),
    is_active: form.get("is_active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (new Set(parsed.data.options.map((o) => o.toLowerCase())).size < 4) return { error: "Answers must be different." };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from("questions").update(parsed.data).eq("id", Number(id));
    if (error) return { error: error.message };
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("questions").insert({ ...parsed.data, created_by: user?.id });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/questions");
  redirect("/admin/questions?saved=1");
}

export async function deleteQuestion(_: QState, form: FormData): Promise<QState> {
  const id = Number(form.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    if (error.code === "23503")
      return { error: "This question has been used in a quiz, so it can't be deleted. Untick “Active” to retire it instead." };
    return { error: error.message };
  }
  revalidatePath("/admin/questions");
  redirect("/admin/questions?deleted=1");
}
