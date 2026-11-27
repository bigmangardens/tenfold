import { countryName, flagEmoji } from "@/lib/countries";

export function Flag({ code, className = "" }: { code: string | null | undefined; className?: string }) {
  if (!code) return null;
  return (
    <span className={className} title={countryName(code) ?? code} aria-label={countryName(code) ?? code}>
      {flagEmoji(code)}
    </span>
  );
}
