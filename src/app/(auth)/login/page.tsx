import Link from "next/link";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Today's ten questions are waiting.">
      {error === "link" && (
        <p className="mb-4 rounded-xl bg-bad/10 px-3.5 py-2.5 text-sm text-bad">
          That link is invalid or has expired. Try again.
        </p>
      )}
      <LoginForm next={next ?? "/dashboard"} />
      <p className="mt-6 text-center text-sm text-ink-300">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand-400 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
