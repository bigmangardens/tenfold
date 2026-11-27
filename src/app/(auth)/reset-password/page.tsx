"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updatePassword } from "../actions";
import { AuthShell, FormMessage } from "../AuthShell";
import { SubmitButton } from "../SubmitButton";

export default function ResetPasswordPage() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <AuthShell title="Choose a new password">
      {state?.ok ? (
        <div className="space-y-4 text-center">
          <FormMessage state={state} />
          <Link href="/dashboard" className="btn-primary w-full">
            Go to dashboard
          </Link>
        </div>
      ) : (
        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Confirm password
            </label>
            <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>
          <FormMessage state={state} />
          <SubmitButton>Update password</SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
