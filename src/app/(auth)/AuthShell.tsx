import { LogoMark } from "@/components/Logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-4 md:pt-10">
      <LogoMark size={48} />
      <h1 className="mt-5 text-center font-display text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-center text-sm text-ink-300">{subtitle}</p>}
      <div className="card mt-8 w-full animate-fade-up p-6 sm:p-8">{children}</div>
    </div>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p
      role="status"
      className={`rounded-xl px-3.5 py-2.5 text-sm ${state.error ? "bg-bad/10 text-bad" : "bg-good/10 text-good"}`}
    >
      {state.error ?? state.ok}
    </p>
  );
}
