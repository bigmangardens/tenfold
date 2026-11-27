"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resendVerification, signIn } from "../actions";
import { FormMessage } from "../AuthShell";
import { SubmitButton } from "../SubmitButton";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signIn, undefined);
  const [resendState, resend] = useActionState(resendVerification, undefined);
  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.email} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="mb-1.5 text-xs text-brand-400 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        <FormMessage state={state} />
        <SubmitButton>Log in</SubmitButton>
      </form>
      {state?.email && /verify/i.test(state.error ?? "") && (
        <form action={resend} className="space-y-2">
          <input type="hidden" name="email" value={state.email} />
          <SubmitButton className="btn-ghost w-full">Resend verification email</SubmitButton>
          <FormMessage state={resendState} />
        </form>
      )}
    </div>
  );
}
