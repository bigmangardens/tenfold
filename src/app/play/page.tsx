import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import type { Dashboard } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Today's quiz" };

export default async function PlayPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/login?next=/play");
  const { data, error } = await supabase.rpc("get_dashboard");
  if (error) throw new Error(error.message);
  const d = data as Dashboard;
  if (d.today.status === "finished" && d.today.attempt_id) redirect(`/results/${d.today.attempt_id}`);
  if (d.profile.is_banned) redirect("/dashboard");
  return <QuizRunner mode="ranked" resuming={d.today.status === "in_progress"} quizNumber={d.today.quiz_number} />;
}
