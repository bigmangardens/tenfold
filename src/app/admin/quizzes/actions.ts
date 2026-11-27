"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/format";

const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export async function generateQuiz(form: FormData) {
  const date = String(form.get("date"));
  if (!isDate(date)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_generate_quiz", { p_date: date });
  if (error) throw new Error(friendlyError(error));
  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${date}`);
}

export async function deleteQuiz(form: FormData) {
  const date = String(form.get("date"));
  if (!isDate(date)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_quiz", { p_date: date });
  if (error) throw new Error(friendlyError(error));
  revalidatePath("/admin/quizzes");
}

export async function setQuiz(date: string, ids: number[]): Promise<{ error?: string; ok?: boolean }> {
  if (!isDate(date)) return { error: "Bad date" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_quiz", { p_date: date, p_question_ids: ids });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${date}`);
  return { ok: true };
}
