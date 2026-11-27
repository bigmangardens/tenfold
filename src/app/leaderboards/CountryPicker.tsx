"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export function CountryPicker({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <select
      className="input w-auto py-1.5"
      value={value}
      aria-label="Country"
      onChange={(e) => {
        const p = new URLSearchParams(params.toString());
        p.set("country", e.target.value);
        p.set("scope", "country");
        router.push(`/leaderboards?${p.toString()}`);
      }}
    >
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
