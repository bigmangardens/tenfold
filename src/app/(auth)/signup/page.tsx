import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell title="Join the daily ten" subtitle="Free forever. One ranked quiz a day, players worldwide.">
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-300">
        Already playing?{" "}
        <Link href="/login" className="font-semibold text-brand-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
