"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="text-5xl">😵</div>
      <h1 className="mt-4 font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-ink-400">{error.message || "Please try again."}</p>
      <button onClick={reset} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
