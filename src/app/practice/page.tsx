import { QuizRunner } from "@/components/quiz/QuizRunner";

export const metadata = { title: "Practice" };

export default function PracticePage() {
  return <QuizRunner mode="practice" quizNumber={0} />;
}
