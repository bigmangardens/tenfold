"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/types";

const schema = z.object({
  category: z.enum(CATEGORIES),
  difficulty: z.coerce.number().int().min(1).max(3),
  prompt: z.string().trim().min(8, "Prompt is too short").max(300),
  explanation: z.string().trim().max(500),
  pool: z.enum(["daily", "practice"]),
  is_active: z.boolean(),
  answers: z
    .array(z.object({ answer: z.string().min(1).max(80), aliases: z.array(z.string().max(80)) }))
    .min(3, "Add at least 3 valid answers"),
});

export type QState = { error?: string } | undefined;

/** One answer per line, most common first. Extra spellings after a "|": "United Kingdom | UK | Britain". */
function parseAnswers(raw: string) {
  return raw
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()).filter(Boolean))
    .filter((parts) => parts.length > 0)
    .map(([answer, ...aliases]) => ({ answer, aliases }));
}

export async function saveQuestion(_: QState, form: FormData): Promise<QState> {
  const id = String(form.get("id") ?? "");
  const parsed = schema.safeParse({
    category: form.get("category"),
    difficulty: form.get("difficulty"),
    prompt: form.get("prompt"),
    explanation: String(form.get("explanation") ?? ""),
    pool: form.get("pool"),
    is_active: form.get("is_active") === "on",
    answers: parseAnswers(String(form.get("answers") ?? "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_save_question", { p_id: id ? Number(id) : null, p_data: parsed.data });
  if (error) return { error: error.message };
  revalidatePath("/admin/questions");
  redirect("/admin/questions?saved=1");
}

export async function deleteQuestion(_: QState, form: FormData): Promise<QState> {
  const id = Number(form.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    if (error.code === "23503")
      return { error: "This prompt has been used in a quiz, so it can't be deleted. Untick “Active” to retire it instead." };
    return { error: error.message };
  }
  revalidatePath("/admin/questions");
  redirect("/admin/questions?deleted=1");
}
