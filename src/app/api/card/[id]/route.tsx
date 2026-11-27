import { ImageResponse } from "next/og";
import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { createAnonClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { fmt } from "@/lib/format";
import { countryName } from "@/lib/countries";
import type { ShareCard } from "@/lib/types";

export const runtime = "nodejs";

/** The OG renderer only accepts plain SVG tags, so expand our (hook-free) components into them. */
function flatten(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(flatten);
  if (!isValidElement(node)) return node;
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (typeof el.type === "function") return flatten((el.type as (p: unknown) => ReactNode)(el.props));
  if ((el.type as unknown) === Fragment) return Children.toArray(el.props.children).map(flatten);
  const { children } = el.props;
  return children === undefined ? el : cloneElement(el, undefined, ...Children.toArray(children).map(flatten));
}

/** No emoji here: they would make the renderer fetch images from a CDN. 1200x630 spoiler-free result card (used for link previews and downloads). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const { data } = await createAnonClient().rpc("get_share_card", { p_attempt: id });
  if (!data) return new Response("Not found", { status: 404 });
  const c = data as ShareCard;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0C0E15 0%, #1B1745 55%, #0B2B3A 100%)",
          color: "#EEF0F7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, #9B83FF, #22D3EE)",
                display: "flex",
              }}
            />
            <div style={{ fontSize: 40, fontWeight: 800, display: "flex" }}>Tenfold</div>
          </div>
          <div style={{ fontSize: 30, color: "#9AA2BD", display: "flex" }}>Daily quiz no. {c.quiz_number}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <div style={{ display: "flex", width: 220, height: 220, borderRadius: 40, overflow: "hidden" }}>
            {flatten(<Avatar config={c.avatar} size={220} rounded="xl" />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 40, color: "#C9CEDF", display: "flex", gap: 14 }}>
              {c.username}
              {c.country ? <span style={{ color: "#6B7390" }}>{countryName(c.country)}</span> : null}
            </div>
            <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1, display: "flex", color: "#B4A2FF" }}>
              {fmt(c.score)}
            </div>
            <div style={{ fontSize: 30, color: "#9AA2BD", display: "flex" }}>
              {c.correct_count}/10 correct{c.streak > 1 ? `, ${c.streak}-day streak` : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {c.grid.map((g, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 14,
                background: g.c ? "#34D399" : "#F87171",
                display: "flex",
              }}
            />
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
  );
}
