import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionForm, type QuestionRow } from "./QuestionForm";

export default async function EditQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "new") return <QuestionForm />;
  if (!/^\d+$/.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: q }, { data: stats }] = await Promise.all([
    supabase.from("questions").select("*").eq("id", Number(id)).maybeSingle(),
    supabase.from("attempt_answers").select("is_correct").eq("question_id", Number(id)).not("answered_at", "is", null).limit(5000),
  ]);
  if (!q) notFound();
  const answered = stats?.length ?? 0;
  const correct = stats?.filter((s) => s.is_correct).length ?? 0;
  return <QuestionForm q={q as QuestionRow} stats={{ answered, accuracy: answered ? Math.round((100 * correct) / answered) : null }} />;
}
