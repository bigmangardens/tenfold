import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_META, DIFFICULTY_LABEL } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";

const PAGE = 25;

export default async function QuestionsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; difficulty?: string; pool?: string; status?: string; page?: string; saved?: string; deleted?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("id,category,difficulty,prompt,pool,is_active,times_used,last_used_on", { count: "exact" })
    .order("id", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (sp.q) query = query.ilike("prompt", `%${sp.q.replace(/[%_]/g, "")}%`);
  if (sp.category) query = query.eq("category", sp.category);
  if (sp.difficulty) query = query.eq("difficulty", Number(sp.difficulty));
  if (sp.pool) query = query.eq("pool", sp.pool);
  if (sp.status === "active") query = query.eq("is_active", true);
  if (sp.status === "retired") query = query.eq("is_active", false);
  if (sp.status === "unused") query = query.eq("times_used", 0);
  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const qs = (o: Record<string, string | number>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...o }).filter(([k, v]) => v && !["saved", "deleted"].includes(k)) as [string, string][]);
    return `/admin/questions?${p}`;
  };

  return (
    <div className="space-y-4">
      {(sp.saved || sp.deleted) && (
        <p className="rounded-xl bg-good/10 px-4 py-2.5 text-sm text-good">{sp.saved ? "Question saved." : "Question deleted."}</p>
      )}
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search questions…" className="input max-w-xs" />
        <select name="category" defaultValue={sp.category ?? ""} className="input w-auto">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
        <select name="difficulty" defaultValue={sp.difficulty ?? ""} className="input w-auto">
          <option value="">Any difficulty</option>
          {[1, 2, 3].map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </option>
          ))}
        </select>
        <select name="pool" defaultValue={sp.pool ?? ""} className="input w-auto">
          <option value="">Any pool</option>
          <option value="daily">Daily</option>
          <option value="practice">Practice only</option>
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="input w-auto">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="retired">Retired</option>
          <option value="unused">Never used</option>
        </select>
        <button className="btn-ghost">Filter</button>
        <Link href="/admin/questions/new" className="btn-primary ml-auto">
          + New question
        </Link>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-ink-400">
            <tr className="border-b border-ink-700">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Pool</th>
              <th className="px-4 py-3">Used</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((q) => (
              <tr key={q.id} className={`border-b border-white/[0.04] hover:bg-white/[0.02] ${q.is_active ? "" : "opacity-50"}`}>
                <td className="px-4 py-3 text-ink-400">{q.id}</td>
                <td className="max-w-md px-4 py-3">
                  <Link href={`/admin/questions/${q.id}`} className="line-clamp-2 hover:underline">
                    {q.prompt}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {CATEGORY_META[q.category]?.icon} {CATEGORY_META[q.category]?.label}
                </td>
                <td className="px-4 py-3">{DIFFICULTY_LABEL[q.difficulty]}</td>
                <td className="px-4 py-3">{q.pool}</td>
                <td className="px-4 py-3 text-ink-300">
                  {q.times_used}× {q.last_used_on && <span className="text-xs text-ink-400">({q.last_used_on})</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-ink-400">
        <span>{count} questions</span>
        <div className="flex gap-2">
          {page > 1 && (
            <Link className="btn-ghost" href={qs({ page: page - 1 })}>
              ← Prev
            </Link>
          )}
          <span className="px-2 py-2">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link className="btn-ghost" href={qs({ page: page + 1 })}>
              Next →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
