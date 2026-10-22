"use client";

import { ChartColumnIcon, CircleHelpIcon, ListOrderedIcon, TableIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TerritoryGlyph } from "@/components/app/parts";
import { cn } from "@/lib/utils";

/*
 * The pictures Ask X-Ray draws (backend ask.tools.ts: show_ranking, show_chart, show_table).
 * The model's tool input is the picture. Inputs arrive as unknown JSON, so each block checks
 * what it needs and draws nothing it can't read. Every block ends with how to read it.
 */

type Ranking = { title: string; items: { name: string; position: number; holder: "yours" | "shared" | "theirs"; note?: string }[]; howToRead: string };
type Chart = { title: string; type: "bar" | "line"; labels: string[]; series: { name: string; values: number[] }[]; yLabel: string; howToRead: string };
type Table = { title: string; columns: string[]; rows: string[][]; howToRead: string };

const TERRITORY = { yours: "yours", shared: "contested", theirs: "theirs" } as const;
const SERIES = ["var(--ember)", "var(--foreground)", "var(--muted-foreground)"];
const ordinal = (n: number) => (n === 1 ? "Top pick" : n % 100 >= 11 && n % 100 <= 13 ? `${n}th` : `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`);

function Frame({ icon: Icon, title, howToRead, children }: { icon: typeof ChartColumnIcon; title: string; howToRead?: string; children: React.ReactNode }) {
  return (
    <figure className="max-w-[620px] rounded-[14px] border bg-card px-4 pt-3.5 pb-3 sm:px-5">
      <figcaption className="flex items-center justify-between gap-3">
        <span className="text-[13.5px] font-semibold">{title}</span>
        <Icon className="size-3.5 text-faint" strokeWidth={1.75} aria-hidden />
      </figcaption>
      <div className="mt-3">{children}</div>
      {howToRead && (
        <p className="mt-3 flex items-start gap-1.5 border-t pt-2.5 text-[12px] leading-relaxed text-muted-foreground">
          <CircleHelpIcon className="mt-0.5 size-3.5 shrink-0 text-faint" strokeWidth={1.75} aria-hidden />
          {howToRead}
        </p>
      )}
    </figure>
  );
}

function RankingBlock({ spec }: { spec: Ranking }) {
  const items = [...spec.items].sort((a, b) => a.position - b.position);
  const last = Math.max(...items.map((i) => i.position), items.length);
  return (
    <Frame icon={ListOrderedIcon} title={spec.title} howToRead={spec.howToRead}>
      <ol className="space-y-2.5">
        {items.map((i) => (
          <li key={`${i.position}-${i.name}`} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 max-sm:grid-cols-[1fr_auto]">
            <span className="flex min-w-0 items-center gap-2">
              <TerritoryGlyph kind={TERRITORY[i.holder] ?? "yours"} decorative />
              <span className="min-w-0">
                <span className="block truncate text-[13px]">{i.name}</span>
                {i.note && <span className="block truncate text-[11.5px] text-muted-foreground">{i.note}</span>}
              </span>
            </span>
            <span className="h-2 rounded-full bg-soft max-sm:hidden" aria-hidden>
              <span className={cn("block h-full rounded-full", i.holder === "yours" ? "bg-ember" : "bg-foreground/70")} style={{ width: `${Math.max(12, 100 - ((i.position - 1) / last) * 85)}%` }} />
            </span>
            <span className="text-[12px] text-muted-foreground">{ordinal(i.position)}</span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

function ChartBlock({ spec }: { spec: Chart }) {
  const rows = spec.labels.map((label, i) => Object.fromEntries([["label", label], ...spec.series.map((s) => [s.name, s.values[i] ?? 0])]));
  const axis = { tickLine: false, axisLine: false, tick: { fill: "var(--muted-foreground)", fontSize: 11.5 } };
  const common = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis dataKey="label" {...axis} interval={0} />
      <YAxis {...axis} width={32} allowDecimals={false} label={{ value: spec.yLabel, angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11, dy: 40 }} />
      <Tooltip cursor={{ fill: "var(--soft)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
      {spec.series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
    </>
  );
  return (
    <Frame icon={ChartColumnIcon} title={spec.title} howToRead={spec.howToRead}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {spec.type === "line" ? (
            <LineChart data={rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              {common}
              {spec.series.map((s, i) => <Line key={s.name} dataKey={s.name} stroke={SERIES[i]} strokeWidth={2} dot={{ r: 3 }} />)}
            </LineChart>
          ) : (
            <BarChart data={rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              {common}
              {spec.series.map((s, i) => <Bar key={s.name} dataKey={s.name} fill={SERIES[i]} radius={[4, 4, 0, 0]} maxBarSize={36} />)}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Frame>
  );
}

function TableBlock({ spec }: { spec: Table }) {
  return (
    <Frame icon={TableIcon} title={spec.title} howToRead={spec.howToRead}>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b text-[12px] text-muted-foreground">
              {spec.columns.map((c) => (
                <th key={c} className="px-1 pb-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-soft">
            {spec.rows.map((r, i) => (
              <tr key={i}>
                {spec.columns.map((_, j) => (
                  <td key={j} className={cn("px-1 py-2", j === 0 ? "font-medium" : /strong/i.test(r[j] ?? "") ? "text-foreground" : "text-muted-foreground")}>
                    {r[j] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Draws one picture from a tool's input, once it's complete. */
export function Visual({ tool, input, ready }: { tool: string; input: unknown; ready: boolean }) {
  if (!ready || !isObj(input) || typeof input.title !== "string") {
    return <div className="h-24 max-w-[620px] animate-pulse rounded-[14px] border bg-muted/40" aria-label="Drawing" />;
  }
  if (tool === "show_ranking" && Array.isArray(input.items)) return <RankingBlock spec={input as Ranking} />;
  if (tool === "show_chart" && Array.isArray(input.labels) && Array.isArray(input.series)) return <ChartBlock spec={input as Chart} />;
  if (tool === "show_table" && Array.isArray(input.columns) && Array.isArray(input.rows)) return <TableBlock spec={input as Table} />;
  return null;
}
