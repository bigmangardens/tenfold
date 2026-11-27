import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="font-display text-7xl font-bold text-gradient">404</div>
      <p className="mt-3 text-ink-300">That page isn&apos;t one of today&apos;s ten.</p>
      <Link href="/" className="btn-primary mt-8">
        Go home
      </Link>
    </div>
  );
}
