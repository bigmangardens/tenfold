"use client";

import { useActionState, useEffect, useState } from "react";
import { signUp, resendVerification } from "../actions";
import { FormMessage } from "../AuthShell";
import { SubmitButton } from "../SubmitButton";
import { COUNTRIES } from "@/lib/countries";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [state, action] = useActionState(signUp, undefined);
  const [resendState, resend] = useActionState(resendVerification, undefined);
  const [username, setUsername] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setAvailable(null);
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return;
    const t = setTimeout(async () => {
      const { data } = await createClient().rpc("username_available", { p_username: username });
      setAvailable(!!data);
    }, 350);
    return () => clearTimeout(t);
  }, [username]);

  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-4xl">📬</div>
        <p className="text-ink-200">
          We sent a verification link to <span className="font-semibold text-white">{state.email}</span>.
        </p>
        <p className="text-sm text-ink-300">Click it to activate your account, then log in.</p>
        <form action={resend}>
          <input type="hidden" name="email" value={state.email} />
          <SubmitButton className="btn-ghost w-full">Resend email</SubmitButton>
        </form>
        <FormMessage state={resendState} />
      </div>
    );
  }

  const validName = /^[A-Za-z0-9_]{3,20}$/.test(username);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          required
          maxLength={20}
          autoComplete="username"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. QuizMaster_9"
        />
        <p className="mt-1.5 text-xs text-ink-400">
          {username && !validName && "3–20 letters, numbers or underscores."}
          {validName && available === true && <span className="text-good">✓ Available</span>}
          {validName && available === false && <span className="text-bad">Taken, try another</span>}
          {!username && "Shown on leaderboards. You can change it later."}
        </p>
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input"
        />
        <p className="mt-1.5 text-xs text-ink-400">At least 8 characters, with a letter and a number.</p>
      </div>
      <div>
        <label className="label" htmlFor="country">
          Country <span className="normal-case text-ink-400">(for country leaderboards)</span>
        </label>
        <select id="country" name="country" className="input" defaultValue="">
          <option value="">Prefer not to say</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <FormMessage state={state} />
      <SubmitButton>Create account</SubmitButton>
    </form>
  );
}
