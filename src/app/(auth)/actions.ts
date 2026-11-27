"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext, siteUrl } from "@/lib/format";
import { COUNTRY_CODES } from "@/lib/countries";

export type FormState = { error?: string; ok?: string; email?: string } | undefined;

/** Accounts made without an email get this internal placeholder domain. Nothing is ever sent to it. */
const NO_EMAIL_DOMAIN = "noemail.tenfold.invalid";
const placeholderEmail = (username: string) => `${username.toLowerCase()}@${NO_EMAIL_DOMAIN}`;

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[A-Za-z]/, "Password needs at least one letter")
  .regex(/[0-9]/, "Password needs at least one number");

const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email, or leave it blank"),
  password,
  username: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,20}$/, "Username: 3–20 letters, numbers or underscores"),
  country: z
    .string()
    .optional()
    .transform((v) => (v && COUNTRY_CODES.has(v) ? v : undefined)),
});

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, username, country } = parsed.data;

  const supabase = await createClient();
  const { data: available, error: availErr } = await supabase.rpc("username_available", { p_username: username });
  if (availErr) return { error: "Could not check that username. Please try again." };
  if (!available) return { error: "That username is taken. Try another." };

  const { data, error } = await supabase.auth.signUp({
    email: email || placeholderEmail(username),
    password,
    options: {
      data: { username, country },
      emailRedirectTo: `${siteUrl()}/auth/confirm?next=/dashboard`,
    },
  });
  if (error) {
    if (/already registered/i.test(error.message)) return { error: "That username or email already has an account." };
    return { error: error.message };
  }
  if (data.session) redirect("/dashboard");
  return { ok: "Check your inbox to verify your email, then log in.", email };
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const login = String(form.get("email") ?? "").trim();
  const pwd = String(form.get("password") ?? "");
  if (!login || !pwd) return { error: "Enter your username (or email) and password." };
  const supabase = await createClient();
  let email = login;
  if (!login.includes("@")) {
    // Username login: only works for accounts created without an email.
    const { data } = await supabase.rpc("login_email_for", { p_username: login });
    if (!data) return { error: "Incorrect username or password. If you signed up with an email, log in with your email." };
    email = data as string;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
  if (error) {
    if (/confirm/i.test(error.message))
      return { error: "Please verify your email first. We can resend the link.", email };
    return { error: "Incorrect username or password." };
  }
  redirect(safeNext(String(form.get("next") ?? "")));
}

export async function resendVerification(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=/dashboard` },
  });
  if (error) return { error: error.message, email };
  return { ok: "Verification email sent.", email };
}

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email." };
  if (email.toLowerCase().endsWith("@" + NO_EMAIL_DOMAIN)) return { error: "Accounts without an email can't reset their password." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/confirm?next=/reset-password`,
  });
  // Same response whether or not the account exists, to avoid leaking emails.
  return { ok: "If that email has an account, a reset link is on its way." };
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  const parsed = password.safeParse(String(form.get("password") ?? ""));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (form.get("password") !== form.get("confirm")) return { error: "Passwords don't match." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: error.message };
  return { ok: "Password updated." };
}
