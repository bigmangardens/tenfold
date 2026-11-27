"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { AuthShell, FormMessage } from "../AuthShell";
import { SubmitButton } from "../SubmitButton";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a secure link. Accounts made without an email can't be reset.">
      <form action={action} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <FormMessage state={state} />
        <SubmitButton>Send reset link</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-ink-300">
        <Link href="/login" className="text-brand-400 hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
}
